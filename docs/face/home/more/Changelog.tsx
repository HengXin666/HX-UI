import type { JSX } from "react";
import { Button, Marquee } from "@hx/ui";
import { REPO_URL } from "../../../src/components/site";
import { SectionHead } from "../kit/Tile";
import { BTN, OUT, WRAP } from "../kit/layout";
import { COMMITS, type Commit } from "./changelog-data";

const COLUMNS = 3;
/** 三列竖向慢滚, 列与列速度错开, 像实拍里那面评价墙. 顶边 56px 淡入, 滚到一半的卡不露硬切口. */
const DURATIONS = [70, 86, 78] as const;
const TYPE_RE = /^(\w+)(\([^)]*\))?:\s*/;

function CommitCard({ commit }: { readonly commit: Commit }): JSX.Element {
  const kind = TYPE_RE.exec(commit.subject);
  const title = kind ? commit.subject.slice(kind[0].length) : commit.subject;
  return (
    <a
      href={`${REPO_URL}/commit/${commit.hash}`}
      className="block w-full rounded-2xl border border-border bg-card px-5 py-4 transition-[border-color] hover:border-border-strong focus-visible:outline-1 focus-visible:outline-ring"
    >
      <p className="m-0 text-[15px] leading-[23px] text-foreground">{title}</p>
      <p className="mb-0 mt-3 flex items-center gap-3 font-mono text-[12px] text-muted-foreground">
        {kind ? <span className="rounded-md border border-border px-1.5 py-0.5 text-foreground">{kind[1]}{kind[2] ?? ""}</span> : null}
        <span>{commit.hash}</span>
        <span className="ml-auto">{commit.date}</span>
      </p>
    </a>
  );
}

/** 更新日志: 替代原站的赞助与评价两段. 卡片都是仓库里的真实提交, 点开到 GitHub 上那一条. */
export function Changelog(): JSX.Element {
  const columns = Array.from({ length: COLUMNS }, (_, c) => COMMITS.filter((_, i) => i % COLUMNS === c));
  return (
    <section aria-labelledby="changelog-title" className={`${WRAP} pt-[240px]`}>
      <SectionHead
        title={<span id="changelog-title">更新日志</span>}
        sub="每一条都是仓库里的真实提交, 最新的在最前."
        action={
          <Button asChild {...BTN.dark}>
            <a href={`${REPO_URL}/commits`}>
              全部提交 <span aria-hidden>{OUT}</span>
            </a>
          </Button>
        }
      />
      <div className="mt-10 grid h-[1110px] items-start gap-[13px] overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_56px,black_86%,transparent)] md:grid-cols-3">
        {columns.map((list, c) => (
          <Marquee key={c} vertical pauseOnHover reverse={c % 2 === 1} duration={DURATIONS[c]} gap="13px" className={c > 0 ? "hidden md:flex" : undefined}>
            {list.map((commit) => <CommitCard key={commit.hash} commit={commit} />)}
          </Marquee>
        ))}
      </div>
    </section>
  );
}
