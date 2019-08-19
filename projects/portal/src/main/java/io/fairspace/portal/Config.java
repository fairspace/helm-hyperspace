package io.fairspace.portal;


import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import io.fairspace.portal.model.Workspace;

import java.io.File;
import java.util.*;

public class Config {
    public final Auth auth = new Auth();

    public final io.fabric8.kubernetes.client.Config kubernetes = io.fabric8.kubernetes.client.Config.autoConfigure(null);

    public static class Auth {
        public boolean enabled = false;

        public String jwksUrl = "https://keycloak.hyperspace.ci.fairway.app/auth/realms/ci/protocol/openid-connect/certs";

        public String jwtAlgorithm = "RS256";
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
