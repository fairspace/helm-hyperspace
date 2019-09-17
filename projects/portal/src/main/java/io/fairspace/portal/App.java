package io.fairspace.portal;

import com.fasterxml.jackson.databind.JsonMappingException;
import io.fairspace.oidc_auth.JwtTokenValidator;
import io.fairspace.portal.apps.SearchApp;
import io.fairspace.portal.apps.WorkspacesApp;
import io.fairspace.portal.errors.ForbiddenException;
import io.fairspace.portal.errors.NotFoundException;
import io.fairspace.portal.services.CachedReleaseList;
import io.fairspace.portal.services.ChartRepo;
import io.fairspace.portal.services.WorkspaceService;
import io.fairspace.portal.services.releases.AppReleaseRequestBuilder;
import io.fairspace.portal.services.releases.JupyterReleaseRequestBuilder;
import lombok.extern.slf4j.Slf4j;
import org.microbean.helm.ReleaseManager;
import org.microbean.helm.chart.URLChartLoader;

import java.io.IOException;
import java.util.Map;

import static io.fairspace.portal.Authentication.getUserInfo;
import static io.fairspace.portal.ConfigLoader.CONFIG;
import static io.fairspace.portal.errors.ErrorHelper.errorBody;
import static io.fairspace.portal.errors.ErrorHelper.exceptionHandler;
import static io.fairspace.portal.utils.HelmUtils.JUPYTER_CHART;
import static javax.servlet.http.HttpServletResponse.*;
import static spark.Spark.*;

@Slf4j
public class App {
    private static final JwtTokenValidator tokenValidator = JwtTokenValidator.create(CONFIG.auth.jwksUrl, CONFIG.auth.jwtAlgorithm);

    public static void main(String[] args) throws IOException {
        initSpark();
    }

    private static void initSpark() throws IOException {
        port(8080);

        if (CONFIG.auth.enabled) {
            before((request, response) -> {
                if (request.uri().equals("/api/v1/health")) {
                    return;
                }

                var token = getUserInfo(request, tokenValidator);

                if (token == null) {
                    halt(SC_UNAUTHORIZED);
                }
            });
        }

        // Setup workspaces app
        ReleaseManager releaseManager = TillerConnectionFactory.getReleaseManager();
        CachedReleaseList releaseList = new CachedReleaseList(releaseManager);

        // Setup chart repo
        ChartRepo repo = new ChartRepo(new URLChartLoader());
        repo.init(CONFIG.charts);

        // Define the available apps to install
        Map<String, AppReleaseRequestBuilder> appRequestBuilders = Map.of(JUPYTER_CHART, new JupyterReleaseRequestBuilder(CONFIG.defaultConfig.get(JUPYTER_CHART)));

        WorkspacesApp workspacesApp = new WorkspacesApp(
                new WorkspaceService(releaseManager, releaseList, repo, appRequestBuilders, CONFIG.domain, CONFIG.defaultConfig),
                (request) -> getUserInfo(request, tokenValidator)
        );

        SearchApp searchApp = new SearchApp(
                (request) -> getUserInfo(request, tokenValidator)
        );

        path("/api/v1", () -> {
            path("/workspaces", workspacesApp);
            get("/health", (request, response) -> "OK");
            post("/search/hyperspace/_search", searchApp);
        });

        notFound((req, res) -> errorBody(SC_NOT_FOUND, "Not found"));
        exception(JsonMappingException.class, exceptionHandler(SC_BAD_REQUEST, "Invalid request body"));
        exception(IllegalArgumentException.class, exceptionHandler(SC_BAD_REQUEST, null));
        exception(NotFoundException.class, exceptionHandler(SC_NOT_FOUND, "Not found"));
        exception(ForbiddenException.class, exceptionHandler(SC_FORBIDDEN, "Forbidden"));
        exception(Exception.class, exceptionHandler(SC_INTERNAL_SERVER_ERROR, "Internal server error"));
    }


}
