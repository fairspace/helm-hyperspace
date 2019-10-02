package io.fairspace.portal.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.common.cache.CacheBuilder;
import com.google.common.cache.CacheLoader;
import com.google.common.cache.LoadingCache;
import io.fabric8.kubernetes.api.model.Pod;
import io.fabric8.kubernetes.client.DefaultKubernetesClient;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;

@Slf4j
public class ClusterService {
    private static final long EXPIRATION_INTERVAL_SEC = 150;
    private static final String STATUS_FIELD_NAME = "status.phase";
    private static final String STATUS_PENDING = "Pending";
    private static final String REASON_UNSCHEDULABLE = "Unschedulable";

    private final DefaultKubernetesClient kubernetesClient;
    private final LoadingCache<String, List<Pod>> cache;

    public ClusterService(@NonNull DefaultKubernetesClient kubernetesClient) {
        this.kubernetesClient = kubernetesClient;

        cache = CacheBuilder.newBuilder()
                .expireAfterWrite(EXPIRATION_INTERVAL_SEC, TimeUnit.SECONDS)
                .build(
                        new CacheLoader<>() {
                            public List<Pod> load(String key) {
                                return fetchPodsWithStatus(key);
                            }
                        });

    }

    public long getNumUnschedulablePods() throws ExecutionException {
        List<Pod> podList = cache.get(STATUS_PENDING);

        return podList.stream()
                .filter(pod ->
                        pod.getStatus().getConditions()
                                .stream()
                                .anyMatch(podCondition -> REASON_UNSCHEDULABLE.equals(podCondition.getReason()))
                )
                .count();

    }

    private List<Pod> fetchPodsWithStatus(String status) {
        return kubernetesClient.pods().withField(STATUS_FIELD_NAME, status).list().getItems();
    }
}
