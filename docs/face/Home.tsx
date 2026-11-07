import { useEffect, useState, type JSX } from "react";
import { BUTTON_TYPE, VARIANT } from "@hx/ui";
import { TONE_VARIANT } from "../../src/constants/ui";
import { Button } from "../../src/primitives/button";
import { Follow, NumberRoll, SegmentedThumb } from "../../src/craft";
import { DEAL_FIRST_MS, DEAL_LAST_MS, HERO_LIFT_PX, HERO_SINK_PX } from "../../src/craft/tokens";
import { DOCS, GROUPS } from "../src/nav";

const REDUCED = "(prefers-reduced-motion: reduce)";

function heroFrame(elapsed: number): { y: number; scale: number } {
  if (elapsed < 200) return { y: HERO_SINK_PX * (elapsed / 200), scale: 1 };
  if (elapsed < 900) {
    const t = (elapsed - 200) / 700;
    return { y: HERO_SINK_PX + (-HERO_SINK_PX - HERO_LIFT_PX) * t, scale: 1 + 0.02 * t };
  }
  if (elapsed < 1400) {
    const t = (elapsed - 900) / 500;
    return { y: -HERO_LIFT_PX * (1 - t), scale: 1.02 - 0.02 * t };
  }
  return { y: 0, scale: 1 };
}

/** 门面首页. 一镜一件事, 滚动进度可逆. */
export function Home({ onGo }: { readonly onGo: (id: string) => void }): JSX.Element {
  const [hero, setHero] = useState({ y: HERO_SINK_PX, scale: 1, ready: false });
  const [page, setPage] = useState<"field" | "kiln">("field");
  const [progress, setProgress] = useState(0);
  const groups = GROUPS.slice(0, 4);

  useEffect(() => {
    const reduced = window.matchMedia?.(REDUCED).matches === true;
    if (reduced) {
      setHero({ y: 0, scale: 1, ready: true });
      return;
    }
    const began = performance.now();
    let frame = 0;
    const loop = (now: number): void => {
      const elapsed = now - began;
      const pose = heroFrame(elapsed);
      setHero({ ...pose, ready: elapsed >= 2400 });
      if (elapsed < 2500) frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    const onScroll = (): void => {
      const range = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(range <= 0 ? 1 : Math.min(1, Math.max(0, window.scrollY / range)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const deal = Math.min(1, Math.max(0, (progress - 0.25) / 0.2));

  return (
    <main>
      <section className="mx-auto flex min-h-[70vh] max-w-3xl flex-col justify-center px-5 py-16">
        <p className="text-sm text-muted-foreground">HX UI</p>
        <h1
          className="mt-4 text-5xl font-medium tracking-tight text-foreground md:text-7xl"
          style={{ transform: `translate3d(0, ${hero.y}px, 0) scale(${hero.scale})`, transformOrigin: "left center" }}
        >
          先把一页排完.
        </h1>
        <div className="mt-8 max-w-md" style={{ opacity: hero.ready ? 1 : 0, transform: hero.ready ? "none" : "translate3d(32px, 0, 0)" }}>
          <Follow className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">记录</p>
            <p className="mt-2 text-foreground">控件的 90ms 比背景着色器更贵.</p>
            <p className="mt-1 text-sm text-muted-foreground">按下, 松开, 再按下, 速度还在.</p>
          </Follow>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-5 py-16 md:grid-cols-3">
        {["预备要看得见", "满板之后停住", "飞入必须落进槽位"].map((title, index) => {
          const start = index === 0 ? 0 : index === 1 ? DEAL_FIRST_MS : DEAL_FIRST_MS + DEAL_LAST_MS;
          const shown = deal * 1000 >= start;
          return (
            <article
              key={title}
              className="rounded-xl border border-border bg-card p-4 shadow-sm"
              style={{
                opacity: shown ? 1 : 0,
                transform: shown ? "none" : "translate3d(0, 24px, 0)",
                transition: "opacity 180ms linear, transform 180ms linear, box-shadow 80ms linear",
              }}
            >
              <h2 className="text-lg text-foreground">{title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">间隔从 120ms 收到 40ms, 阴影比卡片晚一拍.</p>
            </article>
          );
        })}
      </section>

      <section className="mx-auto max-w-3xl px-5 py-16">
        <SegmentedThumb
          ariaLabel="整页"
          options={[
            { value: "field" as const, label: "田野" },
            { value: "kiln" as const, label: "窑四号" },
          ]}
          value={page}
          onChange={(next) => {
            if (next === "field" || next === "kiln") setPage(next);
          }}
        />
        <div className="relative mt-6 h-40 overflow-hidden">
          <div className="absolute inset-0 rounded-xl border border-border p-6" style={{ opacity: page === "field" ? 1 : 0, transform: page === "field" ? "none" : "translate3d(-24px, 0, 0)", transition: "opacity 180ms linear, transform 267ms linear" }}>
            <p className="text-xl text-foreground">田野把一页软件排完.</p>
          </div>
          <div className="absolute inset-0 rounded-xl border border-border p-6" style={{ opacity: page === "kiln" ? 1 : 0, transform: page === "kiln" ? "none" : "translate3d(24px, 0, 0)", transition: "opacity 180ms linear, transform 267ms linear" }}>
            <p className="text-xl text-foreground">窑四号把一件商品排完.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-16">
        <p className="text-sm text-muted-foreground">这一镜只有一个数字</p>
        <p className="mt-3 text-6xl text-foreground">
          <NumberRoll value={progress > 0.7 ? 890000 : 120} />
        </p>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-16">
        <div className="flex flex-wrap gap-3">
          {groups.map((group) => (
            <Button key={group} type={BUTTON_TYPE} variant={TONE_VARIANT.outline} onClick={() => onGo(DOCS.find((entry) => entry.group === group)?.id ?? "install")}>
              {group}
            </Button>
          ))}
          <Button type={BUTTON_TYPE} variant={VARIANT.primary} onClick={() => onGo("bench")}>
            看按下的 90ms
          </Button>
        </div>
      </section>
    </main>
  );
}
