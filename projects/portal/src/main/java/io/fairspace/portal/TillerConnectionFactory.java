package io.fairspace.portal;

import io.fabric8.kubernetes.client.DefaultKubernetesClient;
import lombok.extern.slf4j.Slf4j;
import org.microbean.helm.ReleaseManager;
import org.microbean.helm.Tiller;

import java.io.IOException;

@Slf4j
public class TillerConnectionFactory {
    public static ReleaseManager getReleaseManager() throws IOException {
        try {
            var client = new DefaultKubernetesClient();
            var tiller = new Tiller(client);
            return new ReleaseManager(tiller);
        } catch(Exception e) {
            log.error("Error while initializing release manager for tiller.", e);
            throw e;
        }
    }
}
