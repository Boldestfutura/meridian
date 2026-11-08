# Echo Show 5 (2nd gen) as the Master Bedroom screen

Status (2026-11-08): live. Rooted, LineageOS 18.1, at 192.168.1.133 (ADB on :5555).
It shows **Bedroom Show** (`/ha-show-bedroom/show`, `showbedroom.py`) and is the bedroom's
voice satellite and speaker.

## How it runs

- **View Assist Companion (VACA)**, `com.msp1974.vacompanion`, is the Android home app. It is
  the voice satellite (wake word "Alexa", HA Cloud pipeline) and shows the dashboard in its
  WebView. Its entities are `*.bedroom_echo_va_*` (screen brightness, light sensor, alarm).
  The HA companion app is disabled.
- **A card change reaches the Echo only after a VERSION bump and a VACA restart:**
  ```sh
  adb -s 192.168.1.133:5555 shell 'am force-stop com.msp1974.vacompanion; monkey -p com.msp1974.vacompanion -c android.intent.category.LAUNCHER 1'
  ```
  It takes about 30 s to load. Desktop-browser tests don't catch a stale copy: look at the
  device (`adb exec-out screencap -p`) or its WebView over CDP
  (`adb forward tcp:9339 localabstract:webview_devtools_remote_<pid>`).
- **Watchdog:** `ha_config/echo_watchdog.json` uses HA's ADB entity
  (`media_player.echo_show_adb`) to put VACA back in front after a reboot or if it drops out,
  and starts the mute-button script (`docs/ECHO_MUTE_BUTTON.md`).
- **Brightness:** `ha_config/bedroom_brightness.json`. Auto brightness while the room is lit; a
  fixed low level and the red night clock while `binary_sensor.bedroom_dark` is on.
- **Speaker:** SendSpin Player connects it to Music Assistant as `media_player.bedroom_echo`.

## Before it arrives

- Buy the **2021 Echo Show 5, model C76N8S (codename cronos)**. The method does not
  work on the Echo Show 8 2nd gen. A8H3N2 is a different 2021 Show with a different
  guide.
- **Never put it on Wi-Fi under Fire OS.** An OTA can patch the exploit.

## Root and flash (from luna, over USB; no case opening)

Source: the XDA thread "[UNLOCK][ROOT][TWRP][UNBRICK] Amazon Echo Show 5 2nd Gen - 2021
(cronos)" by Rortiz2, and github.com/R0rt1z2/amonet (branch `mt8163-cronos`). Re-read
both on the day; XDA blocks scripted fetches, so open it in a normal browser.

1. Get **amonet-cronos v2.0.1 or newer**. Older versions can leave the bootloader
   locked, and the failure is `the command you input is restricted on locked hw`.
2. Show on mains power. Hold **all three buttons** until it shows `=> FASTBOOT mode`.
   Plug USB into luna and run the fastbrick step from the thread. **Don't interrupt
   it.** It reboots into TWRP by itself.
3. In TWRP, **back up stock Fire OS first**. From v2.0.0 you can go back to Fire OS by
   flashing a stock `update.bin` in TWRP. Flash only through fastboot or TWRP, never
   `dd`: part of the exploit lives in the first block of boot and recovery.
4. Flash **LineageOS 18.1 for cronos, the 2026-09-04 build (v0.4)**. Per the techo5
   notes, earlier builds lose audio after a few days.
5. First boot: Wi-Fi, Developer options, USB debugging. Then:
   `adb shell locksettings set-disabled true` and
   `adb shell settings put system screen_off_timeout 1800000` (it has been seen
   reverting, so check it again later).

## Not chosen

techo5 (github.com/HuskerMinion/techo5) replaces Android with Alpine Linux and turns
the Show into a Home Assistant voice satellite with its own clock UI. It doesn't
document a browser dashboard, which is the point of this build, so it's parked here as
an alternative only.
