package com.workfora.asset;

import com.workfora.asset.domain.Asset;
import com.workfora.asset.domain.AssetAssignment;
import com.workfora.asset.domain.AssetCategory;
import com.workfora.asset.domain.AssetEvent;
import com.workfora.asset.dto.AssetDtos.*;
import com.workfora.asset.dto.OpenAssignment;
import com.workfora.asset.repository.AssetAssignmentRepository;
import com.workfora.asset.repository.AssetCategoryRepository;
import com.workfora.asset.repository.AssetEventRepository;
import com.workfora.asset.repository.AssetRepository;
import com.workfora.common.exception.BusinessException;
import com.workfora.common.exception.ResourceNotFoundException;
import com.workfora.employee.domain.Employee;
import com.workfora.employee.domain.EmployeeStatus;
import com.workfora.employee.repository.EmployeeRepository;
import com.workfora.identity.domain.UserAccount;
import com.workfora.identity.repository.UserAccountRepository;
import com.workfora.security.SecurityUtils;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

@Service
public class AssetService {

    private static final String AVAILABLE = "AVAILABLE";
    private static final String ASSIGNED = "ASSIGNED";

    private final AssetCategoryRepository categoryRepository;
    private final AssetRepository assetRepository;
    private final AssetAssignmentRepository assignmentRepository;
    private final AssetEventRepository eventRepository;
    private final EmployeeRepository employeeRepository;
    private final UserAccountRepository userAccountRepository;
    private final AssetHistoryQuery historyQuery;
    private final TransactionTemplate transactionTemplate;

    public AssetService(
            AssetCategoryRepository categoryRepository,
            AssetRepository assetRepository,
            AssetAssignmentRepository assignmentRepository,
            AssetEventRepository eventRepository,
            EmployeeRepository employeeRepository,
            UserAccountRepository userAccountRepository,
            AssetHistoryQuery historyQuery,
            PlatformTransactionManager transactionManager
    ) {
        this.categoryRepository = categoryRepository;
        this.assetRepository = assetRepository;
        this.assignmentRepository = assignmentRepository;
        this.eventRepository = eventRepository;
        this.employeeRepository = employeeRepository;
        this.userAccountRepository = userAccountRepository;
        this.historyQuery = historyQuery;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
    }

    @Transactional(readOnly = true)
    public Page<CategoryResponse> listCategories(Pageable pageable) {
        return categoryRepository.findByOrganizationId(SecurityUtils.requireOrganizationId(), pageable)
                .map(c -> new CategoryResponse(c.getId(), c.getName(), c.getDescription()));
    }

    @Transactional
    public CategoryResponse createCategory(CategoryRequest request) {
        UUID organizationId = SecurityUtils.requireOrganizationId();
        String name = request.name().trim();
        ensureUniqueCategoryName(organizationId, name, null);
        AssetCategory category = new AssetCategory();
        category.setOrganizationId(organizationId);
        category.setName(name);
        category.setDescription(blankToNull(request.description()));
        category.setCreatedBy(SecurityUtils.requireUserId());
        try {
            return toCategory(categoryRepository.saveAndFlush(category));
        } catch (DataIntegrityViolationException ex) {
            throw duplicateCategory();
        }
    }

