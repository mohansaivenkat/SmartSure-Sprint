package com.group2.policy_service.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.group2.policy_service.entity.Policy;


@Repository
public interface PolicyRepository extends JpaRepository<Policy, Long> {
	List<Policy> findByActiveTrue();
}
