#!/system/bin/sh
# Bedroom Echo: media mute follows the top button's red light. The light is hardware
# (gpio-privacy state, SW_MUTE_DEVICE on event0), so mute is set to match it rather than
# toggled per press, and a missed press can't leave them out of step.
# Started (and kept running) by the HA automation "Master Bedroom Echo Watchdog".
echo $$ > /data/local/tmp/privmute.pid
sync_mute() {
  want=$(cat /sys/devices/platform/gpio-privacy/state)
  if dumpsys audio | grep -A1 '^- STREAM_MUSIC:' | grep -q 'Muted: true'; then have=1; else have=0; fi
  [ "$want" != "$have" ] && input keyevent 164
}
sync_mute
getevent /dev/input/event0 | while read -r type code value; do
  [ "$type" = "0005" ] && { sleep 0.3; sync_mute; }
done
