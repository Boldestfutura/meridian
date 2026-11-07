# Runbook for an AI agent: Echo Show 5 mute button

Give this file to the agent that looks after the Echo. It turns the Echo Show 5's top button
(the old mic-mute, which on LineageOS sleeps/wakes the screen) into a media mute whose red light
always matches. Background and the why: [docs/ECHO_MUTE_BUTTON.md](../../docs/ECHO_MUTE_BUTTON.md).

## Before you start

Confirm with the owner, don't assume:

- [ ] The Echo is a **Show 5, 2nd generation** (`adb shell getprop ro.product.device` prints
      `cronos`) running **LineageOS** (`getprop ro.lineage.version`). Stop if it's on Fire OS.
- [ ] Its IP address, and that ADB over the network on port 5555 is on. The first connection shows
      an "Allow USB debugging?" prompt on the Echo's screen that the owner has to accept.
- [ ] **Settings > System > Developer options > Rooted debugging** is on.
- [ ] Whether Magisk is installed. If not, whether Home Assistant has the **Android Debug Bridge**
      integration set up for this Echo, and the entity id of its `media_player`.
- [ ] That a reboot is fine right now (it stops any music for about a minute).

You need this repo's `device/echo/` folder (`install-mute-button.sh`, `privmute.sh`,
`ha-automation.yaml`) on a machine with `adb` that can reach the Echo.

## Steps

1. Check first, change nothing:
   ```sh
   device/echo/install-mute-button.sh <ip> --check
   ```
2. Install:
   ```sh
   device/echo/install-mute-button.sh <ip>
   ```
   It stops with a clear message if `adb root` fails or this isn't the right hardware. Fix the
   cause; don't work around it.
3. **Without Magisk**: add `device/echo/ha-automation.yaml` to Home Assistant as a new automation,
   replacing `media_player.echo_show_adb` with the Echo's ADB entity. If there's already an Echo
   watchdog automation, add its `adb_command` step to that instead of making a second one.
4. Reboot once, after asking: `adb -s <ip>:5555 reboot`.
5. When it's back (allow about 2 minutes for the automation's delay), run `--check` again.
   Expect:
   - `key layout: /data/system/devices/keylayout/gpio-privacy-button.kl`
   - `running: yes`
   - `red light` and `media mute` agreeing (`0` with `Muted: false`, or `1` with `Muted: true`)
6. Ask the owner to press the button a few times, some quickly, while you log:
   ```sh
   adb -s <ip>:5555 shell 'while true; do echo "$(date +%T) light=$(cat /sys/devices/platform/gpio-privacy/state) $(dumpsys audio | grep -A1 "^- STREAM_MUSIC:" | grep -o "Muted: [a-z]*")"; sleep 1; done'
   ```
   Within 2-3 seconds of the last press, light `1` must pair with `Muted: true` and `0` with
   `Muted: false`. Also confirm the screen no longer sleeps when the button is pressed.
7. Tell the owner: only media is muted, so alarms should still ring (check theirs once while
   muted); volume up while muted unmutes the sound but leaves the light on (press the button
   twice to resync).

## Don't

- Don't remap the button to `VOLUME_MUTE`. That toggles per press and drifts out of step with
  the light. Mute must follow `/sys/devices/platform/gpio-privacy/state`.
- Don't use `pkill -f privmute` from `adb shell`: the pattern can match the shell running the
  command. Use the pid in `/data/local/tmp/privmute.pid`, or `--uninstall`.
- Don't edit `/system` or `/vendor`. The key layout goes in `/data/system/devices/keylayout/`.
- Don't reboot or play test sounds without asking; someone may be asleep next to it.

## Undo

```sh
device/echo/install-mute-button.sh <ip> --uninstall
```
Then delete the Home Assistant automation (or its step) and reboot. The button goes back to
sleep/wake.
