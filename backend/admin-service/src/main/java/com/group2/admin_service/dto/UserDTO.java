package com.group2.admin_service.dto;

public class UserDTO {
    private Long id;
    private String name;
    private String email;
    private String role;
    private String phone;
    private String address;

    private Boolean hasPendingPolicy = false;
    private Boolean hasActivePolicy = false;
    private Boolean hasSubmittedClaim = false;
    private Boolean hasReviewingClaim = false;
    private Integer policyCount = 0;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    
    public Boolean getHasPendingPolicy() { return hasPendingPolicy; }
    public void setHasPendingPolicy(Boolean hasPendingPolicy) { this.hasPendingPolicy = hasPendingPolicy; }
    public Boolean getHasActivePolicy() { return hasActivePolicy; }
    public void setHasActivePolicy(Boolean hasActivePolicy) { this.hasActivePolicy = hasActivePolicy; }
    public Boolean getHasSubmittedClaim() { return hasSubmittedClaim; }
    public void setHasSubmittedClaim(Boolean hasSubmittedClaim) { this.hasSubmittedClaim = hasSubmittedClaim; }
    public Boolean getHasReviewingClaim() { return hasReviewingClaim; }
    public void setHasReviewingClaim(Boolean hasReviewingClaim) { this.hasReviewingClaim = hasReviewingClaim; }
    public Integer getPolicyCount() { return policyCount; }
    public void setPolicyCount(Integer policyCount) { this.policyCount = policyCount; }
}
