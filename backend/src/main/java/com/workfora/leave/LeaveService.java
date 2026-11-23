package com.workfora.leave;

import com.workfora.common.OrgConstants;
import com.workfora.common.exception.BusinessException;
import com.workfora.common.exception.ResourceNotFoundException;
import com.workfora.leave.domain.Holiday;
import com.workfora.leave.domain.LeaveBalance;
import com.workfora.leave.domain.LeaveRequest;
import com.workfora.leave.domain.LeaveType;
import com.workfora.leave.dto.LeaveDtos.*;
import com.workfora.leave.repository.HolidayRepository;
import com.workfora.leave.repository.LeaveBalanceRepository;
import com.workfora.leave.repository.LeaveRequestRepository;
import com.workfora.leave.repository.LeaveTypeRepository;
import com.workfora.security.SecurityUtils;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LeaveService {

    private final LeaveTypeRepository leaveTypeRepository;
    private final LeaveBalanceRepository leaveBalanceRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final HolidayRepository holidayRepository;

    public LeaveService(
            LeaveTypeRepository leaveTypeRepository,
            LeaveBalanceRepository leaveBalanceRepository,
            LeaveRequestRepository leaveRequestRepository,
            HolidayRepository holidayRepository
    ) {
        this.leaveTypeRepository = leaveTypeRepository;
        this.leaveBalanceRepository = leaveBalanceRepository;
        this.leaveRequestRepository = leaveRequestRepository;
        this.holidayRepository = holidayRepository;
    }

    @Transactional(readOnly = true)
    public List<LeaveTypeResponse> listTypes() {
        return leaveTypeRepository.findByOrganizationId(OrgConstants.DEFAULT_ORG_ID).stream()
                .map(t -> new LeaveTypeResponse(t.getId(), t.getCode(), t.getName(), t.isPaid(), t.getMaxDaysPerYear(), t.getDescription()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<LeaveBalanceResponse> balances(UUID employeeId, Integer year) {
        int y = year != null ? year : LocalDate.now().getYear();
        return leaveBalanceRepository.findByEmployeeIdAndBalanceYear(employeeId, y).stream()
                .map(b -> new LeaveBalanceResponse(b.getId(), b.getEmployeeId(), b.getLeaveTypeId(), b.getBalanceYear(), b.getEntitled(), b.getUsed(), b.getPending()))
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<LeaveRequestResponse> listRequests(UUID employeeId, String status, Pageable pageable) {
        Page<LeaveRequest> page;
        if (employeeId != null) page = leaveRequestRepository.findByEmployeeId(employeeId, pageable);
        else if (status != null) page = leaveRequestRepository.findByStatus(status, pageable);
        else page = leaveRequestRepository.findAll(pageable);
        return page.map(this::toRequest);
    }

    @Transactional
    public LeaveRequestResponse createRequest(LeaveRequestCreate request) {
        UUID employeeId = SecurityUtils.currentUser()
                .map(u -> u.getEmployeeId())
                .orElseThrow(() -> new BusinessException("Current user has no linked employee"));
        LeaveType type = leaveTypeRepository.findById(request.leaveTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("Leave type not found"));
        if (request.endDate().isBefore(request.startDate())) {
            throw new BusinessException("End date must be on or after start date");
        }
        long days = ChronoUnit.DAYS.between(request.startDate(), request.endDate()) + 1;
        LeaveRequest entity = new LeaveRequest();
        entity.setEmployeeId(employeeId);
        entity.setLeaveTypeId(type.getId());
        entity.setStartDate(request.startDate());
        entity.setEndDate(request.endDate());
        entity.setDays(BigDecimal.valueOf(days));
        entity.setStatus("PENDING");
        entity.setReason(request.reason());
        LeaveRequest saved = leaveRequestRepository.save(entity);

        LeaveBalance balance = leaveBalanceRepository
                .findByEmployeeIdAndLeaveTypeIdAndBalanceYear(employeeId, type.getId(), request.startDate().getYear())
                .orElseGet(() -> {
                    LeaveBalance b = new LeaveBalance();
                    b.setEmployeeId(employeeId);
                    b.setLeaveTypeId(type.getId());
                    b.setBalanceYear(request.startDate().getYear());
                    b.setEntitled(type.getMaxDaysPerYear() != null ? BigDecimal.valueOf(type.getMaxDaysPerYear()) : BigDecimal.ZERO);
                    return b;
                });
        balance.setPending(balance.getPending().add(saved.getDays()));
        leaveBalanceRepository.save(balance);
        return toRequest(saved);
    }

    @Transactional
    public LeaveRequestResponse approve(UUID id, LeaveReviewRequest review) {
        return decide(id, "APPROVED", review);
    }

    @Transactional
    public LeaveRequestResponse reject(UUID id, LeaveReviewRequest review) {
        return decide(id, "REJECTED", review);
    }

    private LeaveRequestResponse decide(UUID id, String status, LeaveReviewRequest review) {
        LeaveRequest request = leaveRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Leave request not found"));
        if (!"PENDING".equals(request.getStatus())) {
            throw new BusinessException("Only pending requests can be reviewed");
        }
        UUID reviewer = SecurityUtils.currentUser().map(u -> u.getEmployeeId()).orElse(null);
        request.setStatus(status);
        request.setReviewedBy(reviewer);
        request.setReviewedAt(Instant.now());
        request.setReviewNotes(review != null ? review.reviewNotes() : null);

        LeaveBalance balance = leaveBalanceRepository
                .findByEmployeeIdAndLeaveTypeIdAndBalanceYear(request.getEmployeeId(), request.getLeaveTypeId(), request.getStartDate().getYear())
                .orElseThrow(() -> new BusinessException("Leave balance not found"));
        balance.setPending(balance.getPending().subtract(request.getDays()).max(BigDecimal.ZERO));
        if ("APPROVED".equals(status)) {
            balance.setUsed(balance.getUsed().add(request.getDays()));
        }
        leaveBalanceRepository.save(balance);
        return toRequest(leaveRequestRepository.save(request));
    }

    @Transactional(readOnly = true)
    public Page<HolidayResponse> listHolidays(Pageable pageable) {
        return holidayRepository.findByOrganizationId(OrgConstants.DEFAULT_ORG_ID, pageable)
                .map(h -> new HolidayResponse(h.getId(), h.getName(), h.getHolidayDate()));
    }

    @Transactional
    public HolidayResponse createHoliday(HolidayRequest request) {
        Holiday holiday = new Holiday();
        holiday.setOrganizationId(OrgConstants.DEFAULT_ORG_ID);
        holiday.setName(request.name());
        holiday.setHolidayDate(request.holidayDate());
        Holiday saved = holidayRepository.save(holiday);
        return new HolidayResponse(saved.getId(), saved.getName(), saved.getHolidayDate());
    }

    private LeaveRequestResponse toRequest(LeaveRequest r) {
        return new LeaveRequestResponse(
                r.getId(), r.getEmployeeId(), r.getLeaveTypeId(), r.getStartDate(), r.getEndDate(),
                r.getDays(), r.getStatus(), r.getReason(), r.getReviewedBy(), r.getReviewedAt(), r.getReviewNotes()
        );
    }
}
