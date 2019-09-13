package io.fairspace.portal.services;

import hapi.chart.ChartOuterClass;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;
import org.microbean.helm.chart.URLChartLoader;

import java.io.IOException;
import java.net.URL;
import java.util.HashMap;
import java.util.Map;

@Slf4j
public class ChartRepo {
    private final Map<String, ChartOuterClass.Chart.Builder> repo = new HashMap<>();

    public ChartRepo(@NonNull Map<String, URL> charts) throws IOException{
        for(String key: charts.keySet()) {
            add(key, charts.get(key));
        }
    }

    public ChartOuterClass.Chart.Builder get(String key) {
        return repo.get(key);
    }

    public boolean contains(String key) {
        return repo.containsKey(key);
    }

    public void add(String key, URL url) throws IOException {
        repo.put(key, loadChart(url));
    }

    private static ChartOuterClass.Chart.Builder loadChart(URL chartUrl) throws IOException {
        try (var chartLoader = new URLChartLoader()) {
            log.info("Downloading chart from url {}", chartUrl);
            return chartLoader.load(chartUrl);
        } catch (Exception e) {
            log.error("Error downloading the workspace chart.", e);
            throw e;
        }
    }
}
