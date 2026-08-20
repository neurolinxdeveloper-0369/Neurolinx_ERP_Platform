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
import javax.crypto.SecretKey;

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

    private final SecretKey key = Keys.secretKeyFor(SignatureAlgorithm.HS256);

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> creds) {
        String email = creds.get("email");
        String password = creds.get("password");
        
        var userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent() && passwordEncoder.matches(password, userOpt.get().getPassword())) {
            // Valid credentials -> Generate and send OTP
            otpService.generateAndSendOtp(email);
            return ResponseEntity.ok(Map.of("message", "OTP sent to your email", "requiresOtp", true));
        }
        return ResponseEntity.status(401).body(Map.of("message", "Invalid credentials"));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String otp = payload.get("otp");

        if (otpService.verifyOtp(email, otp)) {
            // Issue JWT Token
            String token = Jwts.builder()
                    .setSubject(email)
                    .setIssuedAt(new Date())
                    .setExpiration(new Date(System.currentTimeMillis() + 86400000))
                    .signWith(key)
                    .compact();
            return ResponseEntity.ok(Map.of("token", token, "message", "Login successful"));
        }
        
        return ResponseEntity.status(401).body(Map.of("message", "Invalid or expired OTP"));
    }
}
