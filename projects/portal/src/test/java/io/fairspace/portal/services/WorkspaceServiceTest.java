package io.fairspace.portal.services;

import com.google.common.util.concurrent.ListenableFuture;
import hapi.chart.ChartOuterClass;
import hapi.services.tiller.Tiller;
import io.fairspace.portal.model.Workspace;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.microbean.helm.ReleaseManager;
import org.mockito.Mock;
import org.mockito.junit.MockitoJUnitRunner;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Executor;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@RunWith(MockitoJUnitRunner.class)
public class WorkspaceServiceTest {
    @Mock
    private ReleaseManager releaseManager;
    @Mock
    private ChartOuterClass.Chart.Builder chart;
    @Mock
    private CachedReleaseList releaseList;

    private static final String domain = "example.com";

    @Mock
    private ListenableFuture<Tiller.InstallReleaseResponse> future;

    private WorkspaceService workspaceService;

    @Before
    public void setUp() throws IOException {
        var workspaceValues = Map.of("saturn", Map.of("persistence",  Map.of("key", "value")));
        workspaceService = new WorkspaceService(releaseManager, releaseList, chart, domain, workspaceValues);

        when(releaseManager.install(any(), eq(chart))).thenReturn(future);

        doAnswer(invocation -> {
            Runnable callback = invocation.getArgument(0);
            Executor executor = invocation.getArgument(1);
            executor.execute(callback);
            return null;
        }).when(future).addListener(any(), any());
    }

    @Test
    public void cacheIsInvalidatedAfterInstallation() throws IOException, InterruptedException {
        workspaceService.installWorkspace(Workspace.builder().id("test").build());
        Thread.sleep(100);

        // The cache is supposed to be invalidated immediately after installation starts,
        // and again when the installation finishes
        verify(releaseList, times(2)).invalidateCache();
    }

    @Test
    public void itSetsConfiguration() throws IOException {
        var ws = Workspace.builder()
                .id("test")
                .name("Test")
                .description("description")
                .logAndFilesVolumeSize(1)
                .databaseVolumeSize(2)
                .build();

        workspaceService.installWorkspace(ws);

        verify(releaseManager).install(argThat(request ->
                request.getName().equals(ws.getId())
                && request.getValues().getRaw().equals(
                        "---\n" +
                        "saturn:\n" +
                        "  persistence:\n" +
                        "    key: \"value\"\n" +
                        "    files:\n" +
                        "      size: \"1Gi\"\n" +
                        "    database:\n" +
                        "      size: \"2Gi\"\n" +
                        "hyperspace:\n" +
                        "  domain: \"example.com\"\n" +
                        "  elasticsearch:\n" +
                        "    indexName: \"test\"\n" +
                        "workspace:\n" +
                        "  name: \"Test\"\n" +
                        "  description: \"description\"\n" +
                        "  ingress:\n" +
                        "    domain: \"test.example.com\"\n")),
                eq(chart));
    }
}
