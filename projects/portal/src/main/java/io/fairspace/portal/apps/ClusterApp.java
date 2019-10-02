package io.fairspace.portal.apps;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.fairspace.portal.model.ClusterInformation;
import io.fairspace.portal.services.ClusterService;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;
import spark.RouteGroup;

import static org.eclipse.jetty.http.MimeTypes.Type.APPLICATION_JSON;
import static spark.Spark.get;

@Slf4j
public class ClusterApp implements RouteGroup {
    private static final ObjectMapper mapper = new ObjectMapper();

    private ClusterService clusterService;

    public ClusterApp(@NonNull ClusterService clusterService) {
        this.clusterService = clusterService;
    }

    @Override
    public void addRoutes() {
        get("", (request, response) -> {
            response.type(APPLICATION_JSON.asString());
            return new ClusterInformation(clusterService.getNumUnschedulablePods());
        }, mapper::writeValueAsString);
    }
}
