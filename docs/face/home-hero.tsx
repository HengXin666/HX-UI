import { useEffect, useState, type JSX } from "react";
import { CraftButton, Magnet, MS, heroPose, useReducedMotion } from "../../src/craft";
import { FieldPlate } from "../../src/studio/pages/FieldPlate";
import { FACE_PREVIEW, PREVIEW_FIELD } from "./router";

/** 镜 0 先空着. 镜 1 只有这一句走过预备, 过冲和停住. */
export function HomeHero({ onGo }: { readonly onGo: (id: string) => void }): JSX.Element {
  const reduced = useReducedMotion();
  const [pose, setPose] = useState(() => heroPose(reduced ? MS.quiet + MS.still : 0));
  const [card, setCard] = useState(reduced);

  useEffect(() => {
    if (reduced) {
      setPose(heroPose(MS.quiet + MS.still));
      setCard(true);
      return undefined;
    }
    const start = performance.now();
    let frame = 0;
    const tick = (now: number): void => {
      const ms = now - start;
      setPose(heroPose(ms));
      if (ms >= MS.quiet + MS.still) setCard(true);
      if (ms < MS.quiet + MS.arc) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reduced]);

  return (
    <section className="mx-auto grid min-h-[100svh] w-full max-w-6xl items-center gap-16 px-5 py-20 md:grid-cols-[1.1fr_0.9fr] md:px-8">
      <div>
        <p className="text-xs font-medium tracking-wide text-muted-foreground">HX UI</p>
        <h1
          className="mt-6 max-w-[12ch] text-5xl font-semibold tracking-tight md:text-7xl"
          style={{
            opacity: pose.opacity,
            transform: `translate3d(0, ${pose.y.toFixed(2)}px, 0) scale(${pose.scale.toFixed(4)})`,
          }}
        >
          先把一页排完.
        </h1>
        <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">按下, 松开, 滑过去. 每一下都从当前速度接着走.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <CraftButton onClick={() => onGo("craft")}>看手感</CraftButton>
          <CraftButton variant="outline" onClick={() => onGo(`${FACE_PREVIEW}/${PREVIEW_FIELD}`)}>看田野这一页</CraftButton>
        </div>
      </div>
      <Magnet className={"rounded-xl border border-border bg-card " + (card ? "opacity-100" : "opacity-0")}>
        <FieldPlate />
      </Magnet>
    </section>
  );
}
