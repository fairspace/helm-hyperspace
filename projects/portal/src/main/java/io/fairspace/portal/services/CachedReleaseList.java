package io.fairspace.portal.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import com.google.common.cache.CacheBuilder;
import com.google.common.cache.CacheLoader;
import com.google.common.cache.LoadingCache;
import com.google.common.util.concurrent.ListenableFuture;
import hapi.chart.ChartOuterClass;
import hapi.chart.ConfigOuterClass;
import hapi.release.ReleaseOuterClass;
import hapi.services.tiller.Tiller.InstallReleaseRequest;
import hapi.services.tiller.Tiller.ListReleasesRequest;
import io.fairspace.portal.model.Workspace;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;
import org.microbean.helm.ReleaseManager;
import org.microbean.helm.chart.URLChartLoader;

import javax.validation.constraints.NotNull;
import java.io.IOException;
import java.net.URL;
import java.util.*;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Executor;
import java.util.concurrent.TimeUnit;

import static hapi.release.StatusOuterClass.Status.Code;
import static io.fairspace.portal.Config.WORKSPACE_CHART;
import static io.fairspace.portal.ConfigLoader.CONFIG;
import static io.fairspace.portal.utils.JacksonUtils.merge;
import static java.lang.Integer.parseInt;
import static java.lang.System.currentTimeMillis;
import static java.lang.Thread.currentThread;
import static java.util.Optional.ofNullable;
import static java.util.concurrent.Executors.newSingleThreadExecutor;

@Slf4j
public class CachedReleaseList {
    private static final long EXPIRATION_INTERVAL_SEC = 300;
    private static final long MAX_RELEASES_TO_RETURN = 100L;
    private static final EnumSet<Code> RELEVANT_STATUSES = EnumSet.of(
            Code.UNKNOWN,
            Code.DEPLOYED,
            Code.FAILED,
            Code.DELETING,
            Code.PENDING_INSTALL,
            Code.PENDING_UPGRADE,
            Code.PENDING_ROLLBACK);
    private static final String RELEASES_KEY = "RELEASES";

    private final ReleaseManager releaseManager;
    private final LoadingCache<String, List<ReleaseOuterClass.Release>> cache;

    public CachedReleaseList(@NonNull ReleaseManager releaseManager) {
        this.releaseManager = releaseManager;

        cache = CacheBuilder.newBuilder()
                .expireAfterWrite(EXPIRATION_INTERVAL_SEC, TimeUnit.SECONDS)
                .build(
                        new CacheLoader<>() {
                            public List<ReleaseOuterClass.Release> load(String key) {
                                return fetchReleases();
                            }
                        });
    }

    public List<ReleaseOuterClass.Release> get() {
        try {
            return cache.get(RELEASES_KEY);
        } catch (ExecutionException e) {
            log.error("Error while loading release list", e);
            return Collections.emptyList();
        }
    }

    public void invalidateCache() {
        cache.invalidateAll();
    }

    private List<ReleaseOuterClass.Release> fetchReleases() {
        var result = new ArrayList<ReleaseOuterClass.Release>();
        var request = ListReleasesRequest.newBuilder()
                .addAllStatusCodes(RELEVANT_STATUSES)
                .setLimit(MAX_RELEASES_TO_RETURN)
                .build();

        var responseIterator = releaseManager.list(request);
        while (responseIterator.hasNext()) {
            var response = responseIterator.next();
            result.addAll(response.getReleasesList());
        }

        return result;
    }
}
