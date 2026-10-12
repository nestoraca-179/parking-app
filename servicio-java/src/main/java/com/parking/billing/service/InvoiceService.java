package com.parking.billing.service;

import com.parking.billing.config.BillingProperties;
import com.parking.billing.domain.Invoice;
import com.parking.billing.dto.CreateInvoiceRequest;
import com.parking.billing.dto.CreationResult;
import com.parking.billing.dto.InvoiceResponse;
import com.parking.billing.dto.PageResponse;
import com.parking.billing.exception.ApiException;
import com.parking.billing.repository.InvoiceRepository;
import jakarta.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

@Service
public class InvoiceService {

    private static final int MONEY_SCALE = 2;

    private final InvoiceRepository repository;
    private final UserDirectoryClient userDirectory;
    private final BillingProperties properties;
    private final TransactionTemplate transactionTemplate;

    public InvoiceService(InvoiceRepository repository, UserDirectoryClient userDirectory,
                          BillingProperties properties, PlatformTransactionManager transactionManager) {
        this.repository = repository;
        this.userDirectory = userDirectory;
        this.properties = properties;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
    }

    public CreationResult createOrGet(CreateInvoiceRequest request) {
        Optional<Invoice> existing = repository.findByTicketId(request.ticketId());
        if (existing.isPresent()) {
            return new CreationResult(InvoiceResponse.from(existing.get()), false);
        }
        String operatorName = userDirectory.findOperatorName(request.operatorId());
        try {
            Invoice created = transactionTemplate.execute(status -> persist(request, operatorName));
            return new CreationResult(InvoiceResponse.from(created), true);
        } catch (DataIntegrityViolationException exception) {
            Invoice winner = repository.findByTicketId(request.ticketId()).orElseThrow(() -> exception);
            return new CreationResult(InvoiceResponse.from(winner), false);
        }
    }

    public InvoiceResponse getById(Long id) {
        return repository.findById(id)
            .map(InvoiceResponse::from)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "INVOICE_NOT_FOUND", "Invoice not found"));
    }

    public PageResponse<InvoiceResponse> list(String plate, LocalDate from, LocalDate to, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "exitAt", "id"));
        Page<Invoice> result = repository.findAll(filter(plate, from, to), pageRequest);
        List<InvoiceResponse> content = result.getContent().stream().map(InvoiceResponse::from).toList();
        return new PageResponse<>(content, result.getNumber(), result.getSize(), result.getTotalElements(),
            result.getTotalPages());
    }

    private Invoice persist(CreateInvoiceRequest request, String operatorName) {
        BigDecimal subtotal = request.subtotal().setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        BigDecimal tax = subtotal.multiply(properties.taxRate()).setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        BigDecimal total = subtotal.add(tax);
        Invoice invoice = new Invoice(
            request.ticketId(),
            request.plate(),
            request.vehicleType(),
            request.entryAt(),
            request.exitAt(),
            request.totalMinutes(),
            subtotal,
            tax,
            total,
            request.operatorId(),
            operatorName,
            Instant.now().truncatedTo(ChronoUnit.MICROS)
        );
        Invoice saved = repository.save(invoice);
        saved.setNumber(String.format("INV-%08d", saved.getId()));
        repository.flush();
        return saved;
    }

    private Specification<Invoice> filter(String plate, LocalDate from, LocalDate to) {
        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (plate != null && !plate.isBlank()) {
                String pattern = "%" + escapeLike(plate.trim().toUpperCase()) + "%";
                predicates.add(builder.like(builder.upper(root.get("plate")), pattern, '\\'));
            }
            if (from != null) {
                predicates.add(builder.greaterThanOrEqualTo(root.get("exitAt"), startOfDay(from)));
            }
            if (to != null) {
                predicates.add(builder.lessThan(root.get("exitAt"), startOfDay(to.plusDays(1))));
            }
            return builder.and(predicates.toArray(new Predicate[0]));
        };
    }

    private static Instant startOfDay(LocalDate date) {
        return date.atStartOfDay(ZoneOffset.UTC).toInstant();
    }

    private static String escapeLike(String value) {
        return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}
