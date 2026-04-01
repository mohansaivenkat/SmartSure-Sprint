package com.group2.auth_service.dto;

public class AuthResponse {

	private String token;
	private String refreshToken;
	private String role;
	private Long id;

	public AuthResponse(String token, String refreshToken, String role, Long id) {
		this.token = token;
		this.refreshToken = refreshToken;
		this.role = role;
		this.id = id;
	}

	public String getToken() {
		return token;
	}

	public void setToken(String token) {
		this.token = token;
	}

	public String getRefreshToken() {
		return refreshToken;
	}

	public void setRefreshToken(String refreshToken) {
		this.refreshToken = refreshToken;
	}

	public String getRole() {
		return role;
	}

	public void setRole(String role) {
		this.role = role;
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}
}
