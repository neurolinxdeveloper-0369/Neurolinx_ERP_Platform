package com.neurolinx.erp.config;

import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import javax.crypto.SecretKey;
import java.util.Base64;

@Configuration
public class JwtConfig {
    
    // A secure 256-bit static secret key for JWT signing to survive restarts
    private static final String SECRET = "NeurolinxPlatformSuperSecretKeyForJwt2026!@#$Base64End";

    @Bean
    public SecretKey jwtSecretKey() {
        // Pad or hash to ensure it's a valid 256-bit key for HS256
        return Keys.hmacShaKeyFor(SECRET.getBytes());
    }
}
