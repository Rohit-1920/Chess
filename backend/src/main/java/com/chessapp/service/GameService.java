package com.chessapp.service;

import com.chessapp.dto.request.CreateGameRequest;
import com.chessapp.dto.request.MakeMoveRequest;
import com.chessapp.dto.response.GameResponse;
import com.chessapp.dto.response.MoveResponse;
import com.chessapp.enums.AiDifficulty;
import com.chessapp.enums.GameMode;
import com.chessapp.enums.GameStatus;
import com.chessapp.enums.GameTheme;
import com.chessapp.exception.BadRequestException;
import com.chessapp.exception.ForbiddenException;
import com.chessapp.exception.ResourceNotFoundException;
import com.chessapp.model.Game;
import com.chessapp.model.Move;
import com.chessapp.model.User;
import com.chessapp.repository.GameRepository;
import com.chessapp.repository.MoveRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class GameService {

    private final GameRepository      gameRepository;
    private final MoveRepository      moveRepository;
    private final UserService         userService;
    private final ChessEngineService  chessEngineService;
    private final OllamaService       ollamaService;

    // ─── Create Game ─────────────────────────────────────────────

    @Transactional
    public GameResponse createGame(Long requestingUserId, CreateGameRequest req) {
        // Guest users (null userId) can only create LOCAL_MULTIPLAYER games
        if (requestingUserId == null) {
            if (!GameMode.LOCAL_MULTIPLAYER.equals(req.getGameMode())) {
                throw new BadRequestException("Please sign in to play vs AI or online multiplayer");
            }
        }

        User creator = requestingUserId != null ? userService.getUser(requestingUserId) : null;
        GameTheme theme = req.getTheme() != null ? req.getTheme()
                : (creator != null ? creator.getPreferredTheme() : GameTheme.CLASSIC);

        Game.GameBuilder builder = Game.builder()
                .gameMode(req.getGameMode())
                .theme(theme)
                .currentFen(Game.INITIAL_FEN);

        switch (req.getGameMode()) {
            case AI -> {
                if (creator == null) throw new BadRequestException("Sign in required to play vs AI");
                AiDifficulty difficulty = req.getAiDifficulty() != null ? req.getAiDifficulty() : AiDifficulty.MEDIUM;
                String aiColor = (req.getAiPlaysAs() != null
                        && req.getAiPlaysAs().equalsIgnoreCase("WHITE")) ? "WHITE" : "BLACK";
                builder.aiDifficulty(difficulty).aiPlaysAs(aiColor).status(GameStatus.IN_PROGRESS);
                if ("BLACK".equals(aiColor)) {
                    builder.whitePlayer(creator);
                } else {
                    builder.blackPlayer(creator);
                }
            }
            case LOCAL_MULTIPLAYER -> {
                // Guest OR logged-in user — no player assignment needed
                builder.status(GameStatus.IN_PROGRESS);
                if (creator != null) builder.whitePlayer(creator);
            }
            case ONLINE_MULTIPLAYER -> {
                if (creator == null) throw new BadRequestException("Sign in required for online multiplayer");
                builder.whitePlayer(creator).status(GameStatus.WAITING);
                if (req.getOpponentUsername() != null && !req.getOpponentUsername().isBlank()) {
                    userService.findByUsername(req.getOpponentUsername())
                            .ifPresent(opponent -> builder.blackPlayer(opponent));
                }
            }
        }

        Game game = gameRepository.save(builder.build());
        log.info("Game created: id={} mode={} by userId={}", game.getId(), game.getGameMode(), requestingUserId);

        // AI plays first if it's white
        if (game.isAiGame() && "WHITE".equals(game.getAiPlaysAs())) {
            game = makeAiMove(game);
        }

        return GameResponse.from(game, requestingUserId);
    }

    // ─── Join Game ────────────────────────────────────────────────

    @Transactional
    public GameResponse joinGame(Long gameId, Long userId) {
        Game game = getGameOrThrow(gameId);
        User joiner = userService.getUser(userId);

        if (!GameMode.ONLINE_MULTIPLAYER.equals(game.getGameMode())) {
            throw new BadRequestException("This game does not support joining");
        }
        if (!GameStatus.WAITING.equals(game.getStatus())) {
            throw new BadRequestException("This game is not available to join");
        }
        if (game.hasPlayer(userId)) {
            throw new BadRequestException("You are already in this game");
        }

        game.setBlackPlayer(joiner);
        game.setStatus(GameStatus.IN_PROGRESS);
        game = gameRepository.save(game);
        log.info("User {} joined game {}", userId, gameId);
        return GameResponse.from(game, userId);
    }

    // ─── Make Move ────────────────────────────────────────────────

    @Transactional
    public MoveResponse makeMove(Long gameId, Long userId, MakeMoveRequest req) {
        Game game = getGameOrThrow(gameId);
        validateMoveAllowed(game, userId, req);

        String newFen = chessEngineService.applyMove(
                game.getCurrentFen(), req.getFromSquare(), req.getToSquare(), req.getPromotionPiece());

        Move humanMove = persistMove(game, userId, req.getFromSquare(), req.getToSquare(),
                req.getPromotionPiece(), newFen, false);
        game.setCurrentFen(newFen);
        game.setMoveCount(game.getMoveCount() + 1);

        MoveResponse.MoveResponseBuilder responseBuilder = MoveResponse.from(humanMove).toBuilder();

        if (chessEngineService.isGameOver(newFen)) {
            finaliseGame(game, newFen, userId);
        } else if (game.isAiGame()) {
            game = makeAiMove(game);
            Move lastAiMove = moveRepository.findTopByGameIdOrderByMoveNumberDesc(gameId);
            if (lastAiMove != null) {
                responseBuilder.aiMove(MoveResponse.from(lastAiMove));
            }
            if (chessEngineService.isGameOver(game.getCurrentFen())) {
                finaliseGame(game, game.getCurrentFen(), null);
            }
        }

        game = gameRepository.save(game);
        responseBuilder.game(GameResponse.from(game, userId));
        return responseBuilder.build();
    }

    // ─── Resign ───────────────────────────────────────────────────

    @Transactional
    public GameResponse resign(Long gameId, Long userId) {
        Game game = getGameOrThrow(gameId);
        if (!game.hasPlayer(userId)) throw new ForbiddenException("You are not a player in this game");
        if (!GameStatus.IN_PROGRESS.equals(game.getStatus())) throw new BadRequestException("Game is not in progress");

        String myColor = game.getColorForPlayer(userId);
        User winner = "WHITE".equals(myColor) ? game.getBlackPlayer() : game.getWhitePlayer();
        game.setStatus(GameStatus.COMPLETED);
        game.setWinner(winner);
        game = gameRepository.save(game);
        updateStats(game, winner);
        return GameResponse.from(game, userId);
    }

    // ─── Queries ──────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public GameResponse getGame(Long gameId, Long requestingUserId) {
        return GameResponse.from(getGameOrThrow(gameId), requestingUserId);
    }

    @Transactional(readOnly = true)
    public List<GameResponse> getMyGames(Long userId, int page, int size) {
        User user = userService.getUser(userId);
        Page<Game> games = gameRepository.findByPlayer(user, PageRequest.of(page, size));
        return games.getContent().stream()
                .map(g -> GameResponse.from(g, userId))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<GameResponse> getOpenLobbies() {
        return gameRepository.findByStatusOrderByCreatedAtAsc(GameStatus.WAITING)
                .stream().map(GameResponse::from).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MoveResponse> getMovesForGame(Long gameId) {
        return moveRepository.findByGameIdOrderByMoveNumberAsc(gameId)
                .stream().map(MoveResponse::from).collect(Collectors.toList());
    }

    // ─── Internal ─────────────────────────────────────────────────

    private Game makeAiMove(Game game) {
        List<String> legalMoves = chessEngineService.getLegalMovesUci(game.getCurrentFen());
        if (legalMoves.isEmpty()) return game;
        String uci = ollamaService.getAiMove(game.getCurrentFen(), game.getAiDifficulty(), legalMoves);
        if (uci == null) return game;
        String[] parts = chessEngineService.parseUci(uci);
        String promo = parts[2].isBlank() ? null : parts[2];
        String newFen = chessEngineService.applyMove(game.getCurrentFen(), parts[0], parts[1], promo);
        persistMove(game, null, parts[0], parts[1], promo, newFen, true);
        game.setCurrentFen(newFen);
        game.setMoveCount(game.getMoveCount() + 1);
        return gameRepository.save(game);
    }

    private Move persistMove(Game game, Long playerId, String from, String to,
                             String promo, String fenAfter, boolean isAi) {
        User player = playerId != null ? userService.getUser(playerId) : null;
        Move move = Move.builder()
                .game(game).player(player)
                .moveNumber(game.getMoveCount() + 1)
                .fromSquare(from).toSquare(to)
                .promotionPiece(promo).fenAfterMove(fenAfter)
                .isAiMove(isAi).build();
        return moveRepository.save(move);
    }

    private void finaliseGame(Game game, String fen, Long lastMovingUserId) {
        if (chessEngineService.isCheckmate(fen)) {
            String loserColor = chessEngineService.getSideToMove(fen);
            User winner = "WHITE".equals(loserColor) ? game.getBlackPlayer() : game.getWhitePlayer();
            game.setStatus(GameStatus.COMPLETED);
            game.setWinner(winner);
            updateStats(game, winner);
        } else {
            game.setStatus(GameStatus.DRAW);
            if (game.getWhitePlayer() != null) userService.recordDraw(game.getWhitePlayer().getId());
            if (game.getBlackPlayer() != null) userService.recordDraw(game.getBlackPlayer().getId());
        }
    }

    private void updateStats(Game game, User winner) {
        if (winner == null) return;
        Long whiteId = game.getWhitePlayer() != null ? game.getWhitePlayer().getId() : null;
        Long blackId = game.getBlackPlayer() != null ? game.getBlackPlayer().getId() : null;
        if (winner.getId().equals(whiteId)) {
            userService.recordWin(whiteId);
            if (blackId != null) userService.recordLoss(blackId);
        } else if (winner.getId().equals(blackId)) {
            userService.recordWin(blackId);
            if (whiteId != null) userService.recordLoss(whiteId);
        }
    }

    private void validateMoveAllowed(Game game, Long userId, MakeMoveRequest req) {
        if (!GameStatus.IN_PROGRESS.equals(game.getStatus())) {
            throw new BadRequestException("Game is not in progress");
        }
        // For LOCAL_MULTIPLAYER — no auth check needed, anyone can move
        if (GameMode.LOCAL_MULTIPLAYER.equals(game.getGameMode())) return;

        // For AI and ONLINE — must be a player and must be your turn
        if (userId == null) throw new ForbiddenException("Sign in required");
        if (!game.hasPlayer(userId)) throw new ForbiddenException("You are not a player in this game");

        String sideToMove = chessEngineService.getSideToMove(game.getCurrentFen());
        String playerColor = game.getColorForPlayer(userId);
        if (!sideToMove.equals(playerColor)) {
            throw new BadRequestException("It is not your turn");
        }
        if (GameMode.AI.equals(game.getGameMode()) && sideToMove.equals(game.getAiPlaysAs())) {
            throw new BadRequestException("It is the AI's turn");
        }
    }

    private Game getGameOrThrow(Long gameId) {
        return gameRepository.findByIdWithPlayers(gameId)
                .orElseThrow(() -> new ResourceNotFoundException("Game", gameId));
    }
}
