package com.neurolinx.erp.controller;

import com.neurolinx.erp.repository.UserRepository;
import com.neurolinx.erp.service.OtpService;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.Date;
import java.util.Map;
import java.util.Base64;
import javax.crypto.SecretKey;
import com.fasterxml.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private OtpService otpService;
    
    private final ObjectMapper mapper = new ObjectMapper();
    private final SecretKey key = Keys.secretKeyFor(SignatureAlgorithm.HS256);

    private String generateJwt(String email) {
        return Jwts.builder()
                .setSubject(email)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 86400000))
                .signWith(key)
                .compact();
    }

    // 1. PASSWORD LOGIN
    @PostMapping("/login-password")
    public ResponseEntity<?> loginPassword(@RequestBody Map<String, String> creds) {
        String email = creds.get("email");
        String password = creds.get("password");
        
        var userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent() && passwordEncoder.matches(password, userOpt.get().getPassword())) {
            return ResponseEntity.ok(Map.of("token", generateJwt(email), "message", "Login successful"));
        }
        return ResponseEntity.status(401).body(Map.of("message", "Invalid credentials"));
    }

    // 2. EMAIL OTP LOGIN
    @PostMapping("/request-otp")
    public ResponseEntity<?> requestOtp(@RequestBody Map<String, String> creds) {
        String email = creds.get("email");
        var userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            otpService.generateAndSendOtp(email);
            return ResponseEntity.ok(Map.of("message", "OTP sent"));
        }
        return ResponseEntity.status(401).body(Map.of("message", "Email not found"));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String otp = payload.get("otp");

        if (otpService.verifyOtp(email, otp)) {
            return ResponseEntity.ok(Map.of("token", generateJwt(email), "message", "Login successful"));
        }
        return ResponseEntity.status(401).body(Map.of("message", "Invalid or expired OTP"));
    }

    // 3. GOOGLE LOGIN
    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> payload) {
        try {
            String token = payload.get("token");
            String[] parts = token.split("\\.");
            String decodedPayload = new String(Base64.getUrlDecoder().decode(parts[1]));
            
            @SuppressWarnings("unchecked")
            Map<String, Object> claims = mapper.readValue(decodedPayload, Map.class);
            String email = (String) claims.get("email");
            
            var userOpt = userRepository.findByEmail(email);
            if (userOpt.isPresent()) {
                return ResponseEntity.ok(Map.of("token", generateJwt(email), "email", email, "message", "Google login successful"));
            }
            return ResponseEntity.status(401).body(Map.of("message", "No user found for this Google account."));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid Google token"));
        }
    }

    // 4. REGISTRATION (For Client Provisioning Modal)
    @PostMapping("/send-registration-otp")
    public ResponseEntity<?> sendRegistrationOtp(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        otpService.generateAndSendOtp(email);
        return ResponseEntity.ok(Map.of("message", "OTP sent to " + email));
    }

    @PostMapping("/verify-registration-otp")
    public ResponseEntity<?> verifyRegistrationOtp(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String otp = payload.get("otp");
        if (otpService.verifyOtp(email, otp)) {
            return ResponseEntity.ok(Map.of("message", "OTP verified"));
        }
        return ResponseEntity.status(401).body(Map.of("message", "Invalid or expired OTP"));
    }
}
