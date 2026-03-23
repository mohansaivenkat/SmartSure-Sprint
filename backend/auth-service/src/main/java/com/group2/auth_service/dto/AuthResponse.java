package com.group2.auth_service.dto;

public class AuthResponse {

	private String token;
	private String role;
	private Long id;

	public AuthResponse( String token, String role, Long id) {
		this.token = token;
		this.role = role;
		this.id = id;
	}
	
	

	public Long getId() {
		return id;
	}



	public void setId(Long id) {
		this.id = id;
	}



	public String getToken() {
		return token;
	}

	public void setToken(String token) {
		this.token = token;
	}

	public String getRole() {
		return role;
	}

	public void setRole(String role) {
		this.role = role;
	}

}
