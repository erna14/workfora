package com.workfora.employee.repository;

import com.workfora.employee.domain.Employee;
import com.workfora.employee.domain.EmployeeStatus;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EmployeeRepository extends JpaRepository<Employee, UUID> {

    Optional<Employee> findByWorkEmailIgnoreCase(String workEmail);

    List<Employee> findByManagerId(UUID managerId);

    List<Employee> findByDepartmentId(UUID departmentId);

    boolean existsByWorkEmailIgnoreCase(String workEmail);

    boolean existsByOrganizationIdAndEmployeeNumber(UUID organizationId, String employeeNumber);

    boolean existsByDepartmentId(UUID departmentId);

    boolean existsByPositionId(UUID positionId);

    @Query("""
            SELECT e.departmentId, COUNT(e.id)
            FROM Employee e
            WHERE e.departmentId IN :ids
            GROUP BY e.departmentId
            """)
    List<Object[]> countGroupedByDepartmentId(@Param("ids") Collection<UUID> ids);

    @Query("""
            SELECT e.positionId, COUNT(e.id)
            FROM Employee e
            WHERE e.positionId IN :ids
            GROUP BY e.positionId
            """)
    List<Object[]> countGroupedByPositionId(@Param("ids") Collection<UUID> ids);

    @Query("""
            SELECT e.id, e.firstName, e.lastName
            FROM Employee e
            WHERE e.id IN :ids
            """)
    List<Object[]> findNamesByIdIn(@Param("ids") Collection<UUID> ids);

    long countByOrganizationIdAndStatus(UUID organizationId, EmployeeStatus status);

    long countByOrganizationIdAndHireDateGreaterThanEqual(UUID organizationId, LocalDate hireDate);

    @Query("""
            SELECT d.name, COUNT(e.id)
            FROM Employee e
            JOIN Department d ON d.id = e.departmentId
            WHERE e.organizationId = :orgId
            GROUP BY d.name
            ORDER BY COUNT(e.id) DESC
            """)
    List<Object[]> countHeadcountByDepartment(@Param("orgId") UUID orgId);

    @Query("""
            SELECT e FROM Employee e
            WHERE e.organizationId = :orgId
              AND e.dateOfBirth IS NOT NULL
            """)
    List<Employee> findWithDateOfBirth(@Param("orgId") UUID orgId);

    @Query("""
            SELECT e FROM Employee e
            WHERE e.organizationId = :orgId
              AND e.hireDate IS NOT NULL
            """)
    List<Employee> findWithHireDate(@Param("orgId") UUID orgId);

    @Query("""
            SELECT e FROM Employee e
            WHERE e.organizationId = :orgId
              AND (:status IS NULL OR e.status = :status)
              AND (:departmentId IS NULL OR e.departmentId = :departmentId)
              AND (
                   :search IS NULL OR :search = '' OR
                   LOWER(e.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(e.lastName) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(e.workEmail) LIKE LOWER(CONCAT('%', :search, '%')) OR
                   LOWER(e.employeeNumber) LIKE LOWER(CONCAT('%', :search, '%'))
              )
            """)
    Page<Employee> search(
            @Param("orgId") UUID orgId,
            @Param("search") String search,
            @Param("status") EmployeeStatus status,
            @Param("departmentId") UUID departmentId,
            Pageable pageable
    );
}
