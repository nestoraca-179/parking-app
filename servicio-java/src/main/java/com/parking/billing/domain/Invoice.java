package com.parking.billing.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "invoices")
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "invoices_id_seq")
    @SequenceGenerator(name = "invoices_id_seq", sequenceName = "invoices_id_seq", allocationSize = 1)
    private Long id;

    @Column(length = 30, unique = true)
    private String number;

    @Column(nullable = false, unique = true)
    private UUID ticketId;

    @Column(length = 10, nullable = false)
    private String plate;

    @Column(length = 15, nullable = false)
    private String vehicleType;

    @Column(nullable = false)
    private Instant entryAt;

    @Column(nullable = false)
    private Instant exitAt;

    @Column(nullable = false)
    private Integer totalMinutes;

    @Column(precision = 10, scale = 2, nullable = false)
    private BigDecimal subtotal;

    @Column(precision = 10, scale = 2, nullable = false)
    private BigDecimal tax;

    @Column(precision = 10, scale = 2, nullable = false)
    private BigDecimal total;

    @Column(length = 24, nullable = false)
    private String operatorId;

    @Column(length = 100, nullable = false)
    private String operatorName;

    @Column(nullable = false)
    private Instant createdAt;

    protected Invoice() {
    }

    public Invoice(UUID ticketId, String plate, String vehicleType, Instant entryAt, Instant exitAt,
                   Integer totalMinutes, BigDecimal subtotal, BigDecimal tax, BigDecimal total,
                   String operatorId, String operatorName, Instant createdAt) {
        this.ticketId = ticketId;
        this.plate = plate;
        this.vehicleType = vehicleType;
        this.entryAt = entryAt;
        this.exitAt = exitAt;
        this.totalMinutes = totalMinutes;
        this.subtotal = subtotal;
        this.tax = tax;
        this.total = total;
        this.operatorId = operatorId;
        this.operatorName = operatorName;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public String getNumber() {
        return number;
    }

    public void setNumber(String number) {
        this.number = number;
    }

    public UUID getTicketId() {
        return ticketId;
    }

    public String getPlate() {
        return plate;
    }

    public String getVehicleType() {
        return vehicleType;
    }

    public Instant getEntryAt() {
        return entryAt;
    }

    public Instant getExitAt() {
        return exitAt;
    }

    public Integer getTotalMinutes() {
        return totalMinutes;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public BigDecimal getTax() {
        return tax;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public String getOperatorId() {
        return operatorId;
    }

    public String getOperatorName() {
        return operatorName;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
