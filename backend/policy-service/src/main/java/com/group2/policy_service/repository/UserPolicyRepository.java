package com.group2.policy_service.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.group2.policy_service.entity.UserPolicy;

@Repository
public interface UserPolicyRepository extends JpaRepository<UserPolicy, Long> {
	List<UserPolicy> findByUserId(Long userId);

	@Query("SELECT SUM(u.premiumAmount) FROM UserPolicy u")
	Double sumPremiumAmount();
}

