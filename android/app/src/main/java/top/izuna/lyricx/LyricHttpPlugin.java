package top.izuna.lyricx;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

/** Small native HTTP bridge: WebView fetch is blocked by CORS on the YouTube Music API. */
@CapacitorPlugin(name = "LyricHttp")
public class LyricHttpPlugin extends Plugin {

    @PluginMethod
    public void post(final PluginCall call) {
        final String url = call.getString("url");
        final String body = call.getString("body", "{}");
        if (url == null || url.isEmpty()) {
            call.reject("missing url");
            return;
        }

        bridge.executeOnBackgroundThread(() -> {
            HttpURLConnection connection = null;
            try {
                connection = (HttpURLConnection) new URL(url).openConnection();
                connection.setRequestMethod("POST");
                connection.setConnectTimeout(20000);
                connection.setReadTimeout(30000);
                connection.setDoOutput(true);
                connection.setRequestProperty("Content-Type", "application/json");
                connection.setRequestProperty("Accept", "application/json");
                connection.setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 Chrome/124.0 Mobile Safari/537.36");
                try (OutputStream out = connection.getOutputStream()) {
                    out.write(body.getBytes(StandardCharsets.UTF_8));
                }

                int status = connection.getResponseCode();
                InputStream stream = status >= 200 && status < 300 ? connection.getInputStream() : connection.getErrorStream();
                StringBuilder text = new StringBuilder();
                if (stream != null) {
                    try (BufferedReader reader = new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8))) {
                        String line;
                        while ((line = reader.readLine()) != null) text.append(line);
                    }
                }

                JSObject result = new JSObject();
                result.put("status", status);
                result.put("body", text.toString());
                call.resolve(result);
            } catch (Exception error) {
                call.reject("request failed: " + error.getMessage());
            } finally {
                if (connection != null) connection.disconnect();
            }
        });
    }
}
