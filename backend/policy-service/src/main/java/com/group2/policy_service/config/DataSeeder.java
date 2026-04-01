package com.group2.policy_service.config;

import com.group2.policy_service.entity.PolicyCategory;
import com.group2.policy_service.entity.PolicyType;
import com.group2.policy_service.repository.PolicyTypeRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDateTime;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner seedPolicyTypes(PolicyTypeRepository repository) {
        return args -> {
            if (repository.count() == 0) {
                PolicyType health = new PolicyType();
                health.setCategory(PolicyCategory.HEALTH);
                health.setDescription("Medical and hospitalization coverage");

                PolicyType vehicle = new PolicyType();
                vehicle.setCategory(PolicyCategory.VEHICLE);
                vehicle.setDescription("Auto, motorcycle, and road assistance");

                PolicyType life = new PolicyType();
                life.setCategory(PolicyCategory.LIFE);
                life.setDescription("Term life and permanent life insurance");

                repository.save(health);
                repository.save(vehicle);
                repository.save(life);

                System.out.println("✅ Seeded default Policy Categories: HEALTH, VEHICLE, LIFE");
            }
        };
    }
}
