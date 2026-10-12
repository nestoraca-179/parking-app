package com.parking.billing.config;

import java.math.BigDecimal;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "billing")
public record BillingProperties(String jwtSecret, String authUrl, BigDecimal taxRate) {
}
