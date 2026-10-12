package com.parking.billing.controller;

import com.parking.billing.dto.CreateInvoiceRequest;
import com.parking.billing.dto.CreationResult;
import com.parking.billing.dto.InvoiceResponse;
import com.parking.billing.service.InvoiceService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/billing/invoices")
public class InternalInvoiceController {

    private final InvoiceService invoiceService;

    public InternalInvoiceController(InvoiceService invoiceService) {
        this.invoiceService = invoiceService;
    }

    @PostMapping
    public ResponseEntity<InvoiceResponse> create(@Valid @RequestBody CreateInvoiceRequest request) {
        CreationResult result = invoiceService.createOrGet(request);
        HttpStatus status = result.created() ? HttpStatus.CREATED : HttpStatus.OK;
        return ResponseEntity.status(status).body(result.invoice());
    }
}