    @Transactional
    public CategoryResponse updateCategory(UUID id, CategoryRequest request) {
        UUID organizationId = SecurityUtils.requireOrganizationId();
        AssetCategory category = categoryRepository.findByIdAndOrganizationId(id, organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        String name = request.name().trim();
        ensureUniqueCategoryName(organizationId, name, id);
        category.setName(name);
        category.setDescription(blankToNull(request.description()));
        category.setUpdatedBy(SecurityUtils.requireUserId());
        try {
            return toCategory(categoryRepository.saveAndFlush(category));
        } catch (DataIntegrityViolationException ex) {
            throw duplicateCategory();
        }
    }

    @Transactional
    public CategoryResponse deleteCategory(UUID id) {
        UUID organizationId = SecurityUtils.requireOrganizationId();
        AssetCategory category = categoryRepository.findByIdAndOrganizationId(id, organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        if (assetRepository.countByOrganizationIdAndCategoryId(organizationId, id) > 0) {
            throw categoryInUse();
        }
        CategoryResponse response = toCategory(category);
        try {
            categoryRepository.delete(category);
            categoryRepository.flush();
        } catch (DataIntegrityViolationException ex) {
            throw categoryInUse();
        }
        return response;
    }

    @Transactional(readOnly = true)
    public Page<AssetResponse> listAssets(boolean archived, Pageable pageable) {
        UUID organizationId = SecurityUtils.requireOrganizationId();
        Page<Asset> page = archived
                ? assetRepository.findByOrganizationIdAndArchivedAtIsNotNull(organizationId, pageable)
                : assetRepository.findByOrganizationIdAndArchivedAtIsNull(organizationId, pageable);
        Map<UUID, OpenAssignment> open = openAssignments(organizationId, page.getContent());
        return page.map(asset -> toResponse(asset, open.get(asset.getId())));
    }

    @Transactional
    public AssetResponse createAsset(AssetRequest request) {
        UUID organizationId = SecurityUtils.requireOrganizationId();
        String tag = request.assetTag().trim();
        if (assetRepository.existsByOrganizationIdAndAssetTagIgnoreCaseAndArchivedAtIsNull(organizationId, tag)) {
            throw duplicateTag();
        }
        UUID categoryId = resolveCategory(organizationId, request.categoryId());
        Asset asset = new Asset();
        asset.setOrganizationId(organizationId);
        asset.setCreatedBy(SecurityUtils.requireUserId());
        apply(asset, request, tag, categoryId);
        asset.setStatus(AVAILABLE);
        try {
            return toResponse(assetRepository.saveAndFlush(asset), null);
        } catch (DataIntegrityViolationException ex) {
            throw duplicateTag();
        }
    }

    @Transactional
    public AssetResponse updateAsset(UUID assetId, AssetRequest request) {
        UUID organizationId = SecurityUtils.requireOrganizationId();
        Asset asset = requireAsset(organizationId, assetId);
        if (asset.getArchivedAt() != null) {
            throw new BusinessException("Archived assets cannot be edited");
        }
        String tag = request.assetTag().trim();
        if (assetRepository.existsByOrganizationIdAndAssetTagIgnoreCaseAndArchivedAtIsNullAndIdNot(organizationId, tag, assetId)) {
            throw duplicateTag();
        }
        UUID categoryId = resolveCategory(organizationId, request.categoryId());
        recordChanges(asset, request, tag, categoryId);
        apply(asset, request, tag, categoryId);
        asset.setUpdatedBy(SecurityUtils.requireUserId());
        try {
            Asset saved = assetRepository.saveAndFlush(asset);
            return toResponse(saved, openAssignment(organizationId, saved));
        } catch (DataIntegrityViolationException ex) {
            throw duplicateTag();
        }
    }

    @Transactional
    public AssetResponse archive(UUID assetId) {
        archiveOne(SecurityUtils.requireOrganizationId(), assetId);
        Asset asset = requireAsset(SecurityUtils.requireOrganizationId(), assetId);
        return toResponse(asset, null);
    }

    @Transactional
    public AssignmentResponse assign(UUID assetId, AssignRequest request) {
        return assignOne(
                SecurityUtils.requireOrganizationId(),
                assetId,
                request.employeeId(),
                blankToNull(request.notes())
        );
    }

    @Transactional
    public AssignmentResponse returnAsset(UUID assetId) {
        return returnOne(SecurityUtils.requireOrganizationId(), assetId);
    }

    @Transactional(readOnly = true)
    public AssetHistoryResponse history(UUID assetId) {
        UUID organizationId = SecurityUtils.requireOrganizationId();
        Asset asset = requireAsset(organizationId, assetId);
        List<AssetEvent> changes = eventRepository.findByAssetIdAndOrganizationIdOrderByOccurredAtAsc(assetId, organizationId);
        List<AssetAssignment> assignments = assignmentRepository.findByAssetIdOrderByAssignedAtAsc(assetId);
        Map<UUID, Employee> employees = employeesById(assignments);
        Map<UUID, String> actors = actorNames(actorIds(asset, changes, assignments));
        OpenAssignment current = asset.getArchivedAt() == null ? openAssignment(organizationId, asset) : null;

        List<HistoryEventResponse> events = new ArrayList<>();
        events.add(new HistoryEventResponse(
                "CREATED",
                asset.getCreatedAt(),
                asset.getCreatedBy(),
                actors.get(asset.getCreatedBy()),
                null,
                null,
                asset.getName(),
                null,
                null,
                null,
                null,
                null,
                null
        ));
        for (AssetEvent change : changes) {
            events.add(new HistoryEventResponse(
                    change.getEventType(),
                    change.getOccurredAt(),
                    change.getActorUserId(),
                    actors.get(change.getActorUserId()),
                    change.getFieldName(),
                    change.getPreviousValue(),
                    change.getNewValue(),
                    null,
                    null,
                    null,
                    null,
                    null,
                    null
            ));
        }
        for (AssetAssignment assignment : assignments) {
            Employee employee = employees.get(assignment.getEmployeeId());
            String employeeName = employee == null ? null : fullName(employee.getFirstName(), employee.getLastName());
            String employeeNumber = employee == null ? null : employee.getEmployeeNumber();
            events.add(new HistoryEventResponse(
                    "ASSIGNED",
                    assignment.getAssignedAt(),
                    assignment.getCreatedBy(),
                    actors.get(assignment.getCreatedBy()),
                    null,
                    null,
                    null,
                    assignment.getEmployeeId(),
                    employeeName,
                    employeeNumber,
                    assignment.getAssignedAt(),
                    assignment.getReturnedAt(),
                    assignment.getNotes()
            ));
            if (assignment.getReturnedAt() != null) {
                events.add(new HistoryEventResponse(
                        "RETURNED",
                        assignment.getReturnedAt(),
                        assignment.getUpdatedBy(),
                        actors.get(assignment.getUpdatedBy()),
                        null,
                        null,
                        null,
                        assignment.getEmployeeId(),
                        employeeName,
                        employeeNumber,
                        assignment.getAssignedAt(),
                        assignment.getReturnedAt(),
                        assignment.getNotes()
                ));
            }
        }
        events.sort(Comparator.comparing(HistoryEventResponse::occurredAt, Comparator.nullsLast(Comparator.reverseOrder()))
                .thenComparing(HistoryEventResponse::type));
        return new AssetHistoryResponse(
                asset.getId(),
                asset.getName(),
                asset.getAssetTag(),
                asset.getStatus(),
                asset.getArchivedAt(),
                toCurrent(current),
                events
        );
    }

    @Transactional(readOnly = true)
    public Page<HistoryFeedItem> historyFeed(UUID assetId, String type, String search, Pageable pageable) {
        UUID organizationId = SecurityUtils.requireOrganizationId();
        if (assetId != null) {
            requireAsset(organizationId, assetId);
        }
        Page<AssetHistoryQuery.Row> page = historyQuery.page(organizationId, assetId, type, search, pageable);
        Map<UUID, String> actors = actorNames(page.getContent().stream()
                .map(AssetHistoryQuery.Row::actorUserId)
                .filter(Objects::nonNull)
                .collect(java.util.stream.Collectors.toSet()));
        Map<UUID, Employee> employees = new HashMap<>();
        Set<UUID> employeeIds = page.getContent().stream()
                .map(AssetHistoryQuery.Row::employeeId)
                .filter(Objects::nonNull)
                .collect(java.util.stream.Collectors.toSet());
        if (!employeeIds.isEmpty()) {
            for (Employee employee : employeeRepository.findAllById(employeeIds)) {
                employees.put(employee.getId(), employee);
            }
        }
        return page.map(row -> new HistoryFeedItem(
                row.assetId(),
                row.assetName(),
                row.assetTag(),
                row.assetStatus(),
                row.archivedAt(),
                toHistoryEvent(row, actors, employees)
        ));
    }

    private HistoryEventResponse toHistoryEvent(
            AssetHistoryQuery.Row row,
            Map<UUID, String> actors,
            Map<UUID, Employee> employees
    ) {
        Employee employee = row.employeeId() == null ? null : employees.get(row.employeeId());
        return new HistoryEventResponse(
                row.eventType(),
                row.occurredAt(),
                row.actorUserId(),
                row.actorUserId() == null ? null : actors.get(row.actorUserId()),
                row.fieldName(),
                row.previousValue(),
                row.newValue(),
                row.employeeId(),
                employee == null ? null : fullName(employee.getFirstName(), employee.getLastName()),
                employee == null ? null : employee.getEmployeeNumber(),
                row.assignedAt(),
                row.returnedAt(),
                row.notes()
        );
    }

    public BulkResult bulkArchive(BulkIdsRequest request) {
        UUID organizationId = SecurityUtils.requireOrganizationId();
        return runEach(distinct(request.ids()), id -> {
            transactionTemplate.executeWithoutResult(status -> archiveOne(organizationId, id));
            return "Archived";
        });
    }

    public BulkResult bulkUpdateCategory(BulkCategoryRequest request) {
        UUID organizationId = SecurityUtils.requireOrganizationId();
        if (request.clearCategory() && request.categoryId() != null) {
            throw new BusinessException("Choose a category or clear the category, not both");
        }
        if (!request.clearCategory() && request.categoryId() == null) {
            throw new BusinessException("Choose a category or clear the category");
        }
        UUID categoryId = request.clearCategory() ? null : resolveCategory(organizationId, request.categoryId());
        String categoryName = categoryId == null ? "" : categoryRepository.findByIdAndOrganizationId(categoryId, organizationId)
                .map(AssetCategory::getName)
                .orElse("");
        return runEach(distinct(request.ids()), id -> {
            String message = transactionTemplate.execute(status -> updateCategoryOne(organizationId, id, categoryId, categoryName));
            return message == null ? "Category updated" : message;
        });
    }

    public BulkResult bulkAssign(BulkAssignRequest request) {
        UUID organizationId = SecurityUtils.requireOrganizationId();
        Employee employee = requireActiveEmployee(organizationId, request.employeeId());
        String notes = blankToNull(request.notes());
        return runEach(distinct(request.ids()), id -> {
            transactionTemplate.executeWithoutResult(status -> assignOne(organizationId, id, employee.getId(), notes));
            return "Assigned";
        });
    }

    private String updateCategoryOne(UUID organizationId, UUID assetId, UUID categoryId, String categoryName) {
        Asset asset = requireAsset(organizationId, assetId);
        if (asset.getArchivedAt() != null) {
            throw new BusinessException("Archived assets cannot be edited");
        }
        if (Objects.equals(asset.getCategoryId(), categoryId)) {
            return "Category unchanged";
        }
        String previous = categoryName(organizationId, asset.getCategoryId());
        asset.setCategoryId(categoryId);
        asset.setUpdatedBy(SecurityUtils.requireUserId());
        assetRepository.save(asset);
        record(asset, "category", previous, categoryName);
        return "Category updated";
    }

    private void archiveOne(UUID organizationId, UUID assetId) {
        Asset asset = assetRepository.lockByIdAndOrganizationId(assetId, organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found"));
        if (asset.getArchivedAt() != null) {
            throw new BusinessException("Asset is already archived");
        }
        if (ASSIGNED.equals(asset.getStatus())
                || assignmentRepository.findFirstByAssetIdAndReturnedAtIsNullOrderByAssignedAtDesc(assetId).isPresent()) {
            throw new BusinessException("Return the asset before archiving it");
        }
        asset.setArchivedAt(Instant.now());
        asset.setActiveAssetTag(null);
        asset.setUpdatedBy(SecurityUtils.requireUserId());
        assetRepository.save(asset);
        AssetEvent event = newEvent(asset, "ARCHIVED");
        event.setNewValue(asset.getName());
        eventRepository.save(event);
    }

    private AssignmentResponse assignOne(UUID organizationId, UUID assetId, UUID employeeId, String notes) {
        Asset asset = assetRepository.lockByIdAndOrganizationId(assetId, organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found"));
        if (asset.getArchivedAt() != null) {
            throw new BusinessException("Archived assets cannot be assigned");
        }
        if (!AVAILABLE.equals(asset.getStatus())
                || assignmentRepository.findFirstByAssetIdAndReturnedAtIsNullOrderByAssignedAtDesc(assetId).isPresent()) {
            throw new BusinessException("Asset is not available");
        }
        Employee employee = requireActiveEmployee(organizationId, employeeId);
        AssetAssignment assignment = new AssetAssignment();
        assignment.setAssetId(assetId);
        assignment.setEmployeeId(employee.getId());
        assignment.setAssignedAt(Instant.now());
        assignment.setNotes(notes);
        assignment.setOpenAssetId(assetId);
        assignment.setCreatedBy(SecurityUtils.requireUserId());
        asset.setStatus(ASSIGNED);
        asset.setUpdatedBy(SecurityUtils.requireUserId());
        assetRepository.save(asset);
        try {
            AssetAssignment saved = assignmentRepository.saveAndFlush(assignment);
            return new AssignmentResponse(
                    saved.getId(), saved.getAssetId(), saved.getEmployeeId(),
                    saved.getAssignedAt(), saved.getReturnedAt(), saved.getNotes()
            );
        } catch (DataIntegrityViolationException ex) {
            throw new BusinessException("Asset is not available");
        }
    }

    private AssignmentResponse returnOne(UUID organizationId, UUID assetId) {
        Asset asset = assetRepository.lockByIdAndOrganizationId(assetId, organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found"));
        if (!ASSIGNED.equals(asset.getStatus())) {
            throw new BusinessException("Asset is not assigned");
        }
        AssetAssignment assignment = assignmentRepository.findFirstByAssetIdAndReturnedAtIsNullOrderByAssignedAtDesc(assetId)
                .orElseThrow(() -> new BusinessException("No active assignment found"));
        assignment.setReturnedAt(Instant.now());
        assignment.setOpenAssetId(null);
        assignment.setUpdatedBy(SecurityUtils.requireUserId());
        asset.setStatus(AVAILABLE);
        asset.setUpdatedBy(SecurityUtils.requireUserId());
        assetRepository.save(asset);
        AssetAssignment saved = assignmentRepository.save(assignment);
        return new AssignmentResponse(
                saved.getId(), saved.getAssetId(), saved.getEmployeeId(),
                saved.getAssignedAt(), saved.getReturnedAt(), saved.getNotes()
        );
    }

    private BulkResult runEach(List<UUID> ids, ItemAction action) {
        List<BulkItemResult> items = new ArrayList<>();
        for (UUID id : ids) {
            try {
                items.add(new BulkItemResult(id, true, action.run(id)));
            } catch (BusinessException | ResourceNotFoundException ex) {
                items.add(new BulkItemResult(id, false, ex.getMessage()));
            }
        }
        int succeeded = (int) items.stream().filter(BulkItemResult::success).count();
        return new BulkResult(succeeded, items.size() - succeeded, items);
    }

    private void apply(Asset asset, AssetRequest request, String tag, UUID categoryId) {
        asset.setAssetTag(tag);
        asset.setActiveAssetTag(tag);
        asset.setName(request.name().trim());
        asset.setCategoryId(categoryId);
        asset.setSerialNumber(blankToNull(request.serialNumber()));
        asset.setPurchaseDate(request.purchaseDate());
        asset.setPurchaseCost(request.purchaseCost());
        asset.setNotes(blankToNull(request.notes()));
    }

    private void recordChanges(Asset asset, AssetRequest request, String tag, UUID categoryId) {
        UUID organizationId = asset.getOrganizationId();
        compare(asset, "name", asset.getName(), request.name().trim());
        compare(asset, "assetTag", asset.getAssetTag(), tag);
        if (!Objects.equals(asset.getCategoryId(), categoryId)) {
            record(asset, "category", categoryName(organizationId, asset.getCategoryId()), categoryName(organizationId, categoryId));
        }
        compare(asset, "serialNumber", asset.getSerialNumber(), blankToNull(request.serialNumber()));
        compare(asset, "purchaseDate", date(asset.getPurchaseDate()), date(request.purchaseDate()));
        compare(asset, "purchaseCost", money(asset.getPurchaseCost()), money(request.purchaseCost()));
        compare(asset, "notes", asset.getNotes(), blankToNull(request.notes()));
    }

    private void compare(Asset asset, String field, String previous, String next) {
        String left = previous == null ? "" : previous;
        String right = next == null ? "" : next;
        if (!left.equals(right)) {
            record(asset, field, left, right);
        }
    }

    private void record(Asset asset, String field, String previous, String next) {
        AssetEvent event = newEvent(asset, "UPDATED");
        event.setFieldName(field);
        event.setPreviousValue(previous == null || previous.isEmpty() ? null : previous);
        event.setNewValue(next == null || next.isEmpty() ? null : next);
        eventRepository.save(event);
    }

    private AssetEvent newEvent(Asset asset, String type) {
        AssetEvent event = new AssetEvent();
        event.setOrganizationId(asset.getOrganizationId());
        event.setAssetId(asset.getId());
        event.setEventType(type);
        event.setOccurredAt(Instant.now());
        event.setActorUserId(SecurityUtils.requireUserId());
        event.setCreatedBy(event.getActorUserId());
        return event;
    }

    private Asset requireAsset(UUID organizationId, UUID assetId) {
        return assetRepository.findByIdAndOrganizationId(assetId, organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found"));
    }

    private Employee requireActiveEmployee(UUID organizationId, UUID employeeId) {
        Employee employee = employeeRepository.findByIdAndOrganizationId(employeeId, organizationId)
                .orElseThrow(() -> new BusinessException("Employee was not found in this organization"));
        if (employee.getStatus() != EmployeeStatus.ACTIVE) {
            throw new BusinessException("Employee is not active");
        }
        return employee;
    }

    private UUID resolveCategory(UUID organizationId, UUID categoryId) {
        if (categoryId == null) {
            return null;
        }
        categoryRepository.findByIdAndOrganizationId(categoryId, organizationId)
                .orElseThrow(() -> new BusinessException("Category was not found in this organization"));
        return categoryId;
    }

    private String categoryName(UUID organizationId, UUID categoryId) {
        if (categoryId == null) {
            return "";
        }
        return categoryRepository.findByIdAndOrganizationId(categoryId, organizationId)
                .map(AssetCategory::getName)
                .orElse(categoryId.toString());
    }

    private Map<UUID, OpenAssignment> openAssignments(UUID organizationId, List<Asset> assets) {
        List<UUID> ids = assets.stream()
                .filter(asset -> ASSIGNED.equals(asset.getStatus()))
                .map(Asset::getId)
                .toList();
        if (ids.isEmpty()) {
            return Map.of();
        }
        Map<UUID, OpenAssignment> open = new HashMap<>();
        for (OpenAssignment assignment : assignmentRepository.findOpenAssignments(ids, organizationId)) {
            open.putIfAbsent(assignment.assetId(), assignment);
        }
        return open;
    }

    private OpenAssignment openAssignment(UUID organizationId, Asset asset) {
        if (!ASSIGNED.equals(asset.getStatus())) {
            return null;
        }
        return openAssignments(organizationId, List.of(asset)).get(asset.getId());
    }

    private AssetResponse toResponse(Asset asset, OpenAssignment assignment) {
        return new AssetResponse(
                asset.getId(),
                asset.getCategoryId(),
                asset.getAssetTag(),
                asset.getName(),
                asset.getSerialNumber(),
                asset.getStatus(),
                asset.getPurchaseDate(),
                asset.getPurchaseCost(),
                asset.getNotes(),
                asset.getArchivedAt(),
                toCurrent(assignment)
        );
    }

    private CurrentAssignmentResponse toCurrent(OpenAssignment assignment) {
        if (assignment == null) {
            return null;
        }
        return new CurrentAssignmentResponse(
                assignment.employeeId(),
                fullName(assignment.firstName(), assignment.lastName()),
                assignment.employeeNumber(),
                assignment.assignedAt()
        );
    }

    private Map<UUID, Employee> employeesById(List<AssetAssignment> assignments) {
        Set<UUID> ids = new HashSet<>();
        for (AssetAssignment assignment : assignments) {
            ids.add(assignment.getEmployeeId());
        }
        if (ids.isEmpty()) {
            return Map.of();
        }
        Map<UUID, Employee> employees = new HashMap<>();
        for (Employee employee : employeeRepository.findAllById(ids)) {
            employees.put(employee.getId(), employee);
        }
        return employees;
    }

    private Set<UUID> actorIds(Asset asset, List<AssetEvent> changes, List<AssetAssignment> assignments) {
        Set<UUID> ids = new HashSet<>();
        if (asset.getCreatedBy() != null) {
            ids.add(asset.getCreatedBy());
        }
        for (AssetEvent change : changes) {
            if (change.getActorUserId() != null) {
                ids.add(change.getActorUserId());
            }
        }
        for (AssetAssignment assignment : assignments) {
            if (assignment.getCreatedBy() != null) {
                ids.add(assignment.getCreatedBy());
            }
            if (assignment.getUpdatedBy() != null) {
                ids.add(assignment.getUpdatedBy());
            }
        }
        return ids;
    }

    private Map<UUID, String> actorNames(Set<UUID> userIds) {
        if (userIds.isEmpty()) {
            return Map.of();
        }
        List<UserAccount> users = userAccountRepository.findAllById(userIds);
        Set<UUID> employeeIds = new HashSet<>();
        for (UserAccount user : users) {
            if (user.getEmployeeId() != null) {
                employeeIds.add(user.getEmployeeId());
            }
        }
        Map<UUID, Employee> employees = new HashMap<>();
        if (!employeeIds.isEmpty()) {
            for (Employee employee : employeeRepository.findAllById(employeeIds)) {
                employees.put(employee.getId(), employee);
            }
        }
        Map<UUID, String> names = new HashMap<>();
        for (UserAccount user : users) {
            Employee employee = user.getEmployeeId() == null ? null : employees.get(user.getEmployeeId());
            names.put(user.getId(), employee == null ? user.getEmail() : fullName(employee.getFirstName(), employee.getLastName()));
        }
        return names;
    }

    private static List<UUID> distinct(List<UUID> ids) {
        return List.copyOf(new LinkedHashSet<>(ids));
    }

    private static String fullName(String firstName, String lastName) {
        return ((firstName == null ? "" : firstName) + " " + (lastName == null ? "" : lastName)).trim();
    }

    private static String blankToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static String date(LocalDate value) {
        return value == null ? "" : value.toString();
    }

    private static String money(BigDecimal value) {
        return value == null ? "" : value.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    private void ensureUniqueCategoryName(UUID organizationId, String name, UUID excludingId) {
        boolean taken = excludingId == null
                ? categoryRepository.existsByOrganizationIdAndName(organizationId, name)
                : categoryRepository.existsByOrganizationIdAndNameAndIdNot(organizationId, name, excludingId);
        if (taken) {
            throw duplicateCategory();
        }
    }

    private static CategoryResponse toCategory(AssetCategory category) {
        return new CategoryResponse(category.getId(), category.getName(), category.getDescription());
    }

    private static BusinessException duplicateCategory() {
        return new BusinessException("A category with this name already exists in the organization", HttpStatus.CONFLICT);
    }

    private static BusinessException categoryInUse() {
        return new BusinessException("Remove this category from its assets before deleting it", HttpStatus.CONFLICT);
    }

    private static BusinessException duplicateTag() {
        return new BusinessException("An asset with this tag already exists in the organization", HttpStatus.CONFLICT);
    }

    @FunctionalInterface
    private interface ItemAction {
        String run(UUID id);
    }
}
