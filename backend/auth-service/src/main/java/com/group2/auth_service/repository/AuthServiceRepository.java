package com.group2.auth_service.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.group2.auth_service.entity.User;


import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface AuthServiceRepository extends JpaRepository<User, Long>{
	
	public Optional<User> findByEmail(String email);

    @Query("SELECT u FROM User u WHERE u.role = 'CUSTOMER' AND (u.name LIKE %:query% OR u.email LIKE %:query% OR CAST(u.id AS string) LIKE %:query% OR u.phone LIKE %:query%)")
    Page<User> findAllCustomersPaginated(@Param("query") String query, Pageable pageable);
}
