package com.workfora.security;

import com.workfora.config.WorkforaProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    private final WorkforaProperties properties;
    private final SecretKey key;

    public JwtService(WorkforaProperties properties) {
        this.properties = properties;
        this.key = buildKey(properties.getJwt().getSecret());
    }

    public String generateAccessToken(UserPrincipal principal) {
        Instant now = Instant.now();
        Instant expiry = now.plusSeconds(properties.getJwt().getAccessTokenMinutes() * 60);
        return Jwts.builder()
                .subject(principal.getUsername())
                .claim("uid", principal.getId().toString())
                .claim("eid", principal.getEmployeeId() != null ? principal.getEmployeeId().toString() : null)
                .claim("oid", principal.getOrganizationId() != null ? principal.getOrganizationId().toString() : null)
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .signWith(key)
                .compact();
    }

    public long getAccessTokenExpiresInSeconds() {
        return properties.getJwt().getAccessTokenMinutes() * 60;
    }

    public long getRefreshTokenExpiresInSeconds() {
        return properties.getJwt().getRefreshTokenDays() * 24 * 60 * 60;
    }

    public String extractUsername(String token) {
        return parseClaims(token).getSubject();
    }

    public UUID extractUserId(String token) {
        String uid = parseClaims(token).get("uid", String.class);
        return uid != null ? UUID.fromString(uid) : null;
    }

    public boolean isTokenValid(String token, UserPrincipal principal) {
        Claims claims = parseClaims(token);
        return claims.getSubject().equalsIgnoreCase(principal.getUsername())
                && claims.getExpiration().after(new Date());
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey buildKey(String secret) {
        try {
            byte[] decoded = Decoders.BASE64.decode(secret);
            if (decoded.length >= 32) {
                return Keys.hmacShaKeyFor(decoded);
            }
        } catch (Exception ignored) {
            // fall through
        }
        byte[] raw = secret.getBytes(StandardCharsets.UTF_8);
        if (raw.length < 32) {
            byte[] padded = new byte[32];
            System.arraycopy(raw, 0, padded, 0, raw.length);
            return Keys.hmacShaKeyFor(padded);
        }
        return Keys.hmacShaKeyFor(raw);
    }
}
