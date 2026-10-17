import { test } from "node:test";
import assert from "node:assert/strict";
import { LiveConnection, type LiveSnapshot } from "../../../src/hxbrowser/core/connection";
import { LIVE_CLOSE, LIVE_EVT, LIVE_MSG } from "../../../src/hxbrowser/core/protocol";
import { liveSessionUrl } from "../../../src/hxbrowser/core/transport";
import { FakeWebSocket, ManualTimers } from "./fake-ws";

const ORIGIN = "http://console.local:5173";
const BASE = "/hxbr";
const BASE_MS = 100;
const ATTEMPTS = 3;
const RETRY = { baseMs: BASE_MS, maxMs: 1000, maxAttempts: ATTEMPTS, stableMs: 500 };
const LONG_WAIT = RETRY.maxMs * ATTEMPTS * ATTEMPTS;

function connect(paused = false) {
    FakeWebSocket.instances = [];
    const timers = new ManualTimers();
    const seen: LiveSnapshot[] = [];
    const conn = new LiveConnection({
        envId: "env-1",
        preset: "grid",
        paused,
        retry: RETRY,
        timers,
        transport: { baseUrl: BASE, origin: ORIGIN, WebSocketImpl: FakeWebSocket as unknown as typeof WebSocket },
        onChange: (s) => seen.push(s),
    });
    conn.start();
    const last = () => FakeWebSocket.instances[FakeWebSocket.instances.length - 1];
    return { conn, timers, seen, last };
}

test("session url resolves relative base, escapes env id and carries key in query", () => {
    const url = liveSessionUrl({ baseUrl: BASE, origin: "https://x.dev", apiKey: "k1" }, "a/b", "focus");
    assert.equal(url, "wss://x.dev/hxbr/api/v1/environments/a%2Fb/live?preset=focus&key=k1");
    const custom = liveSessionUrl({ baseUrl: "", wsUrlBuilder: (p, q) => `ws://gw${p}?${q}` }, "e", "grid");
    assert.equal(custom, "ws://gw/api/v1/environments/e/live?preset=grid");
});

test("open requests tabs, paused connection asks server to pause before anything else", () => {
    const { last, conn } = connect(true);
    last().serverOpen();
    assert.deepEqual(last().types(), [LIVE_MSG.pause, LIVE_MSG.tabs]);
    assert.equal(conn.snapshot.status, "paused");
    conn.setPaused(false);
    assert.equal(last().types().at(-1), LIVE_MSG.resume);
    assert.equal(conn.snapshot.status, "live");
});

test("server events update the snapshot and malformed messages are ignored", () => {
    const { last, conn } = connect();
    const ws = last();
    ws.serverOpen();
    ws.serverSend({ type: LIVE_EVT.frame, data: "QUJD", sessionId: 1 });
    ws.serverSend({ type: LIVE_EVT.meta, url: "https://a/", title: "A", pageWidth: 1, pageHeight: 1, streaming: true });
    ws.serverSend({ type: LIVE_EVT.tabs, tabs: [{ targetId: "t", title: "", url: "", active: true }] });
    ws.onmessage?.({ data: "not json" });
    ws.serverSend({ type: LIVE_EVT.error, message: "boom", fatal: false });
    const s = conn.snapshot;
    assert.equal(s.frame, "data:image/jpeg;base64,QUJD");
    assert.equal(s.meta?.url, "https://a/");
    assert.equal(s.tabs.length, 1);
    assert.equal(s.error, "boom");
});

test("4502 right after handshake does not reset the retry counter, backoff grows and stops", () => {
    const { last, conn, timers } = connect();
    for (let i = 0; i < RETRY.maxAttempts; i += 1) {
        last().serverOpen();
        last().serverClose(LIVE_CLOSE.upstream);
        assert.equal(conn.snapshot.status, "reconnecting");
        assert.equal(conn.snapshot.attempt, i + 1);
        timers.tick(RETRY.maxMs);
    }
    last().serverOpen();
    last().serverClose(LIVE_CLOSE.upstream);
    assert.equal(conn.snapshot.status, "failed");
    assert.equal(FakeWebSocket.instances.length, RETRY.maxAttempts + 1);
    const backoffs = timers.delays.filter((d) => d !== RETRY.stableMs);
    assert.deepEqual(backoffs, [BASE_MS, BASE_MS + BASE_MS, BASE_MS * ATTEMPTS + BASE_MS]);
});

test("retry counter is cleared only after the connection stays open for stableMs", () => {
    const { last, conn, timers } = connect();
    last().serverClose(LIVE_CLOSE.upstream);
    timers.tick(RETRY.maxMs);
    last().serverOpen();
    assert.equal(conn.snapshot.attempt, 1);
    timers.tick(RETRY.stableMs);
    assert.equal(conn.snapshot.attempt, 0);
});

test("refusal codes never reconnect", () => {
    for (const code of [LIVE_CLOSE.unsupported, LIVE_CLOSE.auth, LIVE_CLOSE.notFound]) {
        const { last, conn, timers } = connect();
        last().serverOpen();
        last().serverClose(code);
        timers.tick(LONG_WAIT);
        assert.equal(conn.snapshot.status, "refused");
        assert.equal(FakeWebSocket.instances.length, 1);
    }
});

test("input is dropped while disconnected and stop cancels pending reconnects", () => {
    const { last, conn, timers } = connect();
    assert.equal(conn.send({ type: LIVE_MSG.tabs }), false);
    last().serverOpen();
    last().serverClose(LIVE_CLOSE.upstream);
    conn.stop();
    timers.tick(LONG_WAIT);
    assert.equal(FakeWebSocket.instances.length, 1);
    conn.reconnect();
    assert.equal(FakeWebSocket.instances.length, 1 + 1);
    assert.equal(conn.snapshot.attempt, 0);
});
