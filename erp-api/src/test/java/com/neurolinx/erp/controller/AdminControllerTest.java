package com.neurolinx.erp.controller;

import com.neurolinx.erp.model.*;
import com.neurolinx.erp.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AdminControllerTest {

    @Mock private CompanyRepository companyRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private UserRepository userRepository;
    @Mock private BranchRepository branchRepository;
    @Mock private RestaurantTableRepository tableRepo;
    @Mock private CustomerOrderRepository orderRepo;
    @Mock private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;
    @Mock private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AdminController adminController;

    private Company testCompany;

    @BeforeEach
    void setUp() {
        testCompany = new Company("Bawarchi Grand", "Restaurant");
        testCompany.setId(100L);
        testCompany.setTotalFloors(2);
        testCompany.setTotalTables(13);
    }

    @Test
    @DisplayName("createCompany provisions tables for each specified floor")
    void testCreateCompanyProvisionsTablesPerFloor() {
        CompanyProvisionDTO dto = new CompanyProvisionDTO();
        dto.setCompanyName("Bawarchi Grand");
        dto.setIndustryType("Restaurant");
        dto.setEmail("admin@bawarchi.com");
        dto.setPassword("Secure@123");
        dto.setTotalFloors(2);
        dto.setTotalTables(13);

        List<Map<String, Object>> floorTables = List.of(
            Map.of("floor", 1, "tableCount", 5),
            Map.of("floor", 2, "tableCount", 8)
        );
        dto.setFloorTables(floorTables);

        when(companyRepository.save(any(Company.class))).thenReturn(testCompany);
        when(roleRepository.save(any(Role.class))).thenReturn(new Role("Company Admin", testCompany));
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        when(tableRepo.findByCompanyAndFloorOrderByPositionAscIdAsc(any(Company.class), eq(1))).thenReturn(Collections.emptyList());
        when(tableRepo.findByCompanyAndFloorOrderByPositionAscIdAsc(any(Company.class), eq(2))).thenReturn(Collections.emptyList());
        when(tableRepo.findByCompany(any(Company.class))).thenReturn(Collections.emptyList());

        ResponseEntity<?> response = adminController.createCompany(dto);
        assertEquals(200, response.getStatusCode().value());

        ArgumentCaptor<RestaurantTable> tableCaptor = ArgumentCaptor.forClass(RestaurantTable.class);
        verify(tableRepo, times(13)).save(tableCaptor.capture());

        List<RestaurantTable> savedTables = tableCaptor.getAllValues();
        long floor1Count = savedTables.stream().filter(t -> t.getFloor() == 1).count();
        long floor2Count = savedTables.stream().filter(t -> t.getFloor() == 2).count();

        assertEquals(5, floor1Count, "Floor 1 should have 5 tables");
        assertEquals(8, floor2Count, "Floor 2 should have 8 tables");
    }

    @Test
    @DisplayName("getCompany returns floorTables breakdown")
    void testGetCompanyReturnsFloorTables() {
        when(companyRepository.findById(100L)).thenReturn(Optional.of(testCompany));

        RestaurantTable t1 = new RestaurantTable();
        t1.setFloor(1);
        t1.setPosition(1);
        RestaurantTable t2 = new RestaurantTable();
        t2.setFloor(1);
        t2.setPosition(2);
        RestaurantTable t3 = new RestaurantTable();
        t3.setFloor(2);
        t3.setPosition(1);

        when(tableRepo.findByCompanyOrderByFloorAscPositionAscIdAsc(testCompany)).thenReturn(List.of(t1, t2, t3));

        ResponseEntity<?> response = adminController.getCompany(100L);
        assertEquals(200, response.getStatusCode().value());

        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertNotNull(body);
        assertTrue(body.containsKey("floorTables"));

        List<Map<String, Object>> floorTables = (List<Map<String, Object>>) body.get("floorTables");
        assertEquals(2, floorTables.size());
        assertEquals(1, floorTables.get(0).get("floor"));
        assertEquals(2, floorTables.get(0).get("tableCount"));
        assertEquals(2, floorTables.get(1).get("floor"));
        assertEquals(1, floorTables.get(1).get("tableCount"));
    }

    @Test
    @DisplayName("updateCompany updates total tables and floors")
    void testUpdateCompanyProvisionsTables() {
        when(companyRepository.findById(100L)).thenReturn(Optional.of(testCompany));
        when(companyRepository.save(any(Company.class))).thenReturn(testCompany);

        Map<String, Object> payload = new HashMap<>();
        payload.put("name", "Bawarchi Grand");
        payload.put("totalFloors", 1);
        payload.put("totalTables", 6);
        payload.put("floorTables", List.of(Map.of("floor", 1, "tableCount", 6)));

        when(tableRepo.findByCompanyAndFloorOrderByPositionAscIdAsc(any(Company.class), eq(1))).thenReturn(Collections.emptyList());
        when(tableRepo.findByCompany(any(Company.class))).thenReturn(Collections.emptyList());

        ResponseEntity<?> response = adminController.updateCompany(100L, payload);
        assertEquals(200, response.getStatusCode().value());

        ArgumentCaptor<RestaurantTable> tableCaptor = ArgumentCaptor.forClass(RestaurantTable.class);
        verify(tableRepo, times(6)).save(tableCaptor.capture());

        List<RestaurantTable> savedTables = tableCaptor.getAllValues();
        assertEquals(6, savedTables.size());
        assertTrue(savedTables.stream().allMatch(t -> t.getFloor() == 1));
    }
}
