package com.openpaw.strainsense;

import android.os.Bundle;
import android.view.View;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onStart() {
        super.onStart();
        // Disable the WebView overscroll glow/stretch so the fixed glass
        // background can't drift and no edge is revealed at the ends.
        if (this.bridge != null && this.bridge.getWebView() != null) {
            this.bridge.getWebView().setOverScrollMode(View.OVER_SCROLL_NEVER);
        }
    }
}
