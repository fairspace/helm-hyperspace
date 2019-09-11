package io.fairspace.portal.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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
    private int logAndFilesVolumeSize;
    private int databaseVolumeSize;
}
