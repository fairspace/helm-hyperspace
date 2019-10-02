package io.fairspace.portal.services;

import hapi.chart.ChartOuterClass;
import hapi.chart.ConfigOuterClass;
import hapi.chart.MetadataOuterClass;
import hapi.release.InfoOuterClass;
import hapi.release.ReleaseOuterClass;
import hapi.release.StatusOuterClass;
import hapi.services.tiller.Tiller;
import io.fairspace.portal.errors.NotFoundException;
import io.fairspace.portal.model.WorkspaceApp;
import io.fairspace.portal.services.releases.AppReleaseRequestBuilder;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mock;
import org.mockito.junit.MockitoJUnitRunner;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@RunWith(MockitoJUnitRunner.class)
public class WorkspaceAppServiceTest {
    private static final String APP_TYPE = "appType";
    private static final String APP_TYPE_2 = "jupyter";
    private static final String domain = "example.com";
    private static final String WORKSPACE_ID = "workspaceId";

    private static final ReleaseOuterClass.Release READY_WORKSPACE = ReleaseOuterClass.Release.newBuilder()
            .setName(WORKSPACE_ID)
            .setInfo(InfoOuterClass.Info.newBuilder().setStatus(
                    StatusOuterClass.Status.newBuilder().setCode(StatusOuterClass.Status.Code.DEPLOYED).build()))
            .build();
    private static final ReleaseOuterClass.Release UNREADY_WORKSPACE = ReleaseOuterClass.Release.newBuilder()
            .setInfo(InfoOuterClass.Info.newBuilder().setStatus(
                    StatusOuterClass.Status.newBuilder().setCode(StatusOuterClass.Status.Code.PENDING_INSTALL).build()))
            .build();
    private static final ReleaseOuterClass.Release INSTALLED_APP_RELEASE = ReleaseOuterClass.Release.newBuilder()
            .setConfig(
                    ConfigOuterClass.Config.newBuilder().setRaw("{\"workspace\": {\"id\": \"" + WORKSPACE_ID + "\"}}").build()
            )
            .setChart(ChartOuterClass.Chart.newBuilder().setMetadata(
                    MetadataOuterClass.Metadata.newBuilder().setName(APP_TYPE).build()
            ))
            .setInfo(InfoOuterClass.Info.newBuilder().setStatus(
                    StatusOuterClass.Status.newBuilder().setCode(StatusOuterClass.Status.Code.DEPLOYED).build()))
            .build();

    @Mock
    private ReleaseService releaseService;
    @Mock
    private ChartRepo chartRepo;

    @Mock
    private AppReleaseRequestBuilder appReleaseRequestBuilder;

    ChartOuterClass.Chart.Builder workspaceChart = ChartOuterClass.Chart.newBuilder();
    ChartOuterClass.Chart.Builder appChart = ChartOuterClass.Chart.newBuilder();


    private Map<String, AppReleaseRequestBuilder> appRequestBuilders;

    private WorkspaceAppService workspaceAppService;

    @Before
    public void setUp() {
        when(chartRepo.get("workspace")).thenReturn(workspaceChart);
        when(chartRepo.contains("workspace")).thenReturn(true);
        when(chartRepo.get(APP_TYPE)).thenReturn(appChart);
        when(chartRepo.contains(APP_TYPE)).thenReturn(true);
        when(chartRepo.contains(APP_TYPE_2)).thenReturn(true);

        appRequestBuilders = Map.of(
                APP_TYPE, appReleaseRequestBuilder,
                APP_TYPE_2, appReleaseRequestBuilder
        );

        workspaceAppService = new WorkspaceAppService(releaseService, chartRepo, appRequestBuilders);
    }

