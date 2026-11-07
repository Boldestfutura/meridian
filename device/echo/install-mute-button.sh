#!/usr/bin/env bash
# Turn an Echo Show 5 (2nd gen, "cronos") running LineageOS into a speaker whose top button
# (the old mic-mute) mutes media, with the red light always matching the mute state.
#
# Run from a computer with adb, on the same network as the Echo:
#   ./install-mute-button.sh <echo-ip>            install (or reinstall) and start it
#   ./install-mute-button.sh <echo-ip> --check    report what's installed and running
#   ./install-mute-button.sh <echo-ip> --uninstall
#
# Needs: ADB over the network on port 5555, and Settings > System > Developer options >
# "Rooted debugging" on (so `adb root` works). Nothing is flashed; everything lives in /data.
# The button change takes effect after one reboot. See docs/ECHO_MUTE_BUTTON.md.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
IP="${1:?usage: $0 <echo-ip> [--check|--uninstall]}"
MODE="${2:-install}"
DEV="$IP:5555"
KL=/data/system/devices/keylayout/gpio-privacy-button.kl
SCRIPT=/data/local/tmp/privmute.sh
PIDF=/data/local/tmp/privmute.pid
SVC=/data/adb/service.d/privmute.sh   # only used when Magisk is installed

a() { adb -s "$DEV" "$@"; }
sh_() { a shell "$@"; }
die() { echo "error: $*" >&2; exit 1; }

adb connect "$DEV" >/dev/null || die "can't reach $DEV (is ADB over network on?)"
a get-state >/dev/null 2>&1 || die "$DEV not authorised: accept the ADB prompt on the Echo, then rerun"

running() {
  sh_ 'p=$(cat '"$PIDF"' 2>/dev/null); [ -n "$p" ] && grep -q privmute /proc/$p/cmdline 2>/dev/null'
}

check() {
  echo "device:      $(sh_ getprop ro.product.device) / LineageOS $(sh_ getprop ro.lineage.version)"
  echo "key layout:  $(sh_ "dumpsys input | grep -A14 gpio-privacy-button | grep -m1 KeyLayoutFile | sed 's/.*: //'")"
  echo "script:      $(sh_ "[ -f $SCRIPT ] && echo installed || echo missing")"
  echo "running:     $(running && echo yes || echo no)"
  echo "boot start:  $(sh_ "[ -f $SVC ] && echo 'Magisk service.d' || echo 'none on device (use the Home Assistant automation, or rerun this after a reboot)'")"
  echo "red light:   $(sh_ cat /sys/devices/platform/gpio-privacy/state) (1 = on)"
  echo "media mute:  $(sh_ "dumpsys audio | grep -A1 '^- STREAM_MUSIC:' | grep -o 'Muted: [a-z]*'")"
}

[ "$MODE" = "--check" ] && { check; exit 0; }

# root adbd (adb root restarts adbd, so reconnect)
if [ "$(sh_ id -u | tr -d '\r')" != "0" ]; then
  a root >/dev/null 2>&1 || true
  sleep 4; adb connect "$DEV" >/dev/null
  [ "$(sh_ id -u | tr -d '\r')" = "0" ] || die "adb root failed: turn on Developer options > Rooted debugging"
fi

if [ "$MODE" = "--uninstall" ]; then
  sh_ "p=\$(cat $PIDF 2>/dev/null); [ -n \"\$p\" ] && grep -q privmute /proc/\$p/cmdline 2>/dev/null && kill \$p; \
       for g in \$(pidof getevent); do grep -q event0 /proc/\$g/cmdline 2>/dev/null && kill \$g; done; \
       rm -f $KL $SCRIPT $PIDF $SVC"
  echo "removed. Reboot the Echo to give the button back its sleep/wake behaviour."
  exit 0
fi

# sanity: this must be the cronos privacy hardware
sh_ '[ -r /sys/devices/platform/gpio-privacy/state ]' || die "no gpio-privacy device: is this an Echo Show 5 2nd gen?"
sh_ 'getevent -pl 2>/dev/null' | grep -q 'gpio-privacy-state' || die "no gpio-privacy-state input device"

a push "$HERE/privmute.sh" "$SCRIPT" >/dev/null
sh_ "chown shell:shell $SCRIPT; chmod 755 $SCRIPT; touch $PIDF; chown shell:shell $PIDF; chmod 644 $PIDF"

# the button sends KEY_POWER through Generic.kl; a layout of its own with no keys silences it
sh_ "mkdir -p /data/system/devices/keylayout && \
     printf '# top button (was KEY_POWER): no key; its red light drives media mute via $SCRIPT\n' > $KL && \
     chown -R system:system /data/system/devices && chmod 755 /data/system/devices /data/system/devices/keylayout && \
     chmod 644 $KL && restorecon -R /data/system/devices"

# start at boot when Magisk is there; otherwise something outside has to start it
if sh_ '[ -d /data/adb/magisk ] || command -v magisk >/dev/null 2>&1'; then
  sh_ "mkdir -p /data/adb/service.d && printf '#!/system/bin/sh\nsetsid sh $SCRIPT </dev/null >/dev/null 2>&1 &\n' > $SVC && chmod 755 $SVC"
  echo "boot start: Magisk service.d"
else
  echo "boot start: no Magisk. Add the Home Assistant automation in device/echo/ha-automation.yaml,"
  echo "            or rerun this script after each reboot."
fi

# start (or restart) it now, as the shell user like the HA automation does
sh_ "p=\$(cat $PIDF 2>/dev/null); [ -n \"\$p\" ] && grep -q privmute /proc/\$p/cmdline 2>/dev/null && kill \$p; true"
sh_ "su shell -c 'setsid sh $SCRIPT </dev/null >/dev/null 2>&1 &' 2>/dev/null || setsid sh $SCRIPT </dev/null >/dev/null 2>&1 &"
sleep 2
running || die "script didn't start; check: adb -s $DEV shell sh -x $SCRIPT"
echo
check
echo
echo "installed. Reboot the Echo once (adb -s $DEV reboot) so the button stops sending power."
