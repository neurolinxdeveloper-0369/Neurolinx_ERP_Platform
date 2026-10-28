package com.tech.source.repository;

import com.tech.source.model.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CompanyRepository extends JpaRepository<Company, Long> {
    Optional<Company> findByName(String name);
    Optional<Company> findByWebsiteUrlEndingWith(String slug);
}
