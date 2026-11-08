#!/system/bin/sh
# Bedroom Echo: media mute follows the top button's red light. The light is hardware
# (gpio-privacy state, SW_MUTE_DEVICE on event0), so mute is set to match it on every change
# rather than toggled per press, and a missed press can't leave them out of step.
# Started (and kept running) by the HA automation "Master Bedroom Echo Watchdog".
# one copy only: two would both toggle on every press and cancel each other out (seen 2026-11-08,
# when the boot watchdog and the installer each started one). Stop any other copy and its getevent.
echo $$ > /data/local/tmp/privmute.pid
for p in $(pgrep -f privmute.sh); do
  [ "$p" = "$$" ] || kill $(pgrep -P "$p") "$p" 2>/dev/null
done
# Set media mute to match the light, straight through the audio service:
# IAudioService.adjustStreamVolume (transaction 9 on Android 11 / LineageOS 18.1),
# STREAM_MUSIC (3), ADJUST_MUTE (-100) or ADJUST_UNMUTE (100), no volume panel (flags 0).
# It sets rather than toggles, so it can't drift, and takes ~50 ms where `input keyevent`
# took ~1.7 s and made quick presses lag behind the light. Another Android version numbers
# the calls differently: check `--check` agrees after a few presses before trusting it.
sync_mute() {
  if [ "$(cat /sys/devices/platform/gpio-privacy/state)" = 1 ]; then d=-100; else d=100; fi
  service call audio 9 i32 3 i32 $d i32 0 s16 com.android.shell >/dev/null 2>&1
}
sync_mute
getevent /dev/input/event0 | while read -r type code value; do
  [ "$type" = "0005" ] && sync_mute
done
