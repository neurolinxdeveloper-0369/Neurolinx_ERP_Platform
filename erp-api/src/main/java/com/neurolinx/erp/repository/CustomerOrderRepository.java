package com.neurolinx.erp.repository;
import com.neurolinx.erp.model.CustomerOrder;
import com.neurolinx.erp.model.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CustomerOrderRepository extends JpaRepository<CustomerOrder, Long> {
    List<CustomerOrder> findByCompany(Company company);\n    CustomerOrder findTopByCompanyOrderByIdDesc(Company company);
}