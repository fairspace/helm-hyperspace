package io.fairspace.portal.apps;

import io.fairspace.oidc_auth.model.OAuthAuthenticationToken;
import okhttp3.Call;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.RequestBody;
import okio.Buffer;
import okio.BufferedSink;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.MockitoJUnitRunner;
import spark.Request;
import spark.Response;

import java.util.List;
import java.util.Map;
import java.util.function.Function;

import static org.junit.Assert.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@RunWith(MockitoJUnitRunner.class)
public class SearchAppTest {
    @Mock
    private Function<Request, OAuthAuthenticationToken> tokenProvider;

    @Mock
    private Request request;

    @Mock
    private Response response;

    @Mock
    private OkHttpClient httpClient;

    @Mock
    private Call call;

    @Mock
    private okhttp3.Response esResponse;

    @Mock
    private okhttp3.ResponseBody esResponseBody;

    private OAuthAuthenticationToken token;
    private String contentType = "strange/type";
    private String content = "{\"a\": \"b\"}";

    private SearchApp app;

    @Before
    public void setUp() throws Exception {
        app = new SearchApp(tokenProvider, httpClient);

        token = new OAuthAuthenticationToken("test", Map.of(
                "authorities", List.of("organisation-admin", "user-workspace", "test-user", "user-other-ws-name")
        ));

        when(tokenProvider.apply(any())).thenReturn(token);

        when(request.bodyAsBytes()).thenReturn(content.getBytes());
        when(request.contentType()).thenReturn(contentType);

        when(httpClient.newCall(any())).thenReturn(call);
        when(call.execute()).thenReturn(esResponse);
        when(esResponse.body()).thenReturn(esResponseBody);
    }

    @Test
    public void testIncludedIndices() throws Exception {
        app.handle(request, response);

        ArgumentCaptor<okhttp3.Request> esRequest= ArgumentCaptor.forClass(okhttp3.Request.class);
        verify(httpClient).newCall(esRequest.capture());

        String esUrl = esRequest.getValue().url().toString();
        assertTrue(esUrl.contains("workspace"));
        assertTrue(esUrl.contains("other-ws-name"));
    }

    @Test
    public void testForwardingContent() throws Exception {
        app.handle(request, response);

        ArgumentCaptor<okhttp3.Request> esRequest= ArgumentCaptor.forClass(okhttp3.Request.class);
        verify(httpClient).newCall(esRequest.capture());

        // Verify forwarded content type
        assertEquals(MediaType.parse(contentType), esRequest.getValue().body().contentType());

        // Verify forwarded content
        Buffer buffer = new Buffer();
        esRequest.getValue().body().writeTo(buffer);
        String bodySentToES = buffer.readUtf8();
        assertEquals(content, bodySentToES);
    }

    @Test
    public void testReturnedContent() throws Exception {
        String responseBody = "{\"result\": \"test\"}";
        String responseContentType = "returned/type";

        when(esResponse.header("Content-type")).thenReturn(responseContentType);
        when(esResponseBody.string()).thenReturn(responseBody);

        app.handle(request, response);

        verify(response).header("Content-type", responseContentType);
        verify(response).body(responseBody);

    }

}
