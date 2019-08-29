package io.fairspace.portal.model;

import hapi.release.StatusOuterClass;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Workspace {
    private String name;
    private String version;
    private String url;
    private StatusOuterClass.Status.Code status;
    private int logAndFilesVolumeSize;
    private int databaseVolumeSize;
}
