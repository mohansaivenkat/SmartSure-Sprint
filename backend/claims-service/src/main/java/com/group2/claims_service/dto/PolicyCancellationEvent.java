package com.group2.claims_service.dto;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PolicyCancellationEvent {
    private Long policyId;
    private Long userId;
    private LocalDateTime timestamp;
}
