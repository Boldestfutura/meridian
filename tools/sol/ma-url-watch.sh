#!/bin/sh
# Music Assistant URL watchdog. Runs as root from a TrueNAS cron job every 5 minutes.
#
# MA announces its "Internal URL" (settings.json core/webserver/values/base_url) over mDNS,
# and Home Assistant's MA integration rewrites its own stored URL from that announcement.
# The HA VM can't reach Sol's LAN IP (macvtap), only the tailnet one, so when the setting
# falls back to http://192.168.1.243:30278/ (it has after restarts/updates) HA drops every
# MA player. This puts it back. MA rewrites settings.json while running, so the edit is
# made with MA stopped. At most one fix per 30 minutes, so a fix that doesn't hold can't
# loop restarts.
WANT="http://100.84.24.51:30278/"
CONF=/mnt/SSDs/Applications/music-assistant/data/settings.json
LOG=/mnt/SSDs/appconfig/ma-url-watch.log
STAMP=/mnt/SSDs/appconfig/.ma-url-watch.last

log() { echo "$(date '+%F %T') $*" >> "$LOG"; tail -n 200 "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"; }

[ -f "$CONF" ] || exit 0
have=$(sed -n 's/.*"base_url": *"\([^"]*\)".*/\1/p' "$CONF" | head -n 1)
[ "$have" = "$WANT" ] && exit 0

# only act on a running MA; a stopped one is the boot script's job
case "$(midclt call app.query '[["name","=","music-assistant"]]' '{"select":["state"]}')" in
    *RUNNING*) ;;
    *) exit 0 ;;
esac

now=$(date +%s)
last=$(cat "$STAMP" 2>/dev/null || echo 0)
if [ $((now - last)) -lt 1800 ]; then
    log "Internal URL is '$have' again within 30 min of a fix; leaving it"
    exit 0
fi
echo "$now" > "$STAMP"

log "Internal URL was '$have'; stopping MA to set $WANT"
midclt call -j app.stop music-assistant >/dev/null 2>&1
cp "$CONF" "$CONF.bak-urlwatch"
sed -i "s#\"base_url\": *\"[^\"]*\"#\"base_url\": \"$WANT\"#" "$CONF"
midclt call -j app.start music-assistant >/dev/null 2>&1
sleep 20
have=$(sed -n 's/.*"base_url": *"\([^"]*\)".*/\1/p' "$CONF" | head -n 1)
log "MA restarted; Internal URL now '$have'"
