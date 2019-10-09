package io.fairspace.portal.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import hapi.chart.ChartOuterClass;
import hapi.release.InfoOuterClass;
import hapi.release.ReleaseOuterClass;
import hapi.release.StatusOuterClass;
import hapi.services.tiller.Tiller;
import io.fairspace.portal.errors.ConflictException;
import io.fairspace.portal.errors.NotFoundException;
import io.fairspace.portal.model.Workspace;
import io.fairspace.portal.model.WorkspaceApp;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.MockitoJUnitRunner;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.Assert.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@RunWith(MockitoJUnitRunner.class)
public class WorkspaceServiceTest {
    private static final String APP_TYPE = "appType";
    private static final String APP_TYPE_2 = "jupyter";
    private static final String domain = "example.com";
    private static final String WORKSPACE_ID = "workspaceId";

    private static final ReleaseOuterClass.Release READY_WORKSPACE = ReleaseOuterClass.Release.newBuilder()
            .setName(WORKSPACE_ID)
            .setInfo(InfoOuterClass.Info.newBuilder().setStatus(
                    StatusOuterClass.Status.newBuilder().setCode(StatusOuterClass.Status.Code.DEPLOYED).build()))
            .build();

    @Mock
    private ReleaseService releaseService;
    @Mock
    private WorkspaceAppService workspaceAppService;

    ChartOuterClass.Chart.Builder workspaceChart = ChartOuterClass.Chart.newBuilder();

    private WorkspaceService workspaceService;

    private Map<String, Map<String, ?>> defaultValues  = Map.of("workspace", Map.of("saturn", Map.of("persistence",  Map.of("key", "value"))));

    @Before
    public void setUp() {
        workspaceService = new WorkspaceService(releaseService, workspaceAppService, workspaceChart, domain, defaultValues);
    }

    @Test
    public void itSetsConfigurationOnWorkspaceInstallation() {
        var ws = Workspace.builder()
                .id("test")
                .name("Test")
                .description("description")
                .logAndFilesVolumeSize(1)
                .databaseVolumeSize(2)
                .build();

        workspaceService.installWorkspace(ws);

        verify(releaseService).installRelease(
            argThat(request -> {
                if(!request.getName().equals(ws.getId())) {
                    return false;
                }

                try {
                    JsonNode releaseConfig = new ObjectMapper(new YAMLFactory()).readTree(request.getValues().getRaw());

                    // Check whether the defaultConfig is added
                    assertEquals("value", releaseConfig.with("saturn").with("persistence").get("key").asText());

                    // Check whether the parameters are correctly specified
                    assertEquals("1Gi", releaseConfig.with("saturn").with("persistence").with("files").get("size").asText());
                    assertEquals("2Gi", releaseConfig.with("saturn").with("persistence").with("database").get("size").asText());

                    // Check whether the domain is correctly set
                    assertEquals("test.example.com", releaseConfig.with("workspace").with("ingress").get("domain").asText());

                    // Check whether rabbitmq parameters are given
                    assertEquals(ws.getId(), releaseConfig.with("rabbitmq").get("username").asText());
                    assertNotNull(releaseConfig.with("rabbitmq").get("password"));

                } catch (IOException e) {
                    System.err.println("Error parsing release configuration");
                    return false;
                }

                return true;
            }),
            eq(workspaceChart)
        );
    }

    @Test
    public void installWorkspaceThatAlreadyExists() {
        when(releaseService.getRelease(WORKSPACE_ID)).thenReturn(Optional.of(READY_WORKSPACE));

        try {
            workspaceService.installWorkspace(Workspace.builder()
                    .id(WORKSPACE_ID)
                    .name("Test")
                    .description("description")
                    .logAndFilesVolumeSize(1)
                    .databaseVolumeSize(2)
                    .build());
        } catch(ConflictException e) {
            // Expected
        }

        verify(releaseService).invalidateCache();
        verify(releaseService).getRelease(WORKSPACE_ID);
        verifyNoMoreInteractions(releaseService);
    }

    @Test
    public void uninstallWorkspaceRemovesApps() throws NotFoundException, IOException {
        when(releaseService.getRelease(WORKSPACE_ID)).thenReturn(Optional.of(READY_WORKSPACE));
        when(workspaceAppService.listInstalledApps(WORKSPACE_ID)).thenReturn(List.of(
                WorkspaceApp.builder()
                    .id("app1")
                    .type(APP_TYPE)
                    .build(),
                WorkspaceApp.builder()
                        .id("app2")
                        .type(APP_TYPE_2)
                        .build()
        ));
        workspaceService.uninstallWorkspace(WORKSPACE_ID);

        // Expect 2 uninstallations of the apps
        verify(workspaceAppService).uninstallApp("app1");
        verify(workspaceAppService).uninstallApp("app2");

        verify(releaseService).uninstallRelease(any());
    }

    @Test
    public void uninstallNonExistingWorkspace() throws IOException, NotFoundException {
        when(releaseService.getRelease(WORKSPACE_ID)).thenReturn(Optional.empty());

        try {
            workspaceService.uninstallWorkspace(WORKSPACE_ID);
            fail();
        } catch(NotFoundException e) {
            // OK
        }

        verify(releaseService).invalidateCache();
        verify(releaseService).getRelease(WORKSPACE_ID);
        verifyNoMoreInteractions(releaseService);
    }

    @Test
    public void updateWithoutResizingVolumesDoesNotTriggerPodRestart() throws NotFoundException {
        when(releaseService.getRelease(WORKSPACE_ID)).thenReturn(Optional.of(READY_WORKSPACE));

        var ws = Workspace.builder()
                .id(WORKSPACE_ID)
                .build();

        workspaceService.updateWorkspace(ws);
        verify(releaseService, times(1)).updateRelease(any(), any());
    }

    @Test
    public void resizingVolumesTriggersPodRestart() throws NotFoundException {
        when(releaseService.getRelease(WORKSPACE_ID)).thenReturn(Optional.of(READY_WORKSPACE));

        var ws = Workspace.builder()
                .id(WORKSPACE_ID)
                .databaseVolumeSize(123)
                .logAndFilesVolumeSize(123)
                .build();

        workspaceService.updateWorkspace(ws);

        verify(releaseService, times(1)).updateRelease(any(), any(), any(), anyLong());
    }
}
