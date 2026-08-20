package com.neurolinx.erp.repository;

import com.neurolinx.erp.model.DeviceSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeviceSessionRepository extends JpaRepository<DeviceSession, Long> {
    List<DeviceSession> findByEmail(String email);
    Optional<DeviceSession> findByEmailAndDeviceId(String email, String deviceId);
    Optional<DeviceSession> findByRefreshToken(String refreshToken);
}
