package com.neurolinx.erp.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;

@Service
public class OtpService {

    @Autowired
    private JavaMailSender mailSender;

    // Stores email -> OTP
    private final Map<String, String> otpStorage = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();

    public void generateAndSendOtp(String email) {
        // Generate 6-digit OTP
        int otpNum = 100000 + random.nextInt(900000);
        String otp = String.valueOf(otpNum);
        
        // Store it
        otpStorage.put(email, otp);

        // Send Email
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(email);
            message.setSubject("Neurolinx One - Your Login OTP");
            message.setText("Your OTP for Neurolinx One is: " + otp + "\n\nPlease do not share this code with anyone.");
            mailSender.send(message);
            System.out.println("OTP sent to " + email + ": " + otp); // For testing visibility
        } catch (Exception e) {
            System.err.println("Failed to send email. OTP for " + email + " is: " + otp);
            e.printStackTrace();
        }
    }

    public boolean verifyOtp(String email, String otp) {
        String storedOtp = otpStorage.get(email);
        if (storedOtp != null && storedOtp.equals(otp)) {
            otpStorage.remove(email); // One-time use
            return true;
        }
        return false;
    }
}
