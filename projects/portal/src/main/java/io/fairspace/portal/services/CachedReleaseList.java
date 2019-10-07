package io.fairspace.portal.services;

import com.google.common.cache.CacheBuilder;
import com.google.common.cache.CacheLoader;
import com.google.common.cache.LoadingCache;
import hapi.release.ReleaseOuterClass;
import hapi.services.tiller.Tiller;
import hapi.services.tiller.Tiller.ListReleasesRequest;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;
import org.microbean.helm.ReleaseManager;

import java.util.*;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;

import static hapi.release.StatusOuterClass.Status.Code;

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
    private final LoadingCache<String, Collection<ReleaseOuterClass.Release>> cache;

    public CachedReleaseList(@NonNull ReleaseManager releaseManager) {
        this.releaseManager = releaseManager;

        cache = CacheBuilder.newBuilder()
                .expireAfterWrite(EXPIRATION_INTERVAL_SEC, TimeUnit.SECONDS)
                .build(
                        new CacheLoader<>() {
                            public Collection<ReleaseOuterClass.Release> load(String key) {
                                return fetchReleases();
                            }
                        });
    }

    public Collection<ReleaseOuterClass.Release> get() {
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

    private Collection<ReleaseOuterClass.Release> fetchReleases() {
        var result = new HashMap<String, ReleaseOuterClass.Release>();
        var request = ListReleasesRequest.newBuilder()
                .addAllStatusCodes(RELEVANT_STATUSES)
                .setLimit(MAX_RELEASES_TO_RETURN)
                .setSortBy(Tiller.ListSort.SortBy.LAST_RELEASED)
                .setSortOrder(Tiller.ListSort.SortOrder.DESC)
                .build();

        var responseIterator = releaseManager.list(request);
        while (responseIterator.hasNext()) {
            var response = responseIterator.next();

            // Make sure to only add a release for which we do not have information yet
            // This procedure will filter out previous failures
            for(var release: response.getReleasesList()) {
                if(!result.containsKey(release.getName())) {
                    result.put(release.getName(), release);
                }
            }
        }

        return result.values();
    }
}
