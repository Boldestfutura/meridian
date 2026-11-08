#!/system/bin/sh
# Bedroom Echo: media mute follows the top button's red light. The light is hardware
# (gpio-privacy state, SW_MUTE_DEVICE on event0), so mute is set to match it rather than
# toggled per press, and a missed press can't leave them out of step.
# Started (and kept running) by the HA automation "Master Bedroom Echo Watchdog".
# one copy only: two would both toggle on every press and cancel each other out (seen 2026-11-08,
# when the boot watchdog and the installer each started one). Stop any other copy and its getevent.
for d in /proc/[0-9]*; do
  p=${d#/proc/}
  [ "$p" = "$$" ] && continue
  case "$(tr '\0' ' ' < "$d/cmdline" 2>/dev/null)" in
    *"sh "*privmute.sh*) kill $(pgrep -P "$p") "$p" 2>/dev/null ;;
  esac
done
echo $$ > /data/local/tmp/privmute.pid
muted() { dumpsys audio | grep -A1 '^- STREAM_MUSIC:' | grep -q 'Muted: true' && echo 1 || echo 0; }
# toggle only when they differ, then wait (up to ~3 s) for the audio service to show the change,
# so quick presses can't stack two toggles on one stale reading. The light is re-read each time.
sync_mute() {
  n=0
  while [ "$(cat /sys/devices/platform/gpio-privacy/state)" != "$(muted)" ] && [ $n -lt 3 ]; do
    input keyevent 164
    i=0; want=$(cat /sys/devices/platform/gpio-privacy/state)
    while [ "$(muted)" != "$want" ] && [ $i -lt 10 ]; do sleep 0.3; i=$((i+1)); done
    n=$((n+1))
  done
}
sync_mute
getevent /dev/input/event0 | while read -r type code value; do
  [ "$type" = "0005" ] && sync_mute
done
