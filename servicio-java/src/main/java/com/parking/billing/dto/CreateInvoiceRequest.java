package com.parking.billing.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record CreateInvoiceRequest(
    @NotNull UUID ticketId,
    @NotBlank @Size(max = 10) String plate,
    @NotBlank @Size(max = 15) String vehicleType,
    @NotNull Instant entryAt,
    @NotNull Instant exitAt,
    @NotNull @Min(0) Integer totalMinutes,
    @NotNull @DecimalMin("0.00") BigDecimal subtotal,
    @NotBlank @Size(max = 24) String operatorId
) {
}
