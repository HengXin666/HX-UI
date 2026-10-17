/**
 * 测试用 WebSocket 替身与手动时钟: 记录发出的消息, 由测试驱动 open / message / close.
 */

const CLOSED = 3;

export class FakeWebSocket {
    static instances: FakeWebSocket[] = [];
    readyState = 0;
    readonly url: string;
    readonly sent: Array<Record<string, unknown>> = [];
    onopen: (() => void) | null = null;
    onmessage: ((e: { data: unknown }) => void) | null = null;
    onclose: ((e: { code: number }) => void) | null = null;
    closedByClient = false;

    constructor(url: string) {
        this.url = url;
        FakeWebSocket.instances.push(this);
    }

    send(data: string): void {
        this.sent.push(JSON.parse(data) as Record<string, unknown>);
    }

    close(): void {
        this.closedByClient = true;
        this.readyState = CLOSED;
    }

    serverOpen(): void {
        this.readyState = 1;
        this.onopen?.();
    }

    serverSend(event: Record<string, unknown>): void {
        this.onmessage?.({ data: JSON.stringify(event) });
    }

    serverClose(code: number): void {
        this.readyState = CLOSED;
        this.onclose?.({ code });
    }

    types(): unknown[] {
        return this.sent.map((m) => m.type);
    }
}

/** 手动推进的时钟: 只有 tick 才触发到期回调. */
export class ManualTimers {
    private now = 0;
    private seq = 0;
    private readonly pending = new Map<number, { at: number; fn: () => void }>();
    readonly delays: number[] = [];

    set = (fn: () => void, ms: number): unknown => {
        this.seq += 1;
        this.pending.set(this.seq, { at: this.now + ms, fn });
        this.delays.push(ms);
        return this.seq;
    };

    clear = (handle: unknown): void => {
        this.pending.delete(handle as number);
    };

    tick(ms: number): void {
        this.now += ms;
        for (const [id, t] of [...this.pending]) {
            if (t.at <= this.now) {
                this.pending.delete(id);
                t.fn();
            }
        }
    }
}
