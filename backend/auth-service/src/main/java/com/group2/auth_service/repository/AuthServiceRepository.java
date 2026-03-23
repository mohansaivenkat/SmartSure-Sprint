package com.group2.auth_service.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.group2.auth_service.entity.User;


@Repository
public interface AuthServiceRepository extends JpaRepository<User, Long>{
	
	public Optional<User> findByEmail(String email);

}
