package io.fairspace.portal.apps;

import io.fairspace.oidc_auth.model.OAuthAuthenticationToken;
import io.fairspace.portal.errors.ForbiddenException;
import lombok.extern.slf4j.Slf4j;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.RequestBody;
import spark.Request;
import spark.Response;
import spark.Route;

import java.io.IOException;
import java.util.List;
import java.util.function.Function;

import static io.fairspace.portal.ConfigLoader.CONFIG;
import static java.lang.String.format;
import static java.lang.String.join;
import static java.util.stream.Collectors.toList;

@Slf4j
public class SearchApp implements Route {
    private static final String USER_ROLE_PREFIX = "user-";

    private final Function<Request, OAuthAuthenticationToken> tokenProvider;
    private final OkHttpClient httpClient;

    public SearchApp(Function<Request, OAuthAuthenticationToken> tokenProvider) {
        this(tokenProvider, new OkHttpClient());
    }

    public SearchApp(Function<Request, OAuthAuthenticationToken> tokenProvider, OkHttpClient httpClient) {
        this.tokenProvider = tokenProvider;
        this.httpClient = httpClient;
    }

    @Override
    public Object handle(Request request, Response response) throws Exception {
        var token = tokenProvider.apply(request);
        var indices = getAvailableWorkspaces(token);

        if (indices.isEmpty()) {
            log.debug("Search ES without access to any workspace");
            throw new ForbiddenException("Current user does not have access to any workspace");
        }

        if (request.contentType() == null) {
            throw new IllegalArgumentException("No content-type specified for search query");
        }

        String elasticSearchUrl = format(CONFIG.elasticSearchUrlTemplate, join(",", indices));
        log.trace("Search ES with indices: {} on upstream url {}", indices.toString(), elasticSearchUrl);

        // Proxy ES response, as ES itself is not accessible from
        // outside the cluster
        RequestBody requestBody = RequestBody.create(
                MediaType.parse(request.contentType()),
                request.bodyAsBytes()
        );

        okhttp3.Request esRequest = new okhttp3.Request.Builder()
                .url(elasticSearchUrl)
                .post(requestBody)
                .build();

        try (okhttp3.Response esResponse = httpClient.newCall(esRequest).execute()) {
            response.status(esResponse.code());
            response.header("Content-type", esResponse.header("Content-type"));
            return esResponse.body().string();
        } catch (IOException e) {
            log.error("Exception while forwarding request to Elasticsearch", e);
            throw e;
        }
    }

    private static List<String> getAvailableWorkspaces(OAuthAuthenticationToken authToken) {
        return authToken.getAuthorities()
                .stream()
                .filter(role -> role.startsWith(USER_ROLE_PREFIX))
                .map(role -> role.substring(USER_ROLE_PREFIX.length()))
                .collect(toList());
    }
}
