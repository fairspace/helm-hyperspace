package io.fairspace.portal.services.releases;

import hapi.services.tiller.Tiller;
import io.fairspace.portal.model.Workspace;

import java.util.Map;

import static io.fairspace.portal.services.releases.ConfigHelper.toConfig;
import static io.fairspace.portal.utils.HelmUtils.GIGABYTE_SUFFIX;
import static io.fairspace.portal.utils.HelmUtils.createRandomString;
import static io.fairspace.portal.utils.JacksonUtils.*;
import static java.util.Optional.ofNullable;
import static java.util.UUID.randomUUID;

public class WorkspaceReleaseRequestBuilder{


    private String domain;
    private Map<String, ?> defaultValues;

    public WorkspaceReleaseRequestBuilder(String domain, Map<String, ?> defaultValues) {
        this.domain = domain;
        this.defaultValues = defaultValues;
    }

    public Tiller.InstallReleaseRequest.Builder buildInstall(Workspace workspace) {
        var customValues = createObjectNode();
        customValues.with("external").with("keycloak").put("clientId", workspace.getId() + "-pluto");
        customValues.with("external").with("keycloak").put("clientSecret", randomUUID().toString());
        customValues.with("external").with("elasticsearch").put("indexName", workspace.getId());
        customValues.with("workspace").put("name", workspace.getName());
        customValues.with("workspace").put("description", workspace.getDescription());
        customValues.with("workspace").with("ingress").put("domain", workspace.getId() + "." + domain);
        customValues.with("saturn").with("persistence").with("files").put("size", workspace.getLogAndFilesVolumeSize() + GIGABYTE_SUFFIX);
        customValues.with("saturn").with("persistence").with("database").put("size", workspace.getDatabaseVolumeSize() + GIGABYTE_SUFFIX);
        customValues.with("rabbitmq").put("username", workspace.getId());
        customValues.with("rabbitmq").put("password", createRandomString(16));

        var values = merge(valueToTree(defaultValues), customValues);

        return Tiller.InstallReleaseRequest.newBuilder()
                .setName(workspace.getId())
                .setNamespace(workspace.getId())
                .setValues(toConfig(values));
    }

    public Tiller.UpdateReleaseRequest.Builder buildUpdate(Workspace workspace) {
        var customValues = createObjectNode();

        ofNullable(workspace.getName()).ifPresent(value ->
                customValues.with("workspace").put("name", value));
        ofNullable(workspace.getDescription()).ifPresent(value ->
                customValues.with("workspace").put("description", value));
        ofNullable(workspace.getLogAndFilesVolumeSize()).ifPresent(value ->
                customValues.with("saturn").with("persistence").with("files").put("size", value + GIGABYTE_SUFFIX));
        ofNullable(workspace.getDatabaseVolumeSize()).ifPresent(value ->
                customValues.with("saturn").with("persistence").with("database").put("size", value + GIGABYTE_SUFFIX));

        return Tiller.UpdateReleaseRequest.newBuilder()
                .setName(workspace.getId())
                .setReuseValues(true)
                .setValues(toConfig(customValues));
    }

    public Tiller.UpdateReleaseRequest.Builder buildRestartPod(String workspaceId, String app) {
        var customValues = createObjectNode();
        customValues.with("podAnnotations").with(app).put("updateTag", randomUUID().toString());

        return Tiller.UpdateReleaseRequest.newBuilder()
                .setName(workspaceId)
                .setReuseValues(true)
                .setValues(toConfig(customValues));
    }

    public Tiller.UninstallReleaseRequest.Builder buildUninstall(Workspace workspace) {
        return Tiller.UninstallReleaseRequest.newBuilder()
                .setName(workspace.getId())
                .setPurge(true);
    }

}
