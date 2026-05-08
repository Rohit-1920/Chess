package com.chessapp.service;

import com.chessapp.dto.request.CreateGameRequest;
import com.chessapp.dto.request.MakeMoveRequest;
import com.chessapp.dto.response.GameResponse;
import com.chessapp.dto.response.MoveResponse;
import com.chessapp.enums.AiDifficulty;
import com.chessapp.enums.GameMode;
import com.chessapp.enums.GameStatus;
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
        User creator = userService.getUser(requestingUserId);

        validateCreateRequest(req, requestingUserId);

        GameTheme theme = req.getTheme() != null ? req.getTheme() : creator.getPreferredTheme();

        Game.GameBuilder builder = Game.builder()
                .gameMode(req.getGameMode())
                .theme(theme)
                .currentFen(Game.INITIAL_FEN);

        switch (req.getGameMode()) {

            case AI -> {
                AiDifficulty difficulty = req.getAiDifficulty() != null
                        ? req.getAiDifficulty() : AiDifficulty.MEDIUM;
                String aiColor = (req.getAiPlaysAs() != null
                        && req.getAiPlaysAs().equalsIgnoreCase("WHITE")) ? "WHITE" : "BLACK";

                builder.aiDifficulty(difficulty)
                       .aiPlaysAs(aiColor)
                       .status(GameStatus.IN_PROGRESS);

                // Assign player colours
                if ("BLACK".equals(aiColor)) {
                    builder.whitePlayer(creator); // human is white
                } else {
                    builder.blackPlayer(creator); // human is black
                }
            }

            case LOCAL_MULTIPLAYER -> {
                // No sign-in needed; both players share the device
                builder.whitePlayer(creator)
                       .status(GameStatus.IN_PROGRESS);
            }

            case ONLINE_MULTIPLAYER -> {
                // Creator plays white; awaiting second player
                builder.whitePlayer(creator)
                       .status(GameStatus.WAITING);

                if (req.getOpponentUsername() != null && !req.getOpponentUsername().isBlank()) {
                    // Direct challenge — pre-assign the black player
                    userService.findByUsername(req.getOpponentUsername()).ifPresent(opponent ->
                        builder.blackPlayer(opponent).status(GameStatus.WAITING)
                    );
                }
            }
        }

        Game game = gameRepository.save(builder.build());
        log.info("Game created: id={} mode={} by userId={}", game.getId(), game.getGameMode(), requestingUserId);

        // If AI plays WHITE it moves first
        if (game.isAiGame() && "WHITE".equals(game.getAiPlaysAs())) {
            game = makeAiMove(game);
        }

        return GameResponse.from(game, requestingUserId);
    }

    // ─── Join Game (Online Multiplayer) ──────────────────────────

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

    // ─── Make a Move ─────────────────────────────────────────────

    @Transactional
    public MoveResponse makeMove(Long gameId, Long userId, MakeMoveRequest req) {
        Game game = getGameOrThrow(gameId);
        validateMoveAllowed(game, userId, req);

        // Apply the human move
        String newFen = chessEngineService.applyMove(
                game.getCurrentFen(),
                req.getFromSquare(),
                req.getToSquare(),
                req.getPromotionPiece());

        Move humanMove = persistMove(game, userId, req.getFromSquare(), req.getToSquare(),
                req.getPromotionPiece(), newFen, false);
        game.setCurrentFen(newFen);
        game.setMoveCount(game.getMoveCount() + 1);

        // Check if game ended after human's move
        MoveResponse.MoveResponseBuilder responseBuilder = MoveResponse.from(humanMove).toBuilder();

        if (chessEngineService.isGameOver(newFen)) {
            finaliseGame(game, newFen, userId);
        } else if (game.isAiGame()) {
            // AI responds immediately
            game = makeAiMove(game);
            Move lastAiMove = moveRepository.findTopByGameIdOrderByMoveNumberDesc(gameId);
            MoveResponse aiMoveResponse = MoveResponse.from(lastAiMove);
            responseBuilder.aiMove(aiMoveResponse);

            if (chessEngineService.isGameOver(game.getCurrentFen())) {
                finaliseGame(game, game.getCurrentFen(), null); // null = AI won
            }
        }

        game = gameRepository.save(game);
        responseBuilder.game(GameResponse.from(game, userId));
        return responseBuilder.build();
    }

    // ─── Resign ──────────────────────────────────────────────────

    @Transactional
    public GameResponse resign(Long gameId, Long userId) {
        Game game = getGameOrThrow(gameId);

        if (!game.hasPlayer(userId)) {
            throw new ForbiddenException("You are not a player in this game");
        }
        if (!GameStatus.IN_PROGRESS.equals(game.getStatus())) {
            throw new BadRequestException("Game is not in progress");
        }

        // The other player wins
        String myColor = game.getColorForPlayer(userId);
        User winner = "WHITE".equals(myColor) ? game.getBlackPlayer() : game.getWhitePlayer();

        game.setStatus(GameStatus.COMPLETED);
        game.setWinner(winner);
        game = gameRepository.save(game);

        updateStats(game, winner);

        log.info("User {} resigned from game {}", userId, gameId);
        return GameResponse.from(game, userId);
    }

    // ─── Get Game ────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public GameResponse getGame(Long gameId, Long requestingUserId) {
        Game game = getGameOrThrow(gameId);
        return GameResponse.from(game, requestingUserId);
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
                .stream()
                .map(GameResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MoveResponse> getMovesForGame(Long gameId) {
        return moveRepository.findByGameIdOrderByMoveNumberAsc(gameId)
                .stream()
                .map(MoveResponse::from)
                .collect(Collectors.toList());
    }

    // ─── Internal — AI Move ──────────────────────────────────────

    private Game makeAiMove(Game game) {
        List<String> legalMoves = chessEngineService.getLegalMovesUci(game.getCurrentFen());
        if (legalMoves.isEmpty()) return game;

        String uci = ollamaService.getAiMove(game.getCurrentFen(), game.getAiDifficulty(), legalMoves);
        if (uci == null) return game;

        String[] parts = chessEngineService.parseUci(uci);
        String from  = parts[0];
        String to    = parts[1];
        String promo = parts[2].isBlank() ? null : parts[2];

        String newFen = chessEngineService.applyMove(game.getCurrentFen(), from, to, promo);
        persistMove(game, null, from, to, promo, newFen, true);
        game.setCurrentFen(newFen);
        game.setMoveCount(game.getMoveCount() + 1);
        return gameRepository.save(game);
    }

    // ─── Internal — Persist ──────────────────────────────────────

    private Move persistMove(Game game, Long playerId,
                             String from, String to, String promo,
                             String fenAfter, boolean isAi) {
        User player = playerId != null ? userService.getUser(playerId) : null;
        int  moveNum = game.getMoveCount() + 1;

        Move move = Move.builder()
                .game(game)
                .player(player)
                .moveNumber(moveNum)
                .fromSquare(from)
                .toSquare(to)
                .promotionPiece(promo)
                .fenAfterMove(fenAfter)
                .isAiMove(isAi)
                .build();

        return moveRepository.save(move);
    }

    // ─── Internal — Game End ─────────────────────────────────────

    private void finaliseGame(Game game, String fen, Long lastMovingUserId) {
        if (chessEngineService.isCheckmate(fen)) {
            // The player whose turn it WOULD have been lost → last mover won
            String loserColor = chessEngineService.getSideToMove(fen);
            User winner;
            if ("WHITE".equals(loserColor)) {
                winner = game.getBlackPlayer(); // black checkmated white
            } else {
                winner = game.getWhitePlayer();
            }
            game.setStatus(GameStatus.COMPLETED);
            game.setWinner(winner);
            updateStats(game, winner);
        } else {
            // Stalemate / draw
            game.setStatus(GameStatus.DRAW);
            if (game.getWhitePlayer() != null) userService.recordDraw(game.getWhitePlayer().getId());
            if (game.getBlackPlayer() != null) userService.recordDraw(game.getBlackPlayer().getId());
        }
    }

    private void updateStats(Game game, User winner) {
        if (winner == null) return;

        Long whitId = game.getWhitePlayer() != null ? game.getWhitePlayer().getId() : null;
        Long blackId = game.getBlackPlayer() != null ? game.getBlackPlayer().getId() : null;

        if (winner.getId().equals(whitId)) {
            userService.recordWin(whitId);
            if (blackId != null) userService.recordLoss(blackId);
        } else if (winner.getId().equals(blackId)) {
            userService.recordWin(blackId);
            if (whitId != null) userService.recordLoss(whitId);
        }
    }

    // ─── Internal — Validation ───────────────────────────────────

    private void validateCreateRequest(CreateGameRequest req, Long userId) {
        if (GameMode.AI.equals(req.getGameMode()) && req.getAiDifficulty() == null) {
            req.setAiDifficulty(AiDifficulty.MEDIUM); // sensible default
        }

        long activeGames = gameRepository.countActiveGamesByUserId(userId);
        if (activeGames >= 10) {
            throw new BadRequestException("You have too many active games. Please finish or resign them first.");
        }
    }

    private void validateMoveAllowed(Game game, Long userId, MakeMoveRequest req) {
        if (!GameStatus.IN_PROGRESS.equals(game.getStatus())) {
            throw new BadRequestException("Game is not in progress");
        }

        // Determine whose turn it is from FEN
        String sideToMove = chessEngineService.getSideToMove(game.getCurrentFen()); // "WHITE" | "BLACK"

        if (GameMode.AI.equals(game.getGameMode()) || GameMode.ONLINE_MULTIPLAYER.equals(game.getGameMode())) {
            // Player must be in this game
            if (!game.hasPlayer(userId)) {
                throw new ForbiddenException("You are not a player in this game");
            }
            // Player must play their correct colour
            String playerColor = game.getColorForPlayer(userId);
            if (!sideToMove.equals(playerColor)) {
                throw new BadRequestException("It is not your turn (you play " + playerColor + ", current turn: " + sideToMove + ")");
            }
            // Cannot move if it's the AI's turn
            if (GameMode.AI.equals(game.getGameMode()) && sideToMove.equals(game.getAiPlaysAs())) {
                throw new BadRequestException("It is the AI's turn");
            }
        }
        // For LOCAL_MULTIPLAYER, no user-colour checks — whoever is sitting at the board moves
    }

    private Game getGameOrThrow(Long gameId) {
        return gameRepository.findByIdWithPlayers(gameId)
                .orElseThrow(() -> new ResourceNotFoundException("Game", gameId));
    }

}
