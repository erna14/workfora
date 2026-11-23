package com.workfora.employee;

import com.workfora.employee.domain.EmergencyContact;
import com.workfora.employee.domain.Employee;
import com.workfora.employee.domain.EmployeeDocument;
import com.workfora.employee.domain.EmploymentHistory;
import com.workfora.employee.dto.EmergencyContactResponse;
import com.workfora.employee.dto.EmployeeDetailResponse;
import com.workfora.employee.dto.EmployeeDocumentResponse;
import com.workfora.employee.dto.EmployeeListItemResponse;
import com.workfora.employee.dto.EmploymentHistoryResponse;
import java.util.List;

public final class EmployeeMapper {

    private EmployeeMapper() {}

    public static EmployeeListItemResponse toListItem(Employee e) {
        return new EmployeeListItemResponse(
                e.getId(), e.getEmployeeNumber(), e.getFirstName(), e.getLastName(), e.getWorkEmail(),
                e.getStatus(), e.getJobTitle(), e.getDepartmentId(), e.getManagerId(), e.getHireDate()
        );
    }

    public static EmployeeDetailResponse toDetail(
            Employee e,
            List<EmergencyContact> contacts,
            List<EmploymentHistory> history,
            List<EmployeeDocument> documents
    ) {
        return new EmployeeDetailResponse(
                e.getId(), e.getOrganizationId(), e.getEmployeeNumber(), e.getFirstName(), e.getLastName(),
                e.getWorkEmail(), e.getPersonalEmail(), e.getPhone(), e.getStatus(), e.getHireDate(),
                e.getDateOfBirth(), e.getDepartmentId(), e.getPositionId(), e.getTeamId(), e.getManagerId(),
                e.getLocationId(), e.getJobTitle(), e.getDeactivatedAt(),
                contacts.stream().map(c -> new EmergencyContactResponse(c.getId(), c.getName(), c.getRelationship(), c.getPhone(), c.getEmail())).toList(),
                history.stream().map(h -> new EmploymentHistoryResponse(h.getId(), h.getTitle(), h.getDepartmentName(), h.getStartedOn(), h.getEndedOn(), h.getNotes())).toList(),
                documents.stream().map(d -> new EmployeeDocumentResponse(d.getId(), d.getFileName(), d.getContentType(), d.getCategory(), d.getUploadedAt())).toList()
        );
    }
}
