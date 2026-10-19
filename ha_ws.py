"""Home Assistant's REST proxy at /api/hassio/ rejects long-lived tokens, but
the websocket API accepts them and can forward to Supervisor. Same hand-rolled
RFC 6455 framing as the CDP driver - there is no websocket library on this box."""
import base64, json, os, socket, struct, sys


class WS:
    def __init__(self, host, port, path="/api/websocket"):
        self.s = socket.create_connection((host, port), timeout=30)
        key = base64.b64encode(os.urandom(16)).decode()
        self.s.sendall(("GET %s HTTP/1.1\r\nHost: %s:%d\r\nUpgrade: websocket\r\n"
                        "Connection: Upgrade\r\nSec-WebSocket-Key: %s\r\n"
                        "Sec-WebSocket-Version: 13\r\n\r\n"
                        % (path, host, port, key)).encode())
        buf = b""
        while b"\r\n\r\n" not in buf:
            buf += self.s.recv(4096)
        self.buf = buf.split(b"\r\n\r\n", 1)[1]

    def _read(self, n):
        while len(self.buf) < n:
            chunk = self.s.recv(65536)
            if not chunk:
                raise IOError("socket closed")
            self.buf += chunk
        out, self.buf = self.buf[:n], self.buf[n:]
        return out

    def recv(self):
        b1, b2 = self._read(2)
        ln = b2 & 127
        if ln == 126:
            ln = struct.unpack(">H", self._read(2))[0]
        elif ln == 127:
            ln = struct.unpack(">Q", self._read(8))[0]
        return json.loads(self._read(ln).decode("utf-8", "replace"))

    def send(self, obj):
        body = json.dumps(obj).encode()
        n, mask = len(body), os.urandom(4)
        hdr = b"\x81"
        if n < 126:
            hdr += bytes([128 | n])
        elif n < 65536:
            hdr += bytes([254]) + struct.pack(">H", n)
        else:
            hdr += bytes([255]) + struct.pack(">Q", n)
        self.s.sendall(hdr + mask + bytes(c ^ mask[i % 4] for i, c in enumerate(body)))


def connect(host, token, port=8123):
    ws = WS(host, port)
    hello = ws.recv()
    if hello.get("type") != "auth_required":
        raise SystemExit("unexpected greeting: %s" % hello)
    ws.send({"type": "auth", "access_token": token})
    r = ws.recv()
    if r.get("type") != "auth_ok":
        raise SystemExit("auth failed: %s" % r)
    return ws


def call(ws, msg_id, **msg):
    ws.send(dict(id=msg_id, **msg))
    while True:
        r = ws.recv()
        if r.get("id") == msg_id and r.get("type") == "result":
            return r
