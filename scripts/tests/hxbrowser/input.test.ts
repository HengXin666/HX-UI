import { test } from "node:test";
import assert from "node:assert/strict";
import { findFocused, focusedGone, pickFocusTarget } from "../../../src/hxbrowser/core/focus";
import { buttonName, HeldInputs, mouseMessage } from "../../../src/hxbrowser/core/input";
import type { LiveEnv } from "../../../src/hxbrowser/core/protocol";
import { fetchLiveEnvs } from "../../../src/hxbrowser/core/transport";

const MODS = { altKey: false, ctrlKey: true, metaKey: false, shiftKey: false };
const LEFT = 10;
const TOP = 20;
const OFFSET = 100;
const RECT = { left: LEFT, top: TOP, width: 640 };
const RIGHT_BUTTON = "right";
const MOUSE_BUTTON_ORDER = ["left", "middle", RIGHT_BUTTON];
const ENV_A = "env-a";
const MOUSE_RIGHT = MOUSE_BUTTON_ORDER.indexOf(RIGHT_BUTTON);

test("mouse message carries image-local coordinates and display width only", () => {
    const m = mouseMessage("down", RECT, { clientX: LEFT + OFFSET, clientY: TOP + OFFSET, ...MODS }, { button: RIGHT_BUTTON });
    assert.deepEqual([m.x, m.y, m.clientWidth, m.button, m.ctrl], [OFFSET, OFFSET, RECT.width, RIGHT_BUTTON, true]);
    assert.equal(buttonName(MOUSE_RIGHT), RIGHT_BUTTON);
    assert.equal(buttonName(MOUSE_BUTTON_ORDER.length + 1), MOUSE_BUTTON_ORDER[0]);
});

test("held inputs remember the pressed button and release everything once", () => {
    const h = new HeldInputs();
    h.pressButton(RIGHT_BUTTON, { clientX: LEFT, clientY: TOP, ...MODS });
    h.pressKey({ key: "Shift", code: "ShiftLeft", keyCode: 16, ...MODS });
    assert.equal(h.pressedButton, RIGHT_BUTTON);
    assert.equal(h.releaseAll(null).length, 1, "keys only without a rect");
    assert.equal(h.pressedButton, RIGHT_BUTTON, "mouse kept until a rect is known");
    const [up, ...rest] = h.releaseAll(RECT);
    assert.equal(rest.length, 0);
    assert.equal(up.type, "mouse");
    assert.equal((up as { button: string }).button, RIGHT_BUTTON);
    assert.equal(h.releaseAll(RECT).length, 0);
    assert.equal(h.releaseKey({ key: "z", code: "KeyZ", keyCode: 90, ...MODS }), false);
});

const env = (id: string, supported = true): LiveEnv => ({
    id, name: id, group: "", kernel: "", kernel_family: "", isolation: "", window_system: "",
    display: "", display_source: "", visible: false, running: true, supported, unsupported_reason: "",
});

test("a stopped focused env never falls back to another env", () => {
    const envs = [env("b"), env("c")];
    assert.equal(findFocused(envs, ENV_A), null);
    assert.equal(focusedGone(envs, ENV_A, true, ""), true);
    assert.equal(focusedGone(envs, ENV_A, true, "HTTP 502"), false, "a failed poll is not a stop");
    assert.equal(focusedGone(envs, ENV_A, false, ""), false);
    assert.equal(pickFocusTarget([env("x", false), env("y")], "")?.id, "y");
});

test("env list fetch sends the api key header and surfaces server errors verbatim", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const ok = async (url: string, init?: RequestInit) => {
        calls.push({ url, init });
        return new Response(JSON.stringify({ code: 0, data: { envs: [env(ENV_A)] } }));
    };
    const list = await fetchLiveEnvs({ baseUrl: "/hxbr", apiKey: "k", fetchImpl: ok });
    assert.equal(list[0].id, ENV_A);
    assert.equal(calls[0].url, "/hxbr/api/v1/live/envs");
    assert.deepEqual(calls[0].init?.headers, { "x-api-key": "k" });
    const bad = async () => new Response(JSON.stringify({ code: -1, msg: "nope" }));
    await assert.rejects(fetchLiveEnvs({ baseUrl: "", fetchImpl: bad }), /nope/);
});
