package io.fairspace.portal.services;

import com.google.common.util.concurrent.ListenableFuture;
import hapi.chart.ChartOuterClass;
import hapi.release.ReleaseOuterClass;
import hapi.services.tiller.Tiller;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.microbean.helm.ReleaseManager;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.MockitoJUnitRunner;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.Future;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import static com.google.common.util.concurrent.Futures.immediateFuture;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
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

    private ListenableFuture<Tiller.UpdateReleaseResponse> updateFuture = immediateFuture(null);

    @Mock
    private Future<Tiller.UninstallReleaseResponse> uninstallFuture;

    @Mock
    private ScheduledExecutorService executorService;

    private ReleaseService releaseService;

    @Before
    public void setUp() throws IOException {
        doAnswer(invocation -> {
            ((Runnable)invocation.getArgument(0)).run();
            return null;
        }).when(executorService).execute(any());

        doAnswer(invocation -> {
            ((Runnable)invocation.getArgument(0)).run();
            return null;
        }).when(executorService).schedule(any(Runnable.class), anyLong(), any());

        releaseService = new ReleaseService(releaseManager, releaseList, executorService);

        when(releaseManager.install(any(), any())).thenReturn(installFuture);
        when(releaseManager.update(any(), any())).thenReturn(updateFuture);
        when(releaseManager.uninstall(any())).thenReturn(uninstallFuture);
    }

    @Test
    public void cacheIsInvalidatedAfterInstallation() {
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
    public void cacheIsInvalidatedAfterUpgrade() {
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
    public void cacheIsInvalidatedAfterUninstall() {
        releaseService.uninstallRelease(
                Tiller.UninstallReleaseRequest.newBuilder()
                        .setName("uninstall")
        );

        // The cache is supposed to be invalidated immediately after uninstall starts,
        // and again when the uninstall finishes
        verify(releaseList, times(2)).invalidateCache();
    }

    @Test
    public void callsToReleaseManagerHappenOnTheWorkerExecutor() throws IOException {
        var worker = mock(ScheduledExecutorService.class);
        var arguments = ArgumentCaptor.forClass(Runnable.class);

        releaseService = new ReleaseService(releaseManager, releaseList, worker);

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

        verify(worker, times(2)).execute(arguments.capture());

        verifyZeroInteractions(releaseManager);

        arguments.getAllValues().forEach(Runnable::run);
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

    @Test
    public void itCallsPostUpdateAction() {
        var onPostUpdate = mock(Runnable.class);

        releaseService.updateRelease(
                Tiller.UpdateReleaseRequest.newBuilder()
                        .setName("upgrade"),
                ChartOuterClass.Chart.newBuilder(),
                onPostUpdate,
                10
        );

        verify(executorService).schedule(onPostUpdate, 10, TimeUnit.MILLISECONDS);

        verify(onPostUpdate).run();
    }
}
