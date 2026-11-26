package top.izuna.lyricx;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(LyricHttpPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
