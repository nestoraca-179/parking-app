package com.parking.billing.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class UserDirectoryClient {

    public static final String UNKNOWN_OPERATOR = "UNKNOWN";

    private static final Logger LOGGER = LoggerFactory.getLogger(UserDirectoryClient.class);
    private static final int MAX_NAME_LENGTH = 100;

    private final RestClient authRestClient;
    private final ServiceTokenService tokenService;

    public UserDirectoryClient(RestClient authRestClient, ServiceTokenService tokenService) {
        this.authRestClient = authRestClient;
        this.tokenService = tokenService;
    }

    public String findOperatorName(String operatorId) {
        try {
            DirectoryUser user = authRestClient.get()
                .uri("/internal/users/{id}", operatorId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenService.issue())
                .retrieve()
                .body(DirectoryUser.class);
            if (user == null || user.fullName() == null || user.fullName().isBlank()) {
                return UNKNOWN_OPERATOR;
            }
            return truncate(user.fullName());
        } catch (RuntimeException exception) {
            LOGGER.warn("Operator lookup failed: {}", exception.getMessage());
            return UNKNOWN_OPERATOR;
        }
    }

    private String truncate(String value) {
        return value.length() > MAX_NAME_LENGTH ? value.substring(0, MAX_NAME_LENGTH) : value;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record DirectoryUser(String id, String username, String fullName) {
    }
}
