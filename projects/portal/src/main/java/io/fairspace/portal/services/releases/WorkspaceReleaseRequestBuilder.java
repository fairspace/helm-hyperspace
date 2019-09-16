package io.fairspace.portal.services.releases;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import hapi.chart.ConfigOuterClass;
import hapi.services.tiller.Tiller;
import io.fairspace.portal.model.Workspace;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

import static io.fairspace.portal.utils.HelmUtils.GIGABYTE_SUFFIX;
import static io.fairspace.portal.utils.JacksonUtils.merge;

public class WorkspaceReleaseRequestBuilder{
    private static final ObjectMapper objectMapper = new ObjectMapper(new YAMLFactory());

    private String domain;
    private Map<String, ?> defaultValues;

    public WorkspaceReleaseRequestBuilder(String domain, Map<String, ?> defaultValues) {
        this.domain = domain;
        this.defaultValues = defaultValues;
    }

    public Tiller.InstallReleaseRequest.Builder build(Workspace workspace) throws IOException {
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


        var values = merge(objectMapper.valueToTree(defaultValues), customValues);
        var yaml = objectMapper.writeValueAsString(values);

        return Tiller.InstallReleaseRequest.newBuilder()
                .setName(workspace.getId())
                .setNamespace(workspace.getId())
                .setValues(ConfigOuterClass.Config.newBuilder().setRaw(yaml).build());
    }
}
