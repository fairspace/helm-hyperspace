package io.fairspace.portal.services.releases;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

import java.io.IOException;

import static io.fairspace.portal.utils.JacksonUtils.createObjectNode;

public abstract class BaseAppReleaseRequestBuilder implements AppReleaseRequestBuilder {

    /**
     * Generates a configuration object with the workspace id and ingress domain prefilled
     *
     * The workspace id is needed by the portal to determine the workspace that
     * the given app belongs to
     *
     * @param workspaceId
     * @param appDomain
     * @return
     */
    protected ObjectNode getAppValues(String workspaceId, String appDomain) {
        var appValues = createObjectNode();

        // Sets the workspace identifier for associating this app with the workspace
        // See WorkspaceService#WORKSPACE_APP_WORKSPACE_ID_YAML_PATH
        appValues.with("workspace").put("id", workspaceId);

        // Set the domain for this app
        appValues.with("ingress").put("domain", appDomain);

        return appValues;
    }

    /**
     * Generates the domain to run the app on
     *
     * @param workspaceDomain
     * @param domainPrefix
     * @return
     */
    protected String getAppDomain(String workspaceDomain, String domainPrefix) {
        return String.format("%s.%s", domainPrefix, workspaceDomain);
    }

    /**
     * Returns the workspace domain for the given workspace configuration
     * @return
     */
    protected String getWorkspaceDomain(JsonNode workspaceConfig) throws IOException {
        return workspaceConfig.with("workspace").with("ingress").get("domain").asText();
    }
}
