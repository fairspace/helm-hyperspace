package io.fairspace.portal.services;

import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.microbean.helm.chart.URLChartLoader;
import org.mockito.Mock;
import org.mockito.junit.MockitoJUnitRunner;

import java.io.IOException;
import java.net.URL;
import java.util.Map;

import static org.mockito.Mockito.verify;

@RunWith(MockitoJUnitRunner.class)
public class ChartRepoTest {
    @Mock
    URLChartLoader chartLoader;

    private ChartRepo repo;

    @Before
    public void setUp() throws Exception {
        repo = new ChartRepo(chartLoader);
    }

    @Test
    public void testInitialiation() throws IOException {
        var charts = Map.of(
            "a", new URL("http://chartA"),
            "b", new URL("http://chartB")
        );

        repo.init(charts);

        verify(chartLoader).load(new URL("http://chartA"));
        verify(chartLoader).load(new URL("http://chartB"));
    }
}
