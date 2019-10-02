package io.fairspace.portal.services;

import io.fabric8.kubernetes.api.model.*;
import io.fabric8.kubernetes.client.DefaultKubernetesClient;
import io.fabric8.kubernetes.client.Watch;
import io.fabric8.kubernetes.client.Watcher;
import io.fabric8.kubernetes.client.dsl.FilterWatchListDeletable;
import io.fabric8.kubernetes.client.dsl.MixedOperation;
import io.fabric8.kubernetes.client.dsl.PodResource;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mock;
import org.mockito.junit.MockitoJUnitRunner;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

import static org.junit.Assert.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@RunWith(MockitoJUnitRunner.class)
public class ClusterServiceTest {
    @Mock
    private DefaultKubernetesClient kubernetesClient;

    @Mock
    private MixedOperation<Pod, PodList, DoneablePod, PodResource<Pod, DoneablePod>> pods;

    @Mock
    private FilterWatchListDeletable<Pod, PodList, Boolean, Watch, Watcher<Pod>> podsWithField;

    @Mock
    private PodList podList;

    private List<Pod> listOfPods;
    private ClusterService clusterService;

    @Before
    public void setUp() throws Exception {
        listOfPods = new ArrayList();

        when(kubernetesClient.pods()).thenReturn(pods);
        when(pods.withField(any(), any())).thenReturn(podsWithField);
        when(podsWithField.list()).thenReturn(podList);
        when(podList.getItems()).thenReturn(listOfPods);

        clusterService = new ClusterService(kubernetesClient);
    }

    @Test
    public void testCaching() throws ExecutionException {
        clusterService.getNumUnschedulablePods();
        clusterService.getNumUnschedulablePods();

        verify(podsWithField, times(1)).list();
    }

    @Test
    public void testIncludeOnlyUnschedulablePendingPods() throws ExecutionException {
        listOfPods.addAll(List.of(
                new PodBuilder().withStatus(
                        new PodStatusBuilder().withConditions(
                                new PodConditionBuilder().withReason("Unschedulable").build()
                        ).build()
                ).build(),
                new PodBuilder().withStatus(
                        new PodStatusBuilder().withConditions(
                                new PodConditionBuilder().withReason("JustStarting").build()
                        ).build()
                ).build(),
                new PodBuilder().withStatus(
                        new PodStatusBuilder().withConditions(
                                new PodConditionBuilder().withReason("Unschedulable").build()
                        ).build()
                ).build()
        ));

        // Make sure only 2 of the pending pods are counted
        assertEquals(2, clusterService.getNumUnschedulablePods());

        // Ensure that kubernetes is asked for only pending pods, for performance reasons
        verify(pods).withField("status.phase", "Pending");
    }

}
