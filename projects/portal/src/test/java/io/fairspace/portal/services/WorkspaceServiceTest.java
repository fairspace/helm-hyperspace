package io.fairspace.portal.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import hapi.chart.ChartOuterClass;
import hapi.chart.ConfigOuterClass;
import hapi.chart.MetadataOuterClass;
import hapi.release.InfoOuterClass;
import hapi.release.ReleaseOuterClass;
import hapi.release.StatusOuterClass;
import hapi.services.tiller.Tiller;
import io.fairspace.portal.errors.NotFoundException;
import io.fairspace.portal.model.Workspace;
import io.fairspace.portal.model.WorkspaceApp;
import io.fairspace.portal.services.releases.AppReleaseRequestBuilder;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.microbean.helm.ReleaseManager;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.MockitoJUnitRunner;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.Future;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@RunWith(MockitoJUnitRunner.class)
public class WorkspaceServiceTest {
    public static final String APP_TYPE = "appType";
    private static final String domain = "example.com";
    private static final ReleaseOuterClass.Release READY_WORKSPACE = ReleaseOuterClass.Release.newBuilder()
            .setInfo(InfoOuterClass.Info.newBuilder().setStatus(
                    StatusOuterClass.Status.newBuilder().setCode(StatusOuterClass.Status.Code.DEPLOYED).build()))
            .build();
    private static final ReleaseOuterClass.Release UNREADY_WORKSPACE = ReleaseOuterClass.Release.newBuilder()
            .setInfo(InfoOuterClass.Info.newBuilder().setStatus(
                    StatusOuterClass.Status.newBuilder().setCode(StatusOuterClass.Status.Code.PENDING_INSTALL).build()))
            .build();
    private static final ReleaseOuterClass.Release INSTALLED_APP_RELEASE = ReleaseOuterClass.Release.newBuilder()
            .setConfig(
                    ConfigOuterClass.Config.newBuilder().setRaw("{\"workspace\": {\"id\": \"workspaceId\"}}").build()
            )
            .setChart(ChartOuterClass.Chart.newBuilder().setMetadata(
                    MetadataOuterClass.Metadata.newBuilder().setName(APP_TYPE).build()
            ))
            .setInfo(InfoOuterClass.Info.newBuilder().setStatus(
                    StatusOuterClass.Status.newBuilder().setCode(StatusOuterClass.Status.Code.DEPLOYED).build()))
            .build();


    @Mock
    private ReleaseManager releaseManager;
    @Mock
    private CachedReleaseList releaseList;
    @Mock
    private ChartRepo chartRepo;

    @Mock
    private AppReleaseRequestBuilder appReleaseRequestBuilder;

    ChartOuterClass.Chart.Builder workspaceChart = ChartOuterClass.Chart.newBuilder();
    ChartOuterClass.Chart.Builder appChart = ChartOuterClass.Chart.newBuilder();

    @Mock
    private Future<Tiller.InstallReleaseResponse> installFuture;

    @Mock
    private Future<Tiller.UpdateReleaseResponse> updateFuture;

    @Mock
    private Future<Tiller.UninstallReleaseResponse> uninstallFuture;

    private Map<String, AppReleaseRequestBuilder> appRequestBuilders;

    private WorkspaceService workspaceService;

    private Map<String, Map<String, ?>> defaultValues  = Map.of("workspace", Map.of("saturn", Map.of("persistence",  Map.of("key", "value"))));

    @Before
    public void setUp() throws IOException {
        when(chartRepo.get("workspace")).thenReturn(workspaceChart);
        when(chartRepo.contains("workspace")).thenReturn(true);
        when(chartRepo.get(APP_TYPE)).thenReturn(appChart);
        when(chartRepo.contains(APP_TYPE)).thenReturn(true);

        appRequestBuilders = Map.of(APP_TYPE, appReleaseRequestBuilder);

        workspaceService = new WorkspaceService(releaseManager, releaseList, chartRepo, appRequestBuilders, domain, defaultValues, Runnable::run);

        when(releaseManager.install(any(), any())).thenReturn(installFuture);
        when(releaseManager.update(any(), any())).thenReturn(updateFuture);
        when(releaseManager.uninstall(any())).thenReturn(uninstallFuture);
    }

    @Test
    public void cacheIsInvalidatedAfterInstallation() throws IOException {
        workspaceService.installWorkspace(Workspace.builder().id("test").build());

        // The cache is supposed to be invalidated immediately after installation starts,
        // and again when the installation finishes
        verify(releaseList, times(2)).invalidateCache();
    }

