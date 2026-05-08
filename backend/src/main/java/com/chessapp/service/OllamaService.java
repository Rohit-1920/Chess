package com.chessapp.service;

import com.chessapp.enums.AiDifficulty;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Communicates with a locally-running Ollama instance to obtain AI chess moves.
 *
 * Difficulty strategy:
 *  EASY   → ChessEngineService.getRandomMove()  (no Ollama call)
 *  MEDIUM → Short Ollama prompt; plays reasonable but imperfect moves
 *  HARD   → Chain-of-thought Ollama prompt; plays the best move it can
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OllamaService {

    private final ObjectMapper objectMapper;
    private final ChessEngineService chessEngineService;

    @Value("${ollama.base-url}")
    private String ollamaBaseUrl;

    @Value("${ollama.model}")
    private String ollamaModel;

    // UCI pattern: lowercase a-h, rank 1-8, optional promotion q/r/b/n
    private static final Pattern UCI_PATTERN =
            Pattern.compile("\\b([a-h][1-8][a-h][1-8][qrbn]?)\\b");

    // ─── Public API ──────────────────────────────────────────────

    /**
     * Get the AI's next move for the given FEN position.
     *
     * @param fen        current board position in FEN
     * @param difficulty AI difficulty
     * @param legalMoves list of legal UCI moves (pre-computed, for validation)
     * @return UCI move string (e.g. "e2e4"), or a fallback random move on failure
     */
    public String getAiMove(String fen, AiDifficulty difficulty, List<String> legalMoves) {
        if (difficulty == AiDifficulty.EASY) {
            return chessEngineService.getRandomMove(fen);
        }

        try {
            String prompt = buildPrompt(fen, difficulty, legalMoves);
            String rawResponse = callOllama(prompt);
            String uciMove = extractUciMove(rawResponse, legalMoves);

            if (uciMove != null) {
                log.info("Ollama ({}) move: {} for FEN: {}", difficulty, uciMove, fen);
                return uciMove;
            }
        } catch (Exception e) {
            log.warn("Ollama call failed ({}), falling back to random move: {}", difficulty, e.getMessage());
        }

        // Fallback: random legal move if Ollama fails or returns an invalid move
        log.info("Falling back to random move");
        return chessEngineService.getRandomMove(fen);
    }

    // ─── Prompt Construction ─────────────────────────────────────

    private String buildPrompt(String fen, AiDifficulty difficulty, List<String> legalMoves) {
        String legalList = String.join(", ", legalMoves);

        if (difficulty == AiDifficulty.MEDIUM) {
            return """
                    You are a chess engine. The current board position in FEN notation is:
                    %s
                    
                    The legal moves available are: %s
                    
                    Choose one move from the legal moves list. Respond with ONLY the UCI move \
                    (e.g. e2e4). Do not include any explanation.
                    """.formatted(fen, legalList);
        }

        // HARD: chain-of-thought with explicit instructions
        return """
                You are an expert chess engine. Analyse the following position carefully.
                
                FEN: %s
                
                Legal moves: %s
                
                Instructions:
                1. Identify threats, tactics (forks, pins, discovered attacks, checkmates).
                2. Consider pawn structure, king safety, and piece activity.
                3. Select the single best move from the legal moves list.
                4. End your response with: BEST MOVE: <uci>
                   Example: BEST MOVE: e2e4
                
                Your analysis:
                """.formatted(fen, legalList);
    }

    // ─── Ollama HTTP Call ────────────────────────────────────────

    private String callOllama(String prompt) {
        RestTemplate restTemplate = new RestTemplate();

        ObjectNode requestBody = objectMapper.createObjectNode();
        requestBody.put("model", ollamaModel);
        requestBody.put("prompt", prompt);
        requestBody.put("stream", false);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<String> entity;
        try {
            entity = new HttpEntity<>(objectMapper.writeValueAsString(requestBody), headers);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialise Ollama request", e);
        }

        String url = ollamaBaseUrl + "/api/generate";
        ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);

        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            throw new RuntimeException("Ollama returned non-2xx: " + response.getStatusCode());
        }

        try {
            JsonNode json = objectMapper.readTree(response.getBody());
            return json.path("response").asText();
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse Ollama response", e);
        }
    }

    // ─── Response Parsing ────────────────────────────────────────

    /**
     * Extract a valid UCI move from Ollama's response.
     * Preference order:
     *  1. "BEST MOVE: <uci>" tag (HARD mode)
     *  2. First UCI-shaped token that appears in legalMoves
     *  3. null (caller should fall back to random)
     */
    private String extractUciMove(String response, List<String> legalMoves) {
        if (response == null || response.isBlank()) return null;

        // 1. Try "BEST MOVE: e2e4" pattern
        Pattern bestMoveTag = Pattern.compile("BEST\\s+MOVE\\s*:\\s*([a-h][1-8][a-h][1-8][qrbn]?)",
                Pattern.CASE_INSENSITIVE);
        Matcher tagMatcher = bestMoveTag.matcher(response);
        if (tagMatcher.find()) {
            String candidate = tagMatcher.group(1).toLowerCase();
            if (legalMoves.contains(candidate)) return candidate;
        }

        // 2. Scan for any UCI-shaped token that is actually legal
        Matcher m = UCI_PATTERN.matcher(response.toLowerCase());
        while (m.find()) {
            String candidate = m.group(1);
            if (legalMoves.contains(candidate)) return candidate;
        }

        return null;
    }
}
