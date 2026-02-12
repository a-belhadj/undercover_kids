export const ALARM_DURATION = 1500;

/** Play an alarm sound using Web Audio API (no file needed) */
export function playAlarm(duration = 1500): { stop: () => void } {
  try {
    const ctx = new AudioContext();
    const gain = ctx.createGain();
    gain.gain.value = 0.35;
    gain.connect(ctx.destination);

    const osc1 = ctx.createOscillator();
    osc1.type = 'square';
    osc1.frequency.value = 800;
    osc1.connect(gain);
    osc1.start();

    const osc2 = ctx.createOscillator();
    osc2.type = 'square';
    osc2.frequency.value = 600;
    osc2.connect(gain);
    osc2.start();

    // Alternate between two tones for siren effect
    const interval = setInterval(() => {
      const t = ctx.currentTime;
      osc1.frequency.setValueAtTime(osc1.frequency.value === 800 ? 600 : 800, t);
      osc2.frequency.setValueAtTime(osc2.frequency.value === 600 ? 800 : 600, t);
    }, 200);

    const stop = () => {
      clearInterval(interval);
      osc1.stop();
      osc2.stop();
      ctx.close();
    };

    setTimeout(stop, duration);
    return { stop };
  } catch {
    return { stop: () => {} };
  }
}

/** Trigger vibration pattern */
export function triggerVibration() {
  try {
    // Pattern: vibrate 200ms, pause 100ms, repeated
    navigator.vibrate([200, 100, 200, 100, 200, 100, 200, 100, 200]);
  } catch {
    // Vibration API not available
  }
}

/** Flash the phone's torch LED (Android Chrome only, fails silently elsewhere) */
export async function flashTorch(duration = 1500): Promise<() => void> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
    });
    const track = stream.getVideoTracks()[0];
    // Check torch support
    const capabilities = track.getCapabilities?.();
    if (!capabilities || !(capabilities as Record<string, unknown>)['torch']) {
      track.stop();
      return () => {};
    }

    // Blink pattern: 200ms on, 150ms off
    let stopped = false;
    const blink = async () => {
      while (!stopped) {
        await track.applyConstraints({ advanced: [{ torch: true } as MediaTrackConstraintSet] });
        await new Promise((r) => setTimeout(r, 200));
        if (stopped) break;
        await track.applyConstraints({ advanced: [{ torch: false } as MediaTrackConstraintSet] });
        await new Promise((r) => setTimeout(r, 150));
      }
    };
    blink();

    const stop = () => {
      stopped = true;
      track.stop();
    };

    setTimeout(stop, duration);
    return stop;
  } catch {
    // Permission denied or API not available — silent fail
    return () => {};
  }
}
