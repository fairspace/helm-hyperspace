package io.fairspace.portal;

import hapi.chart.ChartOuterClass;
import io.fabric8.kubernetes.client.DefaultKubernetesClient;
import io.fairspace.oidc_auth.JwtTokenValidator;
import io.fairspace.portal.services.WorkspaceService;
import lombok.extern.slf4j.Slf4j;
import org.microbean.helm.ReleaseManager;
import org.microbean.helm.Tiller;
import org.microbean.helm.chart.URLChartLoader;

import java.io.IOException;

import static io.fairspace.portal.Config.WORKSPACE_CHART;
import static io.fairspace.portal.ConfigLoader.CONFIG;

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
