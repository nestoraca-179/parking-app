package com.parking.billing.service;

import java.time.Instant;
import javax.crypto.SecretKey;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.stereotype.Service;
import com.nimbusds.jose.jwk.source.ImmutableSecret;

@Service
public class ServiceTokenService {

    private static final String SERVICE_NAME = "billing-service";
    private static final long TOKEN_TTL_SECONDS = 60;

    private final NimbusJwtEncoder encoder;

    public ServiceTokenService(SecretKey jwtSecretKey) {
        this.encoder = new NimbusJwtEncoder(new ImmutableSecret<>(jwtSecretKey));
    }

    public String issue() {
        Instant issuedAt = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
            .issuer(SERVICE_NAME)
            .subject(SERVICE_NAME)
            .issuedAt(issuedAt)
            .expiresAt(issuedAt.plusSeconds(TOKEN_TTL_SECONDS))
            .claim("role", "SERVICE")
            .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }
}
