package com.group2.admin_service.feign;

import java.util.List;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import com.group2.admin_service.dto.UserDTO;

@FeignClient(name = "auth-service")
public interface AuthFeignClient {

    @GetMapping("/api/auth/users")
    List<UserDTO> getAllUsers();
}
