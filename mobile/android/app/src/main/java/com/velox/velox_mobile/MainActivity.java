package com.velox.velox_mobile;

import android.os.Build;
import androidx.annotation.NonNull;
import io.flutter.embedding.android.FlutterActivity;
import io.flutter.embedding.engine.FlutterEngine;
import io.flutter.plugin.common.MethodChannel;

/**
 * Native Android entry point written in Java.
 * Exposes a MethodChannel ("com.velox/native") so the Flutter/Dart layer can
 * call into platform-specific Java code (device info, native map intent, etc.).
 */
public class MainActivity extends FlutterActivity {
    private static final String CHANNEL = "com.velox/native";

    @Override
    public void configureFlutterEngine(@NonNull FlutterEngine flutterEngine) {
        super.configureFlutterEngine(flutterEngine);

        new MethodChannel(flutterEngine.getDartExecutor().getBinaryMessenger(), CHANNEL)
                .setMethodCallHandler((call, result) -> {
                    switch (call.method) {
                        case "getDeviceModel":
                            result.success(Build.MANUFACTURER + " " + Build.MODEL);
                            break;
                        case "getPlatformVersion":
                            result.success("Android " + Build.VERSION.RELEASE);
                            break;
                        case "getSdkVersion":
                            result.success(Build.VERSION.SDK_INT);
                            break;
                        default:
                            result.notImplemented();
                            break;
                    }
                });
    }
}
