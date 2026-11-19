package com.resonantlabs.strainsense;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.play.agesignals.AgeSignalsException;
import com.google.android.play.agesignals.AgeSignalsManagerFactory;
import com.google.android.play.agesignals.AgeSignalsRequest;

/**
 * Hands the raw Play Age Signals range to JS (src/ageSignal.js), which owns
 * what the app does with it. Kept deliberately thin: no classification here.
 * Play's terms limit the signal to age-appropriate experiences, so nothing is
 * logged or sent anywhere.
 */
@CapacitorPlugin(name = "StrainSenseAgeSignals")
public class AgeSignalsPlugin extends Plugin {

    @PluginMethod
    public void check(PluginCall call) {
        AgeSignalsManagerFactory.create(getContext())
            .checkAgeSignals(AgeSignalsRequest.builder().build())
            .addOnSuccessListener(result -> {
                JSObject out = new JSObject();
                out.put("ageLower", result.ageLower());
                out.put("ageUpper", result.ageUpper());
                call.resolve(out);
            })
            .addOnFailureListener(e -> {
                String code = e instanceof AgeSignalsException
                    ? String.valueOf(((AgeSignalsException) e).getErrorCode())
                    : "UNKNOWN";
                call.reject("Age signal unavailable", code, e);
            });
    }
}
