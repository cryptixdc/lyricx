package top.izuna.lyricx;

import android.content.ComponentName;
import android.content.Context;
import android.media.MediaMetadata;
import android.media.session.MediaController;
import android.media.session.MediaSessionManager;
import android.media.session.PlaybackState;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;

import com.getcapacitor.JSObject;

import java.util.List;

/** Reads Spotify's media session while it plays in the background. */
public class VisualizerNotificationListener extends NotificationListenerService {
    @Override
    public void onListenerConnected() {
        publish();
    }

    @Override
    public void onNotificationPosted(StatusBarNotification notification) {
        publish();
    }

    @Override
    public void onNotificationRemoved(StatusBarNotification notification) {
        publish();
    }

    private void publish() {
        MediaSessionManager manager = (MediaSessionManager) getSystemService(Context.MEDIA_SESSION_SERVICE);
        if (manager == null) return;

        MediaController spotify = null;
        List<MediaController> controllers = manager.getActiveSessions(
                new ComponentName(this, VisualizerNotificationListener.class));
        for (MediaController controller : controllers) {
            String packageName = controller.getPackageName();
            if (packageName != null && packageName.toLowerCase().contains("spotify")) {
                spotify = controller;
                break;
            }
        }

        JSObject track = new JSObject();
        if (spotify == null) {
            track.put("title", "");
            track.put("artist", "");
            track.put("album", "");
            track.put("durationMs", 0);
            track.put("progressMs", 0);
            track.put("playing", false);
        } else {
            MediaMetadata metadata = spotify.getMetadata();
            PlaybackState state = spotify.getPlaybackState();
            track.put("title", textOf(metadata, MediaMetadata.METADATA_KEY_TITLE));
            track.put("artist", textOf(metadata, MediaMetadata.METADATA_KEY_ARTIST));
            track.put("album", textOf(metadata, MediaMetadata.METADATA_KEY_ALBUM));
            track.put("durationMs", metadata == null ? 0 : metadata.getLong(MediaMetadata.METADATA_KEY_DURATION));
            track.put("progressMs", state == null ? 0 : state.getPosition());
            track.put("playing", state != null && state.getState() == PlaybackState.STATE_PLAYING);
        }
        VisualizerBridgePlugin.publishTrack(track);
    }

    private static String textOf(MediaMetadata metadata, String key) {
        if (metadata == null) return "";
        String value = metadata.getString(key);
        return value == null ? "" : value;
    }
}
