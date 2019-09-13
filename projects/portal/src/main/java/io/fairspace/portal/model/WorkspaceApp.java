package io.fairspace.portal.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkspaceApp {
    private String id;
    private String workspaceId;
    private String type;
    private String version;
    private String url;
    private String status;
}
