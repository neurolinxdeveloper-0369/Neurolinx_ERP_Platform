package com.neurolinx.erp.controller;

import com.neurolinx.erp.model.Branch;
import com.neurolinx.erp.model.Company;
import com.neurolinx.erp.model.User;
import com.neurolinx.erp.repository.BranchRepository;
import com.neurolinx.erp.repository.CompanyRepository;
import com.neurolinx.erp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/branches")
public class BranchController {

    @Autowired private BranchRepository branchRepository;
    @Autowired private UserRepository userRepo;
    @Autowired private CompanyRepository companyRepo;

    private Company getUserCompany() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        var userOpt = userRepo.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.getCompany() != null) return user.getCompany();
            if (user.getRole() != null && user.getRole().getCompany() != null) return user.getRole().getCompany();
        }
        return companyRepo.findAll().stream().findFirst().orElse(null);
    }

    @GetMapping
    public ResponseEntity<?> getBranches() {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(Map.of("message", "Company not found"));
        return ResponseEntity.ok(branchRepository.findByCompany(company));
    }

    @PostMapping
    public ResponseEntity<?> createBranch(@RequestBody Map<String, Object> payload) {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(Map.of("message", "Company not found"));
        
        Branch branch = new Branch();
        branch.setCompany(company);
        branch.setName(payload.get("name").toString());
        if (payload.containsKey("location")) branch.setLocation(payload.get("location").toString());
        if (payload.containsKey("contactNumber")) branch.setContactNumber(payload.get("contactNumber").toString());
        if (payload.containsKey("email")) branch.setEmail(payload.get("email").toString());
        if (payload.containsKey("isActive")) branch.setIsActive((Boolean) payload.get("isActive"));

        return ResponseEntity.ok(branchRepository.save(branch));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateBranch(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        Company company = getUserCompany();
        return branchRepository.findByIdAndCompany(id, company).map(branch -> {
            if (payload.containsKey("name")) branch.setName(payload.get("name").toString());
            if (payload.containsKey("location")) branch.setLocation(payload.get("location").toString());
            if (payload.containsKey("contactNumber")) branch.setContactNumber(payload.get("contactNumber").toString());
            if (payload.containsKey("email")) branch.setEmail(payload.get("email").toString());
            if (payload.containsKey("isActive")) branch.setIsActive((Boolean) payload.get("isActive"));
            return ResponseEntity.ok(branchRepository.save(branch));
        }).orElse(ResponseEntity.notFound().build());
    }
}
