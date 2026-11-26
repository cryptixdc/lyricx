package top.izuna.lyricx;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

/** Visualizer-edition entry point: the app opens directly on the lyrics visualizer. */
public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(LyricHttpPlugin.class);
        registerPlugin(VisualizerBridgePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
