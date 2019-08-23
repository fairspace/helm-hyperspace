package io.fairspace.portal.model;

import hapi.release.StatusOuterClass;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Workspace {
    private String name;
    private String version;
    private StatusOuterClass.Status.Code status;
}
