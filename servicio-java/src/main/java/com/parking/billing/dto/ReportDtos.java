package com.parking.billing.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.math.BigDecimal;
import java.time.LocalDate;

public final class ReportDtos {

    private ReportDtos() {
    }

    public record PeriodTotals(
        long invoices,
        @JsonFormat(shape = JsonFormat.Shape.STRING) BigDecimal subtotal,
        @JsonFormat(shape = JsonFormat.Shape.STRING) BigDecimal tax,
        @JsonFormat(shape = JsonFormat.Shape.STRING) BigDecimal total
    ) {
    }

    public record SummaryResponse(PeriodTotals today, PeriodTotals month) {
    }

    public record DailyRevenue(
        LocalDate date,
        long invoices,
        @JsonFormat(shape = JsonFormat.Shape.STRING) BigDecimal total
    ) {
    }

    public record VehicleTypeRevenue(
        String vehicleType,
        long invoices,
        @JsonFormat(shape = JsonFormat.Shape.STRING) BigDecimal total
    ) {
    }

    public record OperatorRevenue(
        String operatorId,
        String operatorName,
        long invoices,
        @JsonFormat(shape = JsonFormat.Shape.STRING) BigDecimal total
    ) {
    }
}
