package io.fairspace.portal.services.releases;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import hapi.chart.ConfigOuterClass;
import hapi.services.tiller.Tiller;
import io.fairspace.portal.model.Workspace;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

import static io.fairspace.portal.utils.HelmUtils.GIGABYTE_SUFFIX;
import static io.fairspace.portal.utils.HelmUtils.createRandomString;
import static io.fairspace.portal.utils.JacksonUtils.merge;
import static java.util.Optional.ofNullable;

public class WorkspaceReleaseRequestBuilder{
    private static final ObjectMapper objectMapper = new ObjectMapper(new YAMLFactory());

    private String domain;
    private Map<String, ?> defaultValues;

    public WorkspaceReleaseRequestBuilder(String domain, Map<String, ?> defaultValues) {
        this.domain = domain;
        this.defaultValues = defaultValues;
    }

    public Tiller.InstallReleaseRequest.Builder buildInstall(Workspace workspace)  {
        var customValues = objectMapper.createObjectNode();
        customValues.with("hyperspace").put("domain", domain);
        customValues.with("hyperspace").with("keycloak").put("clientId", workspace.getId() + "-pluto");
        customValues.with("hyperspace").with("keycloak").put("clientSecret", UUID.randomUUID().toString());
        customValues.with("hyperspace").with("elasticsearch").put("indexName", workspace.getId());
        customValues.with("workspace").put("name", workspace.getName());
        customValues.with("workspace").put("description", workspace.getDescription());
        customValues.with("workspace").with("ingress").put("domain", workspace.getId() + "." + domain);
        customValues.with("saturn").with("persistence").with("files").put("size", workspace.getLogAndFilesVolumeSize() + GIGABYTE_SUFFIX);
        customValues.with("saturn").with("persistence").with("database").put("size", workspace.getDatabaseVolumeSize() + GIGABYTE_SUFFIX);
        customValues.with("rabbitmq").put("username", workspace.getId());
        customValues.with("rabbitmq").put("password", createRandomString(16));

        var values = merge(objectMapper.valueToTree(defaultValues), customValues);

        return Tiller.InstallReleaseRequest.newBuilder()
                .setName(workspace.getId())
                .setNamespace(workspace.getId())
                .setValues(ConfigOuterClass.Config.newBuilder().setRaw(toYaml(values)).build());
    }

    public Tiller.UpdateReleaseRequest.Builder buildUpdate(Workspace workspace, ConfigOuterClass.Config existingConfig) {
        var customValues = fromYaml(existingConfig.getRaw());

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
                .setValues(ConfigOuterClass.Config.newBuilder().setRaw(toYaml(customValues)).build());
    }

    private String toYaml(ObjectNode value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
    }

    private ObjectNode fromYaml(String yaml) {
        try {
            return (ObjectNode) objectMapper.readTree(yaml);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }
}
