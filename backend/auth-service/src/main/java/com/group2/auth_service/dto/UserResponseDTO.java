package com.group2.auth_service.dto;

import com.group2.auth_service.entity.Role;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserResponseDTO {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private String address;
    private Role role;
}
