# Echo Show 5 (2nd gen) as the Master Bedroom screen

Status (2026-10-28): dashboard built and live at `/ha-bedroom/clock`; device not bought yet.

## The dashboard (done)

`bedroom.py`, deployed with `./deploy.py bedroom`. Four panel views: Clock, Lights,
Music, Air. A rail down the right edge switches between them, after the Stockpot
enclosure's demo screen (thestockpot.net, "Echo Show Enclosure"). Master Bedroom
entities only. Music plays on the Echo itself through Music Assistant
(`media_player.bedroom_echo`, via SendSpin Player), using the same playlist sensor as the
tablet.

Checked in headless Helium at 960x480 (light and dark) and 640x320. Rail taps navigate.
Heights follow `--header-height`, so the page should still fill the screen if a kiosk
hides HA's toolbar. That hasn't been seen on the device yet.

## Before it arrives

- Buy the **2021 Echo Show 5, model C76N8S (codename cronos)**. The method does not
  work on the Echo Show 8 2nd gen. A8H3N2 is a different 2021 Show with a different
  guide.
- **Never put it on Wi-Fi under Fire OS.** An OTA can patch the exploit.

## Root and flash (from luna, over USB; no case opening)

Source: the XDA thread "[UNLOCK][ROOT][TWRP][UNBRICK] Amazon Echo Show 5 2nd Gen - 2021
(cronos)" by Rortiz2, and github.com/R0rt1z2/amonet (branch `mt8163-cronos`). Re-read
both on the day; XDA blocks scripted fetches, so open it in Helium.

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

## Make it the bedroom screen

- Install a kiosk browser (Fully Kiosk Browser is the usual choice) and point it at
  `http://192.168.1.117:8123/ha-bedroom/clock`.
- Log in with a dedicated non-admin HA user for the device.
- Still to decide:
  - Whether to hide HA's toolbar with the kiosk-mode HACS plugin.
  - Night dimming: Fully's brightness schedule, or a motion/time automation.
  - Whether it returns to Clock after a minute idle (Fully can do this).
- Check its real CSS viewport once it's running. If Android reports a density
  above 1x, the page sees less than 960x480. 640x320 has been checked and still fits.

## Not chosen

techo5 (github.com/HuskerMinion/techo5) replaces Android with Alpine Linux and turns
the Show into a Home Assistant voice satellite with its own clock UI. It doesn't
document a browser dashboard, which is the point of this build, so it's parked here as
an alternative only.
