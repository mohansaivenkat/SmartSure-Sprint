package com.group2.auth_service.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;

import com.group2.auth_service.entity.Otp;

import jakarta.transaction.Transactional;

public interface OtpRepository extends JpaRepository<Otp, Long> {
	Optional<Otp> findByEmail(String email);
	
	@Transactional
	@Modifying
    void deleteByEmail(String email);
}
