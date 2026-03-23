package com.group2.payment_service.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

// Read-only entity mapping to the shared policies table
@Entity
@Table(name = "policies")
public class Policy {

    @Id
    private Long id;
    
    // We only need the ID to verify existence
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }
}
