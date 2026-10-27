package com.neurolinx.erp.repository;
import com.neurolinx.erp.model.CustomerOrder;
import com.neurolinx.erp.model.Company;
import com.neurolinx.erp.model.RestaurantTable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface CustomerOrderRepository extends JpaRepository<CustomerOrder, Long> {
    List<CustomerOrder> findByCompany(Company company);
    List<CustomerOrder> findByCompanyAndBranchId(Company company, Long branchId);
    List<CustomerOrder> findTop10ByCompanyAndBranchIdOrderByIdDesc(Company company, Long branchId);

    CustomerOrder findTopByCompanyOrderByIdDesc(Company company);
    CustomerOrder findTopByOrderByIdDesc();
    List<CustomerOrder> findTop10ByCompanyOrderByIdDesc(Company company);
    boolean existsByRestaurantTable(RestaurantTable restaurantTable);
    List<CustomerOrder> findByCompanyAndCreatedAtBetween(Company company, LocalDateTime start, LocalDateTime end);
    List<CustomerOrder> findByCompanyAndOrderTypeOrderByIdDesc(Company company, String orderType);
    List<CustomerOrder> findByCompanyAndBranchIdAndOrderTypeOrderByIdDesc(Company company, Long branchId, String orderType);
    List<CustomerOrder> findByCompanyAndDeliveryStatusIn(Company company, List<String> deliveryStatuses);
    long countByCompanyAndStatus(Company company, String status);
    long countByCompanyAndStatusIn(Company company, List<String> statuses);

    boolean existsByOrderNumber(String orderNumber);
    CustomerOrder findTopByOrderNumberStartingWithOrderByIdDesc(String prefix);
    CustomerOrder findTopByCompanyAndOrderNumberStartingWithOrderByIdDesc(Company company, String prefix);
}