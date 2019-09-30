package io.fairspace.portal;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;

import java.net.URL;
import java.util.HashMap;
import java.util.Map;

public class Config {
    public String domain = "ci.fairway.app";
    public final Auth auth = new Auth();
    public final Map<String, URL> charts = new HashMap<>();
    public final Map<String, Map<String, ?>> defaultConfig = new HashMap<>();
    public String elasticSearchUrlTemplate = "http://hyperspace-ci-elasticsearch-client.hyperspace-ci.svc.cluster.local:9200/%s/_search";

    public static class Auth {
        public boolean enabled = false;

        public String jwksUrl = "https://keycloak.hyperspace.ci.fairway.app/auth/realms/ci/protocol/openid-connect/certs";

        public String jwtAlgorithm = "RS256";

        public String organisationAdminRole = "organisation-admin";
    }

    @Override
    public String toString() {
        try {
            return new ObjectMapper(new YAMLFactory()).writeValueAsString(this);
        } catch (JsonProcessingException e) {
            return super.toString();
        }
    }
}
