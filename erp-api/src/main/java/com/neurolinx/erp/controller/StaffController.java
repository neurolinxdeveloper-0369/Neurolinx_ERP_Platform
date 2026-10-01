package com.neurolinx.erp.controller;

import com.neurolinx.erp.model.*;
import com.neurolinx.erp.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/staff")
public class StaffController {

    @Autowired private EmployeeRepository employeeRepository;
    @Autowired private EmployeeShiftRepository shiftRepository;
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

    // --- Employee Endpoints ---

    @GetMapping("/employees")
    public ResponseEntity<?> getEmployees() {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(Map.of("message", "Company not found"));
        return ResponseEntity.ok(employeeRepository.findByCompany(company));
    }

    @PostMapping("/employees")
    public ResponseEntity<?> createEmployee(@RequestBody Map<String, Object> payload) {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(Map.of("message", "Company not found"));
        
        Employee emp = new Employee();
        emp.setCompany(company);
        emp.setName(payload.get("name").toString());
        emp.setJobRole(payload.get("jobRole").toString());
        
        if (payload.containsKey("phone")) emp.setPhone(payload.get("phone").toString());
        if (payload.containsKey("email")) emp.setEmail(payload.get("email").toString());
        if (payload.containsKey("salaryType")) emp.setSalaryType(payload.get("salaryType").toString());
        if (payload.containsKey("baseSalary")) emp.setBaseSalary(new BigDecimal(payload.get("baseSalary").toString()));
        if (payload.containsKey("isActive")) emp.setIsActive((Boolean) payload.get("isActive"));
        if (payload.containsKey("joiningDate") && payload.get("joiningDate") != null && !payload.get("joiningDate").toString().isEmpty()) {
            emp.setJoiningDate(LocalDate.parse(payload.get("joiningDate").toString()));
        } else {
            emp.setJoiningDate(LocalDate.now());
        }

        return ResponseEntity.ok(employeeRepository.save(emp));
    }

    @PutMapping("/employees/{id}")
    public ResponseEntity<?> updateEmployee(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        Company company = getUserCompany();
        return employeeRepository.findById(id).map(emp -> {
            if (!emp.getCompany().getId().equals(company.getId())) return ResponseEntity.status(403).body(Map.of("message", "Unauthorized"));
            if (payload.containsKey("name")) emp.setName(payload.get("name").toString());
            if (payload.containsKey("jobRole")) emp.setJobRole(payload.get("jobRole").toString());
            if (payload.containsKey("phone")) emp.setPhone(payload.get("phone").toString());
            if (payload.containsKey("email")) emp.setEmail(payload.get("email").toString());
            if (payload.containsKey("salaryType")) emp.setSalaryType(payload.get("salaryType").toString());
            if (payload.containsKey("baseSalary")) emp.setBaseSalary(new BigDecimal(payload.get("baseSalary").toString()));
            if (payload.containsKey("isActive")) emp.setIsActive((Boolean) payload.get("isActive"));
            return ResponseEntity.ok(employeeRepository.save(emp));
        }).orElse(ResponseEntity.notFound().build());
    }

    // --- Shift Endpoints ---

    @GetMapping("/shifts")
    public ResponseEntity<?> getShifts(@RequestParam(required = false) String date) {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(Map.of("message", "Company not found"));
        
        if (date != null && !date.isEmpty()) {
            return ResponseEntity.ok(shiftRepository.findByCompanyAndShiftDate(company, LocalDate.parse(date)));
        }
        return ResponseEntity.ok(shiftRepository.findByCompany(company));
    }

    @PostMapping("/shifts")
    public ResponseEntity<?> assignShift(@RequestBody Map<String, Object> payload) {
        Company company = getUserCompany();
        if (company == null) return ResponseEntity.status(403).body(Map.of("message", "Company not found"));
        
        if (!payload.containsKey("employeeId") || !payload.containsKey("shiftDate") || !payload.containsKey("shiftType")) {
            return ResponseEntity.badRequest().body(Map.of("message", "employeeId, shiftDate, shiftType are required"));
        }

        Long empId = Long.parseLong(payload.get("employeeId").toString());
        Employee emp = employeeRepository.findById(empId).orElse(null);
        if (emp == null || !emp.getCompany().getId().equals(company.getId())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid employee"));
        }

        EmployeeShift shift = new EmployeeShift();
        shift.setCompany(company);
        shift.setEmployee(emp);
        shift.setShiftDate(LocalDate.parse(payload.get("shiftDate").toString()));
        shift.setShiftType(payload.get("shiftType").toString());
        if (payload.containsKey("attendanceStatus")) {
            shift.setAttendanceStatus(payload.get("attendanceStatus").toString());
        }

        return ResponseEntity.ok(shiftRepository.save(shift));
    }

    @PutMapping("/shifts/{id}/status")
    public ResponseEntity<?> updateAttendance(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        Company company = getUserCompany();
        return shiftRepository.findById(id).map(shift -> {
            if (!shift.getCompany().getId().equals(company.getId())) return ResponseEntity.status(403).body(Map.of("message", "Unauthorized"));
            if (payload.containsKey("attendanceStatus")) {
                shift.setAttendanceStatus(payload.get("attendanceStatus").toString());
            }
            return ResponseEntity.ok(shiftRepository.save(shift));
        }).orElse(ResponseEntity.notFound().build());
    }
}
