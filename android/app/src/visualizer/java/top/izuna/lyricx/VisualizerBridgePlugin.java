package top.izuna.lyricx;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.provider.Settings;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.lang.ref.WeakReference;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/** Native bridge for the Spotify-driven visualizer edition: now-playing state and online lyrics. */
@CapacitorPlugin(name = "VisualizerBridge")
public class VisualizerBridgePlugin extends Plugin {
    private static final String PREFS = "lyricx_visualizer";
    private static final String LAST_TRACK = "last_track";
    private static WeakReference<VisualizerBridgePlugin> instance = new WeakReference<>(null);

    /** Called by the notification listener whenever Spotify's media session changes. */
    static void publishTrack(JSObject track) {
        SharedPreferences prefs = null;
        VisualizerBridgePlugin plugin = instance.get();
        if (plugin != null) {
            prefs = plugin.getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
            plugin.notifyListeners("nowPlaying", track, true);
        }
        if (prefs != null) prefs.edit().putString(LAST_TRACK, track.toString()).apply();
    }

    @Override
    public void load() {
        super.load();
        instance = new WeakReference<>(this);
    }

    @PluginMethod
    public void getNowPlaying(PluginCall call) {
        JSObject empty = new JSObject();
        Context context = getContext();
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String raw = prefs.getString(LAST_TRACK, empty.toString());
        try {
            call.resolve(new JSObject(raw));
        } catch (Exception error) {
            call.resolve(empty);
        }
    }

    @PluginMethod
    public void isListening(PluginCall call) {
        ComponentName component = new ComponentName(getContext(), VisualizerNotificationListener.class);
        String enabled = Settings.Secure.getString(getContext().getContentResolver(), "enabled_notification_listeners");
        call.resolve(new JSObject().put("value", enabled != null && enabled.contains(component.flattenToString())));
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        Intent intent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
        call.resolve();
    }

    /** LRCLIB lookup on every track change — this edition has no offline lyrics cache. */
    @PluginMethod
    public void fetchLyrics(final PluginCall call) {
        final String artist = call.getString("artist", "");
        final String title = call.getString("title", "");
        final String album = call.getString("album", "");
        if (artist.isEmpty() || title.isEmpty()) {
            call.reject("missing artist or title");
            return;
        }

        new Thread(() -> {
            HttpURLConnection connection = null;
            try {
                StringBuilder query = new StringBuilder("https://lrclib.net/api/get?");
                query.append("artist_name=").append(URLEncoder.encode(artist, "UTF-8"));
                query.append("&track_name=").append(URLEncoder.encode(title, "UTF-8"));
                if (!album.isEmpty()) query.append("&album_name=").append(URLEncoder.encode(album, "UTF-8"));

                connection = (HttpURLConnection) new URL(query.toString()).openConnection();
                connection.setRequestMethod("GET");
                connection.setConnectTimeout(15000);
                connection.setReadTimeout(15000);
                connection.setRequestProperty("Accept", "application/json");
                connection.setRequestProperty("User-Agent", "LYRICX-Visualizer/1.0.0");
                int status = connection.getResponseCode();
                InputStream stream = status >= 200 && status < 300 ? connection.getInputStream() : connection.getErrorStream();
                StringBuilder text = new StringBuilder();
                if (stream != null) {
                    try (BufferedReader reader = new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8))) {
                        String line;
                        while ((line = reader.readLine()) != null) text.append(line);
                    }
                }
                if (status < 200 || status >= 300) {
                    call.reject("lyrics service returned " + status);
                    return;
                }

                JSONObject body = new JSONObject(text.toString());
                JSObject result = new JSObject();
                result.put("syncedLyrics", body.optString("syncedLyrics", ""));
                result.put("plainLyrics", body.optString("plainLyrics", ""));
                result.put("title", body.optString("trackName", title));
                result.put("artist", body.optString("artistName", artist));
                call.resolve(result);
            } catch (Exception error) {
                call.reject("lyrics lookup failed: " + error.getMessage());
            } finally {
                if (connection != null) connection.disconnect();
            }
        }).start();
    }
}
