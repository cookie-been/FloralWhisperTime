package com.floralwhisper.security;

import com.floralwhisper.config.AppProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
  private final AppProperties properties;

  public JwtService(AppProperties properties) {
    this.properties = properties;
  }

  public String createToken(String username) {
    Instant now = Instant.now();
    Instant expiresAt = now.plusSeconds(properties.getJwt().getExpiresInSeconds());
    return Jwts.builder()
        .issuer(properties.getJwt().getIssuer())
        .subject(username)
        .issuedAt(Date.from(now))
        .expiration(Date.from(expiresAt))
        .signWith(secretKey())
        .compact();
  }

  public String parseUsername(String token) {
    Claims claims = parseClaims(token);
    return claims.getSubject();
  }

  public Claims parseClaims(String token) throws JwtException {
    Claims claims = Jwts.parser().verifyWith(secretKey()).build().parseSignedClaims(token).getPayload();
    String issuer = properties.getJwt().getIssuer();
    if (issuer != null && !issuer.isBlank() && !issuer.equals(claims.getIssuer())) {
      throw new JwtException("Unexpected JWT issuer");
    }
    return claims;
  }

  private SecretKey secretKey() {
    byte[] bytes = properties.getJwt().getSecret().getBytes(StandardCharsets.UTF_8);
    return Keys.hmacShaKeyFor(bytes.length >= 32 ? bytes : (properties.getJwt().getSecret() + "00000000000000000000000000000000").getBytes(StandardCharsets.UTF_8));
  }
}