    @Test
    public void installApp() throws NotFoundException, IOException {
        when(releaseService.getRelease(WORKSPACE_ID)).thenReturn(Optional.of(READY_WORKSPACE));
        var app = WorkspaceApp.builder()
                .id("app")
                .type(APP_TYPE)
                .build();

        var installReleaseRequest = Tiller.InstallReleaseRequest.newBuilder();
        when(appReleaseRequestBuilder.appInstall(READY_WORKSPACE, app)).thenReturn(installReleaseRequest);

        workspaceAppService.installApp(WORKSPACE_ID, app);

        verify(releaseService).installRelease(installReleaseRequest, appChart);
        verify(releaseService, times(0)).updateRelease(any(), any());
    }

    @Test(expected = IllegalStateException.class)
    public void installAppFailsUnreadyWorkspace() throws NotFoundException, IOException {
        when(releaseService.getRelease(WORKSPACE_ID)).thenReturn(Optional.of(UNREADY_WORKSPACE));
        var app = WorkspaceApp.builder()
                .id("app")
                .type(APP_TYPE)
                .build();

        workspaceAppService.installApp(WORKSPACE_ID, app);
    }

    @Test(expected = NotFoundException.class)
    public void installAppFailsForUnknownAppType() throws NotFoundException, IOException {
        var app = WorkspaceApp.builder()
                .id("app")
                .type("otherAppType")
                .build();

        workspaceAppService.installApp(WORKSPACE_ID, app);
    }

    @Test(expected = NotFoundException.class)
    public void installAppFailsForUnknownWorkspace() throws NotFoundException, IOException {
        var release = ReleaseOuterClass.Release.newBuilder().build();
        when(releaseService.getRelease(WORKSPACE_ID)).thenReturn(Optional.empty());
        var app = WorkspaceApp.builder()
                .id("app")
                .type(APP_TYPE)
                .build();

        workspaceAppService.installApp(WORKSPACE_ID, app);
    }

    @Test
    public void installAppUpdatesWorkspace() throws NotFoundException, IOException {
        when(releaseService.getRelease(WORKSPACE_ID)).thenReturn(Optional.of(READY_WORKSPACE));
        var app = WorkspaceApp.builder()
                .id("app")
                .type(APP_TYPE)
                .build();

        var installReleaseRequest = Tiller.InstallReleaseRequest.newBuilder();
        var updateReleaseRequest = Tiller.UpdateReleaseRequest.newBuilder();
        when(appReleaseRequestBuilder.appInstall(READY_WORKSPACE, app)).thenReturn(installReleaseRequest);
        when(appReleaseRequestBuilder.workspaceUpdateAfterAppInstall(READY_WORKSPACE, app)).thenReturn(Optional.of(updateReleaseRequest));

        workspaceAppService.installApp(WORKSPACE_ID, app);

        verify(releaseService).installRelease(installReleaseRequest, appChart);
        verify(releaseService).updateRelease(updateReleaseRequest, workspaceChart);
    }

    @Test
    public void installAppCanSkipUpdatingWorkspace() throws NotFoundException, IOException {
        when(releaseService.getRelease(WORKSPACE_ID)).thenReturn(Optional.of(READY_WORKSPACE));
        var app = WorkspaceApp.builder()
                .id("app")
                .type(APP_TYPE)
                .build();

        var installReleaseRequest = Tiller.InstallReleaseRequest.newBuilder();
        when(appReleaseRequestBuilder.appInstall(READY_WORKSPACE, app)).thenReturn(installReleaseRequest);
        when(appReleaseRequestBuilder.workspaceUpdateAfterAppInstall(READY_WORKSPACE, app)).thenReturn(Optional.empty());

        workspaceAppService.installApp(WORKSPACE_ID, app);

        verify(releaseService).installRelease(installReleaseRequest, appChart);
        verify(releaseService, times(0)).updateRelease(any(), any());
    }

    @Test(expected = IllegalStateException.class)
    public void installAppIfTypeIsAlreadyInstalled() throws NotFoundException, IOException {
        when(releaseService.getReleases()).thenReturn(List.of(INSTALLED_APP_RELEASE));

        var app = WorkspaceApp.builder()
                .id("app")
                .type(APP_TYPE)
                .build();

        workspaceAppService.installApp(WORKSPACE_ID, app);
    }

