package io.fairspace.portal.services;

import hapi.chart.ChartOuterClass;
import hapi.release.ReleaseOuterClass;
import hapi.services.tiller.Tiller;
import io.fairspace.portal.errors.NotFoundException;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.microbean.helm.ReleaseManager;
import org.mockito.Mock;
import org.mockito.junit.MockitoJUnitRunner;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Future;

import static org.junit.Assert.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@RunWith(MockitoJUnitRunner.class)
public class ReleaseServiceTest {
    @Mock
    private ReleaseManager releaseManager;
    @Mock
    private CachedReleaseList releaseList;

    @Mock
    private Future<Tiller.InstallReleaseResponse> installFuture;

    @Mock
    private Future<Tiller.UpdateReleaseResponse> updateFuture;

    @Mock
    private Future<Tiller.UninstallReleaseResponse> uninstallFuture;

    private ReleaseService releaseService;

    @Before
    public void setUp() throws IOException {
        releaseService = new ReleaseService(releaseManager, releaseList, Runnable::run);

        when(releaseManager.install(any(), any())).thenReturn(installFuture);
        when(releaseManager.update(any(), any())).thenReturn(updateFuture);
        when(releaseManager.uninstall(any())).thenReturn(uninstallFuture);
    }

    @Test
    public void cacheIsInvalidatedAfterInstallation() throws IOException {
        releaseService.installRelease(
                Tiller.InstallReleaseRequest.newBuilder()
                    .setName("installation"),
                ChartOuterClass.Chart.newBuilder()
        );

        // The cache is supposed to be invalidated immediately after installation starts,
        // and again when the installation finishes
        verify(releaseList, times(2)).invalidateCache();
    }

    @Test
    public void cacheIsInvalidatedAfterUpgrade() throws IOException {
        releaseService.updateRelease(
                Tiller.UpdateReleaseRequest.newBuilder()
                        .setName("upgrade"),
                ChartOuterClass.Chart.newBuilder()
        );

        // The cache is supposed to be invalidated immediately after upgrade starts,
        // and again when the upgrade finishes
        verify(releaseList, times(2)).invalidateCache();
    }

    @Test
    public void cacheIsInvalidatedAfterUninstall() throws IOException {
        releaseService.uninstallRelease(
                Tiller.UninstallReleaseRequest.newBuilder()
                        .setName("uninstall")
        );

        // The cache is supposed to be invalidated immediately after uninstall starts,
        // and again when the uninstall finishes
        verify(releaseList, times(2)).invalidateCache();
    }

    @Test
    public void callsToReleaseManagerHappenOnTheWorkerExecutor() throws NotFoundException, IOException {
        var asyncTasks = new ArrayList<Runnable>();
        releaseService = new ReleaseService(releaseManager, releaseList, asyncTasks::add);

        releaseService.installRelease(
                Tiller.InstallReleaseRequest.newBuilder()
                        .setName("installation"),
                ChartOuterClass.Chart.newBuilder()
        );

        releaseService.installRelease(
                Tiller.InstallReleaseRequest.newBuilder()
                        .setName("installation"),
                ChartOuterClass.Chart.newBuilder()
        );

        assertEquals(2, asyncTasks.size());
        verifyZeroInteractions(releaseManager);

        asyncTasks.forEach(Runnable::run);
        verify(releaseManager, times(2)).install(any(), any());
    }

    @Test
    public void getRelease() {
        when(releaseList.get()).thenReturn(List.of(
                ReleaseOuterClass.Release.newBuilder().setName("jupyter").build(),
                ReleaseOuterClass.Release.newBuilder().setName("workspace").build()
        ));
        assertTrue(releaseService.getRelease("jupyter").isPresent());
        assertFalse(releaseService.getRelease("something-else").isPresent());
    }

}
