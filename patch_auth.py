import os

path = 'erp-api/src/main/java/com/neurolinx/erp/controller/AuthController.java'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

change_password_endpoint = """
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String otp = payload.get("otp");
        String newPassword = payload.get("newPassword");

        if (email == null || otp == null || newPassword == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Missing required fields"));
        }

        if (otpService.verifyOtp(email, otp)) {
            var userOpt = userRepository.findByEmail(email);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                user.setPassword(passwordEncoder.encode(newPassword));
                userRepository.save(user);
                return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
            }
            return ResponseEntity.status(404).body(Map.of("message", "User not found"));
        }
        return ResponseEntity.status(401).body(Map.of("message", "Invalid or expired OTP"));
    }
}
"""

text = text.rsplit('}', 1)[0] + change_password_endpoint

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Patched AuthController.java")
