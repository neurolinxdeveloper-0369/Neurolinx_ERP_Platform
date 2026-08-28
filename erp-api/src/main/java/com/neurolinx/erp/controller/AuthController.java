package com.neurolinx.erp.controller;

import com.neurolinx.erp.model.DeviceSession;
import com.neurolinx.erp.repository.DeviceSessionRepository;
import com.neurolinx.erp.repository.CompanyRepository;
import com.neurolinx.erp.repository.UserRepository;
import com.neurolinx.erp.service.OtpService;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.Date;
import java.util.Map;
import java.util.UUID;
import java.util.List;
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
    private CompanyRepository companyRepository;
    @Autowired
    private DeviceSessionRepository deviceSessionRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private OtpService otpService;
    @Autowired
    private SecretKey key;
    
    private final ObjectMapper mapper = new ObjectMapper();

    @GetMapping("/client/{slug}")
    public ResponseEntity<?> getClientBySlug(@PathVariable String slug) {
        return companyRepository.findByWebsiteUrlEndingWith(slug)
            .map(c -> ResponseEntity.ok(Map.of(
                "name", c.getName(),
                "logo", c.getLogoBase64() != null ? c.getLogoBase64() : ""
            )))
            .orElse(ResponseEntity.notFound().build());
    }

    private String generateJwt(String email) {
        // 1 hour expiry
        return Jwts.builder()
                .setSubject(email)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 3600000))
                .signWith(key)
                .compact();
    }

    private ResponseEntity<?> handleDeviceSession(String email, String deviceId) {
        if (deviceId == null || deviceId.isEmpty()) {
            return ResponseEntity.status(400).body(Map.of("message", "Device ID is required"));
        }

        // Master Admin bypasses EVERYTHING
        if (email.equalsIgnoreCase("neurolinxdeveloper@gmail.com")) {
            DeviceSession newSession = new DeviceSession(email, deviceId);
            String refreshToken = UUID.randomUUID().toString();
            newSession.setRefreshToken(refreshToken);
            newSession.setExpiryDate(new Date(System.currentTimeMillis() + 604800000L));
            newSession.setIsApproved(true);
            deviceSessionRepository.save(newSession);
            return ResponseEntity.ok(Map.of("token", generateJwt(email), "refreshToken", refreshToken, "message", "Login successful", "email", email));
        }

        var sessionOpt = deviceSessionRepository.findByEmailAndDeviceId(email, deviceId);
        
        if (sessionOpt.isPresent()) {
            DeviceSession session = sessionOpt.get();
            if (!session.getIsApproved()) {
                return ResponseEntity.status(403).body(Map.of("message", "Pending Master Admin approval for this device."));
            }
            // Generate refresh token (7 days)
            String refreshToken = UUID.randomUUID().toString();
            session.setRefreshToken(refreshToken);
            session.setExpiryDate(new Date(System.currentTimeMillis() + 604800000L));
            deviceSessionRepository.save(session);
            return ResponseEntity.ok(Map.of("token", generateJwt(email), "refreshToken", refreshToken, "message", "Login successful", "email", email));
        }

        // New Device
        List<DeviceSession> allSessions = deviceSessionRepository.findByEmail(email);
        int count = allSessions.size();
        
        var userOpt = userRepository.findByEmail(email);
        boolean bypassLimit = false;
        if (userOpt.isPresent() && userOpt.get().getCompany() != null) {
            bypassLimit = Boolean.TRUE.equals(userOpt.get().getCompany().getBypassDeviceLimit());
        }

        if (bypassLimit || count < 2) {
            // Auto approve 1st and 2nd device, OR if bypass limit is true
            DeviceSession newSession = new DeviceSession(email, deviceId);
            String refreshToken = UUID.randomUUID().toString();
            newSession.setRefreshToken(refreshToken);
            newSession.setExpiryDate(new Date(System.currentTimeMillis() + 604800000L));
            newSession.setIsApproved(true);
            deviceSessionRepository.save(newSession);
            return ResponseEntity.ok(Map.of("token", generateJwt(email), "refreshToken", refreshToken, "message", "Login successful", "email", email));
        } else if (count == 2) {
            // 3rd device requires OTP
            otpService.generateAndSendOtp(email);
            return ResponseEntity.ok(Map.of("message", "Device OTP required", "requiresDeviceOtp", true, "email", email));
        } else {
            // 4th+ device blocks and requires manual approval
            DeviceSession newSession = new DeviceSession(email, deviceId);
            newSession.setIsApproved(false);
            deviceSessionRepository.save(newSession);
            return ResponseEntity.status(403).body(Map.of("message", "Device limit reached. Pending Master Admin approval for this device."));
        }
    }

    @PostMapping("/verify-device-otp")
    public ResponseEntity<?> verifyDeviceOtp(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String deviceId = payload.get("deviceId");
        String otp = payload.get("otp");

        if (otpService.verifyOtp(email, otp)) {
            DeviceSession newSession = new DeviceSession(email, deviceId);
            String refreshToken = UUID.randomUUID().toString();
            newSession.setRefreshToken(refreshToken);
            newSession.setExpiryDate(new Date(System.currentTimeMillis() + 604800000L));
            newSession.setIsApproved(true);
            deviceSessionRepository.save(newSession);
            return ResponseEntity.ok(Map.of("token", generateJwt(email), "refreshToken", refreshToken, "message", "Login successful", "email", email));
        }
        return ResponseEntity.status(401).body(Map.of("message", "Invalid or expired OTP"));
    }

    @PostMapping("/login-password")
    public ResponseEntity<?> loginPassword(@RequestBody Map<String, String> creds) {
        String email = creds.get("email");
        String password = creds.get("password");
        String deviceId = creds.get("deviceId");
        
        var userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent() && passwordEncoder.matches(password, userOpt.get().getPassword())) {
            return handleDeviceSession(email, deviceId);
        }
        return ResponseEntity.status(401).body(Map.of("message", "Invalid credentials"));
    }

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
        String deviceId = payload.get("deviceId");

        if (otpService.verifyOtp(email, otp)) {
            return handleDeviceSession(email, deviceId);
        }
        return ResponseEntity.status(401).body(Map.of("message", "Invalid or expired OTP"));
    }

    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> payload) {
        try {
            String token = payload.get("token");
            String deviceId = payload.get("deviceId");
            String[] parts = token.split("\\.");
            String decodedPayload = new String(Base64.getUrlDecoder().decode(parts[1]));
            
            @SuppressWarnings("unchecked")
            Map<String, Object> claims = mapper.readValue(decodedPayload, Map.class);
            String email = (String) claims.get("email");
            
            var userOpt = userRepository.findByEmail(email);
            if (userOpt.isPresent()) {
                return handleDeviceSession(email, deviceId);
            }
            return ResponseEntity.status(401).body(Map.of("message", "No user found for this Google account."));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid Google token"));
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@RequestBody Map<String, String> payload) {
        String refreshToken = payload.get("refreshToken");
        var sessionOpt = deviceSessionRepository.findByRefreshToken(refreshToken);
        if (sessionOpt.isPresent()) {
            DeviceSession session = sessionOpt.get();
            if (session.getExpiryDate().after(new Date()) && session.getIsApproved()) {
                return ResponseEntity.ok(Map.of("token", generateJwt(session.getEmail())));
            }
        }
        return ResponseEntity.status(401).body(Map.of("message", "Invalid or expired refresh token"));
    }

    // REGISTRATION
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
