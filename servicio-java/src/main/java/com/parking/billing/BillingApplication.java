package com.parking.billing;

import com.parking.billing.config.DatabaseWaiter;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class BillingApplication {

    public static void main(String[] args) {
        DatabaseWaiter.awaitConnection();
        SpringApplication.run(BillingApplication.class, args);
    }
}
