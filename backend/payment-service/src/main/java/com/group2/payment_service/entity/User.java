package com.group2.payment_service.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

// Read-only entity mapping to the shared users table
@Entity
@Table(name = "users")
public class User {

    @Id
    private Long id;
    
    // We only need the ID to verify existence, no other fields mapped for performance and isolation.
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }
}
