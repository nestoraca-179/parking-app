package com.parking.billing.controller;

import com.parking.billing.dto.ReportDtos.DailyRevenue;
import com.parking.billing.dto.ReportDtos.OperatorRevenue;
import com.parking.billing.dto.ReportDtos.SummaryResponse;
import com.parking.billing.dto.ReportDtos.VehicleTypeRevenue;
import com.parking.billing.service.ReportService;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/billing/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/summary")
    public SummaryResponse summary() {
        return reportService.summary();
    }

    @GetMapping("/daily")
    public List<DailyRevenue> daily(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return reportService.daily(from, to);
    }

    @GetMapping("/by-vehicle-type")
    public List<VehicleTypeRevenue> byVehicleType(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return reportService.byVehicleType(from, to);
    }

    @GetMapping("/by-operator")
    public List<OperatorRevenue> byOperator(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return reportService.byOperator(from, to);
    }
}
