package com.parking.billing.service;

import com.parking.billing.dto.ReportDtos.DailyRevenue;
import com.parking.billing.dto.ReportDtos.OperatorRevenue;
import com.parking.billing.dto.ReportDtos.PeriodTotals;
import com.parking.billing.dto.ReportDtos.SummaryResponse;
import com.parking.billing.dto.ReportDtos.VehicleTypeRevenue;
import com.parking.billing.exception.ApiException;
import com.parking.billing.repository.InvoiceRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class ReportService {

    private static final int DEFAULT_WINDOW_DAYS = 30;
    private static final long MAX_WINDOW_DAYS = 366;

    private final InvoiceRepository repository;

    public ReportService(InvoiceRepository repository) {
        this.repository = repository;
    }

    public SummaryResponse summary() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        PeriodTotals todayTotals = totals(today, today.plusDays(1));
        LocalDate monthStart = today.withDayOfMonth(1);
        PeriodTotals monthTotals = totals(monthStart, monthStart.plusMonths(1));
        return new SummaryResponse(todayTotals, monthTotals);
    }

    public List<DailyRevenue> daily(LocalDate from, LocalDate to) {
        LocalDate[] range = resolveRange(from, to);
        Map<LocalDate, BigDecimal> totals = new TreeMap<>();
        Map<LocalDate, Long> counts = new TreeMap<>();
        for (Object[] row : repository.exitTotalsBetween(startOf(range[0]), startOf(range[1].plusDays(1)))) {
            LocalDate day = ((Instant) row[0]).atZone(ZoneOffset.UTC).toLocalDate();
            totals.merge(day, (BigDecimal) row[1], BigDecimal::add);
            counts.merge(day, 1L, Long::sum);
        }
        List<DailyRevenue> series = new ArrayList<>();
        for (LocalDate day = range[0]; !day.isAfter(range[1]); day = day.plusDays(1)) {
            series.add(new DailyRevenue(day, counts.getOrDefault(day, 0L), money(totals.get(day))));
        }
        return series;
    }

    public List<VehicleTypeRevenue> byVehicleType(LocalDate from, LocalDate to) {
        LocalDate[] range = resolveRange(from, to);
        return repository.revenueByVehicleType(startOf(range[0]), startOf(range[1].plusDays(1))).stream()
            .map(row -> new VehicleTypeRevenue((String) row[0], (Long) row[1], money((BigDecimal) row[2])))
            .toList();
    }

    public List<OperatorRevenue> byOperator(LocalDate from, LocalDate to) {
        LocalDate[] range = resolveRange(from, to);
        return repository.revenueByOperator(startOf(range[0]), startOf(range[1].plusDays(1))).stream()
            .map(row -> new OperatorRevenue((String) row[0], (String) row[1], (Long) row[2], money((BigDecimal) row[3])))
            .toList();
    }

    private PeriodTotals totals(LocalDate from, LocalDate toExclusive) {
        Object[] row = repository.totalsBetween(startOf(from), startOf(toExclusive)).get(0);
        return new PeriodTotals((Long) row[0], money((BigDecimal) row[1]), money((BigDecimal) row[2]),
            money((BigDecimal) row[3]));
    }

    private LocalDate[] resolveRange(LocalDate from, LocalDate to) {
        LocalDate end = to != null ? to : LocalDate.now(ZoneOffset.UTC);
        LocalDate start = from != null ? from : end.minusDays(DEFAULT_WINDOW_DAYS - 1L);
        if (start.isAfter(end)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "from must not be after to");
        }
        if (end.toEpochDay() - start.toEpochDay() >= MAX_WINDOW_DAYS) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "The range must not exceed 366 days");
        }
        return new LocalDate[] {start, end};
    }

    private static Instant startOf(LocalDate date) {
        return date.atStartOfDay(ZoneOffset.UTC).toInstant();
    }

    private static BigDecimal money(BigDecimal value) {
        BigDecimal safe = value == null ? BigDecimal.ZERO : value;
        return safe.setScale(2, RoundingMode.HALF_UP);
    }
}