    @Test
    public void uninstallApp() throws NotFoundException, IOException {
        when(releaseService.getRelease(WORKSPACE_ID)).thenReturn(Optional.of(READY_WORKSPACE));
        when(releaseService.getRelease("app")).thenReturn(Optional.of(getAppRelease("app", APP_TYPE)));

        var uninstallReleaseRequest = Tiller.UninstallReleaseRequest.newBuilder();
        when(appReleaseRequestBuilder.appUninstall(any())).thenReturn(uninstallReleaseRequest);

        workspaceAppService.uninstallApp("app");

        verify(releaseService).uninstallRelease(uninstallReleaseRequest);
        verify(releaseService, times(0)).updateRelease(any(), any());
    }

    @Test(expected = NotFoundException.class)
    public void uninstallAppFailsForUnknownAppType() throws NotFoundException, IOException {
        when(releaseService.getRelease(WORKSPACE_ID)).thenReturn(Optional.of(READY_WORKSPACE));
        when(releaseService.getRelease("app")).thenReturn(Optional.of(getAppRelease("app", "unknownAppType")));

        workspaceAppService.uninstallApp("app");
    }

    @Test(expected = NotFoundException.class)
    public void uninstallAppFailsForUnknownWorkspace() throws NotFoundException, IOException {
        when(releaseService.getRelease(WORKSPACE_ID)).thenReturn(Optional.empty());
        when(releaseService.getRelease("app")).thenReturn(Optional.of(getAppRelease("app", APP_TYPE)));

        workspaceAppService.uninstallApp("app");
    }

    @Test(expected = IllegalStateException.class)
    public void uninstallAppFailsForUnreadyWorkspace() throws NotFoundException, IOException {
        when(releaseService.getRelease(WORKSPACE_ID)).thenReturn(Optional.of(UNREADY_WORKSPACE));
        when(releaseService.getRelease("app")).thenReturn(Optional.of(getAppRelease("app", APP_TYPE)));

        workspaceAppService.uninstallApp("app");
    }

    @Test
    public void uninstallAppUpdatesWorkspace() throws NotFoundException, IOException {

        when(releaseService.getRelease(WORKSPACE_ID)).thenReturn(Optional.of(READY_WORKSPACE));
        when(releaseService.getRelease("app")).thenReturn(Optional.of(getAppRelease("app", APP_TYPE)));

        var uninstallReleaseRequest = Tiller.UninstallReleaseRequest.newBuilder();
        var updateReleaseRequest = Tiller.UpdateReleaseRequest.newBuilder();
        when(appReleaseRequestBuilder.appUninstall(any())).thenReturn(uninstallReleaseRequest);
        when(appReleaseRequestBuilder.workspaceUpdateAfterAppUninstall(eq(READY_WORKSPACE), any())).thenReturn(Optional.of(updateReleaseRequest));

        workspaceAppService.uninstallApp("app");

        verify(releaseService).uninstallRelease(uninstallReleaseRequest);
        verify(releaseService).updateRelease(eq(updateReleaseRequest), any());
    }

    private ReleaseOuterClass.Release getAppRelease(String releaseName, String appType) {
        var config = ConfigOuterClass.Config.newBuilder().setRaw("{\"workspace\": {\"id\": \"" + WORKSPACE_ID + "\"}}").build();
        MetadataOuterClass.Metadata chartMetadata = MetadataOuterClass.Metadata.newBuilder().setName(appType).build();
        ChartOuterClass.Chart chart = ChartOuterClass.Chart.newBuilder().setMetadata(chartMetadata).build();
        return ReleaseOuterClass.Release.newBuilder()
                .setName(releaseName)
                .setConfig(config)
                .setChart(chart)
                .build();
    }

}
