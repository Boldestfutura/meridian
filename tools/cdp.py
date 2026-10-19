"""Minimal CDP client over hand-rolled RFC 6455 frames. No websocket lib on this box."""
import json, socket, base64, os, struct, urllib.request, itertools


def _targets(port):
    with urllib.request.urlopen("http://127.0.0.1:%d/json" % port, timeout=5) as r:
        return json.load(r)


class Browser:
    def __init__(self, port=9222, url_filter=None):
        pages = [t for t in _targets(port) if t.get("type") == "page"]
        if url_filter:
            pages = [t for t in pages if url_filter in t.get("url", "")] or pages
        self.ws_url = pages[0]["webSocketDebuggerUrl"]
        self.ids = itertools.count(1)
        self._connect()

    def _connect(self):
        _, rest = self.ws_url.split("://", 1)
        hostport, path = rest.split("/", 1)
        host, port = hostport.split(":")
        self.sock = socket.create_connection((host, int(port)), timeout=60)
        key = base64.b64encode(os.urandom(16)).decode()
        self.sock.sendall((
            "GET /%s HTTP/1.1\r\nHost: %s\r\nUpgrade: websocket\r\n"
            "Connection: Upgrade\r\nSec-WebSocket-Key: %s\r\n"
            "Sec-WebSocket-Version: 13\r\n\r\n" % (path, hostport, key)).encode())
        buf = b""
        while b"\r\n\r\n" not in buf:
            buf += self.sock.recv(4096)

    def _send(self, payload):
        data = json.dumps(payload).encode()
        n = len(data)
        hdr = b"\x81"
        if n < 126:
            hdr += bytes([0x80 | n])
        elif n < 65536:
            hdr += b"\xfe" + struct.pack(">H", n)
        else:
            hdr += b"\xff" + struct.pack(">Q", n)
        mask = os.urandom(4)
        self.sock.sendall(hdr + mask + bytes(b ^ mask[i % 4] for i, b in enumerate(data)))

    def _recv(self):
        def rd(n):
            out = b""
            while len(out) < n:
                chunk = self.sock.recv(n - len(out))
                if not chunk:
                    raise IOError("socket closed")
                out += chunk
            return out
        while True:
            b0, b1 = rd(2)
            ln = b1 & 0x7F
            if ln == 126:
                ln = struct.unpack(">H", rd(2))[0]
            elif ln == 127:
                ln = struct.unpack(">Q", rd(8))[0]
            body = rd(ln)
            if (b0 & 0x0F) == 1:
                return json.loads(body)

    def call(self, method, **params):
        mid = next(self.ids)
        self._send({"id": mid, "method": method, "params": params})
        while True:
            msg = self._recv()
            if msg.get("id") == mid:
                if "error" in msg:
                    raise RuntimeError("%s: %s" % (method, msg["error"]))
                return msg.get("result", {})

    def eval(self, expr, timeout_hint=None):
        r = self.call("Runtime.evaluate", expression=expr, returnByValue=True,
                      awaitPromise=True, userGesture=True)
        if r.get("exceptionDetails"):
            return "EXCEPTION: " + json.dumps(r["exceptionDetails"])[:500]
        return r.get("result", {}).get("value")

    def goto(self, url):
        self.call("Page.enable")
        self.call("Page.navigate", url=url)

    def shot(self, path, full=True):
        r = self.call("Page.captureScreenshot", format="png", captureBeyondViewport=full)
        with open(path, "wb") as f:
            f.write(base64.b64decode(r["data"]))
        return path
