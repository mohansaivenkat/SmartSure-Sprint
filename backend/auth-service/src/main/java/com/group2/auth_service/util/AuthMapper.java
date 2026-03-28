package com.group2.auth_service.util;

import com.group2.auth_service.entity.User;
import com.group2.auth_service.dto.RegisterRequest;
import com.group2.auth_service.dto.UserProfileRequest;
import org.springframework.stereotype.Component;

import com.group2.auth_service.dto.UserResponseDTO;

@Component
public class AuthMapper {

    public User mapToUser(RegisterRequest request) {
        if (request == null) return null;
        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setAddress(request.getAddress());
        return user;
    }

    public void updateUserFromRequest(UserProfileRequest request, User user) {
        if (request == null || user == null) return;
        user.setName(request.getName());
        user.setPhone(request.getPhone());
        user.setAddress(request.getAddress());
    }

    public UserResponseDTO mapToResponse(User user) {
        if (user == null) return null;
        UserResponseDTO dto = new UserResponseDTO();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setPhone(user.getPhone());
        dto.setAddress(user.getAddress());
        dto.setRole(user.getRole());
        return dto;
    }
}
