package io.fairspace.portal.services;

import hapi.release.ReleaseOuterClass;
import hapi.services.tiller.Tiller;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.microbean.helm.ReleaseManager;
import org.mockito.Mock;
import org.mockito.junit.MockitoJUnitRunner;

import java.util.List;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@RunWith(MockitoJUnitRunner.class)
public class CachedReleaseListTest {
    private CachedReleaseList releaseList;

    @Mock
    private ReleaseManager releaseManager;

    @Before
    public void setUp() {
        releaseList = new CachedReleaseList(releaseManager);

        Tiller.ListReleasesResponse listReleasesResponse = Tiller.ListReleasesResponse.newBuilder()
                .addReleases(ReleaseOuterClass.Release.newBuilder().setName("workspace").build())
                .addReleases(ReleaseOuterClass.Release.newBuilder().setName("jupyter").build())
                .addReleases(ReleaseOuterClass.Release.newBuilder().setName("other").build())
                .build();

        when(releaseManager.list(any())).thenReturn(List.of(listReleasesResponse).iterator());
    }

    @Test
    public void cachingWorks() {
        releaseList.get();
        releaseList.get();

        verify(releaseManager, times(1)).list(any());
    }
}
