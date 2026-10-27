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
        if (payload.containsKey("swiggyOutletId") && payload.get("swiggyOutletId") != null) branch.setSwiggyOutletId(payload.get("swiggyOutletId").toString());
        if (payload.containsKey("zomatoRestaurantId") && payload.get("zomatoRestaurantId") != null) branch.setZomatoRestaurantId(payload.get("zomatoRestaurantId").toString());
        if (payload.containsKey("urbanpiperStoreId") && payload.get("urbanpiperStoreId") != null) branch.setUrbanpiperStoreId(payload.get("urbanpiperStoreId").toString());
        if (payload.containsKey("urbanpiperApiKey") && payload.get("urbanpiperApiKey") != null) branch.setUrbanpiperApiKey(payload.get("urbanpiperApiKey").toString());
        if (payload.containsKey("urbanpiperUsername") && payload.get("urbanpiperUsername") != null) branch.setUrbanpiperUsername(payload.get("urbanpiperUsername").toString());
        if (payload.containsKey("autoAcceptOrders") && payload.get("autoAcceptOrders") != null) branch.setAutoAcceptOrders(Boolean.parseBoolean(payload.get("autoAcceptOrders").toString()));
        if (payload.containsKey("onlineOrderingActive") && payload.get("onlineOrderingActive") != null) branch.setOnlineOrderingActive(Boolean.parseBoolean(payload.get("onlineOrderingActive").toString()));

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
            if (payload.containsKey("swiggyOutletId")) branch.setSwiggyOutletId(payload.get("swiggyOutletId") != null ? payload.get("swiggyOutletId").toString() : null);
            if (payload.containsKey("zomatoRestaurantId")) branch.setZomatoRestaurantId(payload.get("zomatoRestaurantId") != null ? payload.get("zomatoRestaurantId").toString() : null);
            if (payload.containsKey("urbanpiperStoreId")) branch.setUrbanpiperStoreId(payload.get("urbanpiperStoreId") != null ? payload.get("urbanpiperStoreId").toString() : null);
            if (payload.containsKey("urbanpiperApiKey")) branch.setUrbanpiperApiKey(payload.get("urbanpiperApiKey") != null ? payload.get("urbanpiperApiKey").toString() : null);
            if (payload.containsKey("urbanpiperUsername")) branch.setUrbanpiperUsername(payload.get("urbanpiperUsername") != null ? payload.get("urbanpiperUsername").toString() : null);
            if (payload.containsKey("autoAcceptOrders") && payload.get("autoAcceptOrders") != null) branch.setAutoAcceptOrders(Boolean.parseBoolean(payload.get("autoAcceptOrders").toString()));
            if (payload.containsKey("onlineOrderingActive") && payload.get("onlineOrderingActive") != null) branch.setOnlineOrderingActive(Boolean.parseBoolean(payload.get("onlineOrderingActive").toString()));
            return ResponseEntity.ok(branchRepository.save(branch));
        }).orElse(ResponseEntity.notFound().build());
    }
}
