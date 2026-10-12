package com.parking.billing.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.parking.billing.domain.Invoice;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record InvoiceResponse(
    Long id,
    String number,
    UUID ticketId,
    String plate,
    String vehicleType,
    Instant entryAt,
    Instant exitAt,
    Integer totalMinutes,
    @JsonFormat(shape = JsonFormat.Shape.STRING) BigDecimal subtotal,
    @JsonFormat(shape = JsonFormat.Shape.STRING) BigDecimal tax,
    @JsonFormat(shape = JsonFormat.Shape.STRING) BigDecimal total,
    String operatorId,
    String operatorName,
    Instant createdAt
) {

    public static InvoiceResponse from(Invoice invoice) {
        return new InvoiceResponse(
            invoice.getId(),
            invoice.getNumber(),
            invoice.getTicketId(),
            invoice.getPlate(),
            invoice.getVehicleType(),
            invoice.getEntryAt(),
            invoice.getExitAt(),
            invoice.getTotalMinutes(),
            invoice.getSubtotal(),
            invoice.getTax(),
            invoice.getTotal(),
            invoice.getOperatorId(),
            invoice.getOperatorName(),
            invoice.getCreatedAt()
        );
    }
}
