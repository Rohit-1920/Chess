package com.chessapp.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
@Slf4j
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration-ms}")
    private long jwtExpirationMs;

    @Value("${jwt.refresh-expiration-ms}")
    private long refreshExpirationMs;

    // ─── Key ─────────────────────────────────────────────────────

    private Key getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    // ─── Generation ──────────────────────────────────────────────

    public String generateAccessToken(Long userId, String username) {
        return buildToken(String.valueOf(userId), username, jwtExpirationMs, "access");
    }

    public String generateRefreshToken(Long userId, String username) {
        return buildToken(String.valueOf(userId), username, refreshExpirationMs, "refresh");
    }

    private String buildToken(String subject, String username, long ttlMs, String tokenType) {
        Date now    = new Date();
        Date expiry = new Date(now.getTime() + ttlMs);

        return Jwts.builder()
                .setSubject(subject)
                .claim("username", username)
                .claim("type", tokenType)
                .setIssuedAt(now)
                .setExpiration(expiry)
                .signWith(getSigningKey(), SignatureAlgorithm.HS512)
                .compact();
    }

    // ─── Extraction ──────────────────────────────────────────────

    public Long getUserIdFromToken(String token) {
        String subject = getClaims(token).getSubject();
        return Long.parseLong(subject);
    }

    public String getUsernameFromToken(String token) {
        return (String) getClaims(token).get("username");
    }

    public long getExpirationMs() {
        return jwtExpirationMs;
    }

    // ─── Validation ──────────────────────────────────────────────

    public boolean validateToken(String token) {
        try {
            getClaims(token);
            return true;
        } catch (MalformedJwtException e) {
            log.warn("Invalid JWT token: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            log.warn("JWT token is expired: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            log.warn("JWT token is unsupported: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            log.warn("JWT claims string is empty: {}", e.getMessage());
        }
        return false;
    }

    public boolean isAccessToken(String token) {
        try {
            return "access".equals(getClaims(token).get("type"));
        } catch (Exception e) {
            return false;
        }
    }

    // ─── Internal ────────────────────────────────────────────────

    private Claims getClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}
