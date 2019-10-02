package io.fairspace.portal.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Workspace {
    private String id;
    private String name;
    private String description;
    private String version;
    private String url;
    private String status;
    private String errorMessage;
    private Boolean ready;
    private Integer logAndFilesVolumeSize;
    private Integer databaseVolumeSize;
    private List<WorkspaceApp> apps;
}
