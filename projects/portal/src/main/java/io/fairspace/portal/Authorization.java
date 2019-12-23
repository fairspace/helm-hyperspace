package io.fairspace.portal;


import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.jwk.source.RemoteJWKSet;
import com.nimbusds.jose.proc.BadJOSEException;
import com.nimbusds.jose.proc.JWSVerificationKeySelector;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.proc.DefaultJWTClaimsVerifier;
import com.nimbusds.jwt.proc.DefaultJWTProcessor;
import lombok.extern.slf4j.Slf4j;

import javax.servlet.http.HttpServletRequest;
import java.net.URL;
import java.text.ParseException;
import java.util.function.Function;

import static io.javalin.core.util.Header.AUTHORIZATION;

@Slf4j
public class Authorization {
    private static final String BEARER_PREFIX = "Bearer ";

    public static Function<HttpServletRequest, JWTClaimsSet> createAuthenticator(URL jwksUrl, String algorithm) {
        return createAuthenticator(jwksUrl, JWSAlgorithm.parse(algorithm));
    }

    public static Function<HttpServletRequest, JWTClaimsSet> createAuthenticator(URL jwksUrl, JWSAlgorithm algorithm) {
        var processor = new DefaultJWTProcessor<>() {{
            setJWSKeySelector(new JWSVerificationKeySelector<>(algorithm, new RemoteJWKSet<>(jwksUrl)));
            setJWTClaimsSetVerifier(new DefaultJWTClaimsVerifier<>());
        }};

        return request -> {
            var authorizationHeader = request.getHeader(AUTHORIZATION);

            if (authorizationHeader == null || !authorizationHeader.startsWith(BEARER_PREFIX)) {
                return null;
            }

            var token = authorizationHeader.substring(BEARER_PREFIX.length());
            try {
                return processor.process(token, null);
            } catch (ParseException | BadJOSEException | JOSEException e) {
                log.error("Error validating token", e);
                return null;
            }
        };
    }
}
