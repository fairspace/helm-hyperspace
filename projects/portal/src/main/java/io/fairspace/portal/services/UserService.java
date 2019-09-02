package io.fairspace.portal.services;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.fairspace.oidc_auth.model.OAuthAuthenticationToken;
import io.fairspace.portal.model.Group;
import org.eclipse.jetty.client.HttpClient;
import org.eclipse.jetty.util.ssl.SslContextFactory;

import java.util.List;

import static io.fairspace.oidc_auth.filters.HeaderAuthenticationFilter.BEARER_PREFIX;
import static java.lang.String.format;
import static java.util.stream.Collectors.toList;
import static org.eclipse.jetty.http.HttpHeader.AUTHORIZATION;

public class UserService {
    private static final String USER_ROLE_SUFFIX = "-users";
    private static final TypeReference<List<Group>> GROUP_LIST_TYPE = new TypeReference<>() {};
    private final HttpClient httpClient = new HttpClient(new SslContextFactory(true));
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final String groupsUrlTemplate;

    public UserService(String groupsUrlTemplate) {
        this.groupsUrlTemplate = groupsUrlTemplate;
        try {
            httpClient.start();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public List<String> getAvailableWorkspaces(OAuthAuthenticationToken authToken) {
        try {
            var url = format(groupsUrlTemplate, authToken.getSubjectClaim());
            var request = httpClient.newRequest(url)
                    .header(AUTHORIZATION, BEARER_PREFIX + authToken.getAccessToken());
            var response = request.send();

            List<Group> groups = objectMapper.readValue(response.getContent(), GROUP_LIST_TYPE);

            return groups.stream()
                    .map(Group::getName)
                    .filter(name -> name.endsWith(USER_ROLE_SUFFIX))
                    .collect(toList());
        } catch (Exception e) {
            throw new RuntimeException("Error while retrieving user's groups", e);
        }
    }
}