    @Test
    public void itSetsConfigurationOnWorkspaceInstallation() throws IOException {
        var ws = Workspace.builder()
                .id("test")
                .name("Test")
                .description("description")
                .logAndFilesVolumeSize(1)
                .databaseVolumeSize(2)
                .build();

        workspaceService.installWorkspace(ws);

        verify(releaseManager).install(
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
    public void installApp() throws NotFoundException, IOException {
        when(releaseList.getRelease("workspaceId")).thenReturn(Optional.of(READY_WORKSPACE));
        var app = WorkspaceApp.builder()
                .id("app")
                .type(APP_TYPE)
                .build();

        var installReleaseRequest = Tiller.InstallReleaseRequest.newBuilder();
        when(appReleaseRequestBuilder.appInstall(READY_WORKSPACE, app)).thenReturn(installReleaseRequest);

        workspaceService.installApp("workspaceId", app);

        verify(releaseManager).install(installReleaseRequest, appChart);
        verify(releaseManager, times(0)).update(any(), any());
    }

    @Test(expected = IllegalStateException.class)
    public void installAppFailsUnreadyWorkspace() throws NotFoundException, IOException {
        when(releaseList.getRelease("workspaceId")).thenReturn(Optional.of(UNREADY_WORKSPACE));
        var app = WorkspaceApp.builder()
                .id("app")
                .type(APP_TYPE)
                .build();

        workspaceService.installApp("workspaceId", app);
    }

    @Test(expected = NotFoundException.class)
    public void installAppFailsForUnknownAppType() throws NotFoundException, IOException {
        var app = WorkspaceApp.builder()
                .id("app")
                .type("otherAppType")
                .build();

        workspaceService.installApp("workspaceId", app);
    }

    @Test(expected = NotFoundException.class)
    public void installAppFailsForUnknownWorkspace() throws NotFoundException, IOException {
        var release = ReleaseOuterClass.Release.newBuilder().build();
        when(releaseList.getRelease("workspaceId")).thenReturn(Optional.empty());
        var app = WorkspaceApp.builder()
                .id("app")
                .type(APP_TYPE)
                .build();

        workspaceService.installApp("workspaceId", app);
    }

    @Test
    public void installAppUpdatesWorkspace() throws NotFoundException, IOException {
        when(releaseList.getRelease("workspaceId")).thenReturn(Optional.of(READY_WORKSPACE));
        var app = WorkspaceApp.builder()
                .id("app")
                .type(APP_TYPE)
                .build();

        var installReleaseRequest = Tiller.InstallReleaseRequest.newBuilder();
        var updateReleaseRequest = Tiller.UpdateReleaseRequest.newBuilder();
        when(appReleaseRequestBuilder.appInstall(READY_WORKSPACE, app)).thenReturn(installReleaseRequest);
        when(appReleaseRequestBuilder.workspaceUpdateAfterAppInstall(READY_WORKSPACE, app)).thenReturn(Optional.of(updateReleaseRequest));

        workspaceService.installApp("workspaceId", app);

        verify(releaseManager).install(installReleaseRequest, appChart);
        verify(releaseManager).update(updateReleaseRequest, workspaceChart);
    }

    @Test
    public void installAppCanSkipUpdatingWorkspace() throws NotFoundException, IOException {
        when(releaseList.getRelease("workspaceId")).thenReturn(Optional.of(READY_WORKSPACE));
        var app = WorkspaceApp.builder()
                .id("app")
                .type(APP_TYPE)
                .build();

        var installReleaseRequest = Tiller.InstallReleaseRequest.newBuilder();
        when(appReleaseRequestBuilder.appInstall(READY_WORKSPACE, app)).thenReturn(installReleaseRequest);
        when(appReleaseRequestBuilder.workspaceUpdateAfterAppInstall(READY_WORKSPACE, app)).thenReturn(Optional.empty());

        workspaceService.installApp("workspaceId", app);

        verify(releaseManager).install(installReleaseRequest, appChart);
        verifyNoMoreInteractions(releaseManager);
    }

    @Test
    public void installAppInvalidatesCache() throws NotFoundException, IOException {
        when(releaseList.getRelease("workspaceId")).thenReturn(Optional.of(READY_WORKSPACE));
        var app = WorkspaceApp.builder()
                .id("app")
                .type(APP_TYPE)
                .build();

        var installReleaseRequest = Tiller.InstallReleaseRequest.newBuilder();
        when(appReleaseRequestBuilder.appInstall(READY_WORKSPACE, app)).thenReturn(installReleaseRequest);

        workspaceService.installApp("workspaceId", app);

        InOrder orderVerifier = Mockito.inOrder(releaseList);
        orderVerifier.verify(releaseList).invalidateCache();
        orderVerifier.verify(releaseList).get();
    }

    @Test(expected = IllegalStateException.class)
    public void installAppIfTypeIsAlreadyInstalled() throws NotFoundException, IOException {
        when(releaseList.get()).thenReturn(List.of(INSTALLED_APP_RELEASE));

        var app = WorkspaceApp.builder()
                .id("app")
                .type(APP_TYPE)
                .build();

        workspaceService.installApp("workspaceId", app);
    }

    @Test
    public void uninstallApp() throws NotFoundException, IOException {
        when(releaseList.getRelease("workspaceId")).thenReturn(Optional.of(READY_WORKSPACE));
        when(releaseList.getRelease("app")).thenReturn(Optional.of(getAppRelease(APP_TYPE)));

        var uninstallReleaseRequest = Tiller.UninstallReleaseRequest.newBuilder();
        when(appReleaseRequestBuilder.appUninstall(any())).thenReturn(uninstallReleaseRequest);

        workspaceService.uninstallApp("app");

        verify(releaseManager).uninstall(uninstallReleaseRequest.build());
        verify(releaseManager, times(0)).update(any(), any());
    }

    @Test(expected = NotFoundException.class)
    public void uninstallAppFailsForUnknownAppType() throws NotFoundException, IOException {
        when(releaseList.getRelease("workspaceId")).thenReturn(Optional.of(READY_WORKSPACE));
        when(releaseList.getRelease("app")).thenReturn(Optional.of(getAppRelease("unknownAppType")));

        workspaceService.uninstallApp("app");
    }

    @Test(expected = NotFoundException.class)
    public void uninstallAppFailsForUnknownWorkspace() throws NotFoundException, IOException {
        when(releaseList.getRelease("workspaceId")).thenReturn(Optional.empty());
        when(releaseList.getRelease("app")).thenReturn(Optional.of(getAppRelease(APP_TYPE)));

        workspaceService.uninstallApp("app");
    }

    @Test(expected = IllegalStateException.class)
    public void uninstallAppFailsForUnreadyWorkspace() throws NotFoundException, IOException {
        when(releaseList.getRelease("workspaceId")).thenReturn(Optional.of(UNREADY_WORKSPACE));
        when(releaseList.getRelease("app")).thenReturn(Optional.of(getAppRelease(APP_TYPE)));

        workspaceService.uninstallApp("app");
    }

    @Test
    public void uninstallAppUpdatesWorkspace() throws NotFoundException, IOException {

        when(releaseList.getRelease("workspaceId")).thenReturn(Optional.of(READY_WORKSPACE));
        when(releaseList.getRelease("app")).thenReturn(Optional.of(getAppRelease(APP_TYPE)));

        var uninstallReleaseRequest = Tiller.UninstallReleaseRequest.newBuilder();
        var updateReleaseRequest = Tiller.UpdateReleaseRequest.newBuilder();
        when(appReleaseRequestBuilder.appUninstall(any())).thenReturn(uninstallReleaseRequest);
        when(appReleaseRequestBuilder.workspaceUpdateAfterAppUninstall(eq(READY_WORKSPACE), any())).thenReturn(Optional.of(updateReleaseRequest));

        workspaceService.uninstallApp("app");

        verify(releaseManager).uninstall(uninstallReleaseRequest.build());
        verify(releaseManager).update(eq(updateReleaseRequest), any());
    }

    @Test
    public void callsToReleaseManagerHappenOnTheWorkerExecutor() throws NotFoundException, IOException {
        when(releaseList.getRelease("workspaceId")).thenReturn(Optional.of(READY_WORKSPACE));
        var app = WorkspaceApp.builder()
                .id("app")
                .type(APP_TYPE)
                .build();

        var installReleaseRequest = Tiller.InstallReleaseRequest.newBuilder();
        when(appReleaseRequestBuilder.appInstall(READY_WORKSPACE, app)).thenReturn(installReleaseRequest);
        var asyncTasks = new ArrayList<Runnable>();
        var workspaceService = new WorkspaceService(releaseManager, releaseList, chartRepo, appRequestBuilders, domain, defaultValues, asyncTasks::add);

        workspaceService.installApp("workspaceId", app);
        workspaceService.installApp("workspaceId", app);

        assertEquals(2, asyncTasks.size());
        verifyZeroInteractions(releaseManager);

        asyncTasks.forEach(Runnable::run);
        verify(releaseManager, times(2)).install(any(), any());
    }

    private ReleaseOuterClass.Release getAppRelease(String appType) {
        var config = ConfigOuterClass.Config.newBuilder().setRaw("{\"workspace\": {\"id\": \"workspaceId\"}}").build();
        MetadataOuterClass.Metadata chartMetadata = MetadataOuterClass.Metadata.newBuilder().setName(appType).build();
        ChartOuterClass.Chart chart = ChartOuterClass.Chart.newBuilder().setMetadata(chartMetadata).build();
        return ReleaseOuterClass.Release.newBuilder().setConfig(config).setChart(chart).build();
    }

}
