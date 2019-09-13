package io.fairspace.portal.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
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

import static org.junit.Assert.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@RunWith(MockitoJUnitRunner.class)
public class WorkspaceServiceTest {
    @Mock
    private ReleaseManager releaseManager;
    @Mock
    private CachedReleaseList releaseList;
    @Mock
    private ChartRepo chartRepo;

    ChartOuterClass.Chart.Builder chart;

    private static final String domain = "example.com";

    @Mock
    private ListenableFuture<Tiller.InstallReleaseResponse> future;

    private WorkspaceService workspaceService;

    @Before
    public void setUp() throws IOException {
        var workspaceValues = Map.of("saturn", Map.of("persistence",  Map.of("key", "value")));
        Map<String, Map<String, ?>> defaultValues = Map.of("workspace", workspaceValues);

        chart = ChartOuterClass.Chart.newBuilder();
        when(chartRepo.get(any())).thenReturn(chart);
        when(chartRepo.contains(any())).thenReturn(true);

        workspaceService = new WorkspaceService(releaseManager, releaseList, chartRepo, domain, defaultValues);

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
                } catch (IOException e) {
                    System.err.println("Error parsing release configuration");
                    return false;
                }

                return true;
            }),
            eq(chart)
        );
    }
}
