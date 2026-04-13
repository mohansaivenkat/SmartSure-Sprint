package com.group2.notification_service.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

import com.group2.notification_service.entity.Otp;

public interface OtpRepository extends JpaRepository<Otp, Long> {
	Optional<Otp> findByEmail(String email);
	
	@Transactional
	@Modifying
    void deleteByEmail(String email);
}
