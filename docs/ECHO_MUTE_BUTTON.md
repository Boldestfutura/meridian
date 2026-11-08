# Echo Show 5: the top button as a mute button

On an Echo Show 5 (2nd gen, codename `cronos`) running LineageOS, the button on top that used
to be Alexa's microphone mute ends up as a power button: it sleeps and wakes the screen. This
turns it into a **media mute** whose red light always tells the truth: light on means muted.

What gets muted is Android's media stream: music, Sleep Sounds, Music Assistant / SendSpin
playback and Assist's spoken replies. Android's alarm stream is left alone, so timers and
alarms should still ring and a muted Echo shouldn't make you sleep through one (not yet tested
with a real ring while muted: whether it rings depends on which stream your alarm app uses). The microphone and wake word
keep working. The volume buttons are untouched.

Tested on the bedroom Echo: LineageOS 18.1 (Android 11), VACA as the voice satellite, Home
Assistant 2026.11.

## How the hardware works

The button is two input devices, and that's the whole trick:

| device | what it reports |
|---|---|
| `gpio-privacy-button` (`/dev/input/event1`) | `KEY_POWER` down/up for every press. Android maps it through `Generic.kl` to POWER |
| `gpio-privacy-state` (`/dev/input/event0`) | `SW_MUTE_DEVICE` 1/0 whenever the **red light** turns on/off |

The light is driven in hardware by the privacy circuit, not by Android, and its current state is
readable any time at `/sys/devices/platform/gpio-privacy/state`.

The first attempt remapped the key to `VOLUME_MUTE`, which toggles mute on each press. It
drifted: the button sometimes sends a glitch press (down and up in the same instant) that the
light ignores, so the toggle flipped and the light didn't. Logged:

```
[238.562217] EV_KEY KEY_POWER DOWN
[238.562269] EV_KEY KEY_POWER UP      <- 0.05 ms later, light doesn't change
```

So mute now follows **the light**, not the key:

1. `/data/system/devices/keylayout/gpio-privacy-button.kl` gives the button its own key layout
   with no keys in it, so presses no longer reach Android as POWER (applies after a reboot).
2. [`device/echo/privmute.sh`](../device/echo/privmute.sh) runs on the Echo, waits on
   `event0`, and whenever the light changes sets media mute to match it with one call to the
   audio service (`service call audio 9 ...`, `adjustStreamVolume` with ADJUST_MUTE or
   ADJUST_UNMUTE on Android 11). It sets, never toggles, so it can't drift, and it takes about
   50 ms. The first version sent `input keyevent 164`, which takes 1.7 s on the Echo, so quick
   presses ran behind the light. Only one copy may run: two cancelled each other out on every
   press, so the script stops any other copy when it starts.
3. Something starts the script at boot: Magisk's `service.d` if it's installed; otherwise a Home
   Assistant automation over ADB ([`device/echo/ha-automation.yaml`](../device/echo/ha-automation.yaml)),
   which also restarts it within 5 minutes if it ever dies. In this house that job is done by
   `automation.master_bedroom_echo_watchdog` (`ha_config/echo_watchdog.json`).

Nothing is flashed and `/system` isn't touched; it's all in `/data`.

## Install

From a computer with `adb`, on the same network:

```sh
device/echo/install-mute-button.sh <echo-ip>          # install and start
adb -s <echo-ip>:5555 reboot                          # once, so the button stops sending POWER
device/echo/install-mute-button.sh <echo-ip> --check  # after it's back up
```

It needs ADB over the network on port 5555 and **Developer options > Rooted debugging** on (it
uses `adb root` to write the key layout). Without Magisk, also add the Home Assistant automation
(needs the Android Debug Bridge integration set up for the Echo) or the script won't come back
after a reboot. `--check` reports the key layout in use, whether the script is running, how it
starts at boot, and the light and mute state, which should agree.

To undo: `install-mute-button.sh <echo-ip> --uninstall`, remove the automation, reboot.

## Things to know

- The light is the truth. If anything else changes mute (volume up, a dashboard volume button,
  an app), the script puts it back to match the light within 2 seconds. Volume buttons do nothing
  audible while the light is on.
- The hardware ignores presses for 1 second after the light changes, and presses held longer
  than 3 seconds (device tree `enable-gpio-toggle-duration` 1000 ms,
  `privacy-event-max-press-duration` 3000 ms). Press, wait a second, press again.
- Software can turn the light on (`echo 1 > /sys/devices/platform/gpio-privacy/enable`) but
  never off; only a press turns it off.
- Mute follows the light within a fraction of a second, even with quick presses.
- The audio-service call number (9) is for Android 11. Another Android version numbers the
  calls differently: after installing elsewhere, press a few times and run `--check`.
- The button no longer sleeps the screen. On these screens that's what you want; brightness and
  the night clock are handled elsewhere.
- `getevent` watches one device per call, and evdev drops a switch event with the same value as
  the last one, which matters if you test with `sendevent`.
