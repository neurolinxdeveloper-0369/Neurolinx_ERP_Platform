package com.neurolinx.erp;
import com.neurolinx.erp.model.Role;
import com.neurolinx.erp.model.User;
import com.neurolinx.erp.repository.RoleRepository;
import com.neurolinx.erp.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {
    @Bean
    public CommandLineRunner initData(UserRepository userRepository, RoleRepository roleRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            Role masterAdmin = roleRepository.findByName("Master Admin").orElseGet(() -> {
                return roleRepository.save(new Role("Master Admin"));
            });

            if (userRepository.findByUsername("admin").isEmpty()) {
                User admin = new User("admin", passwordEncoder.encode("admin123"));
                admin.setRole(masterAdmin);
                userRepository.save(admin);
            }
        };
    }
}
