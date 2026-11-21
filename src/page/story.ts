import { STORY_FALLBACK_SHOT, STORY_LAYOUT, STORY_PACE_CYCLE } from "../constants/page-beat";
import type { ShotRecipeName } from "../motion/recipe-cards";
import { DIRECTIONS, type DirectionName } from "./beat";
import type { PageSpec, SectionOf, SectionRegistry, StoryBeat } from "./define";

/** 区块的锚点, 与 PageComposer 同一规则: props.id > key > type-序号. */
function idOf<R extends SectionRegistry>(node: SectionOf<R>, index: number): string {
  const own = (node.props as { id?: unknown } | undefined)?.id;
  if (typeof own === "string" && own !== "") return own;
  return node.key ?? `${node.type}-${index}`;
}

/** 方向白名单的第一张; 没给方向用兜底镜头. */
function shotFor(direction: DirectionName | undefined): ShotRecipeName {
  if (!direction) return STORY_FALLBACK_SHOT;
  return DIRECTIONS[direction].shots[0] ?? STORY_FALLBACK_SHOT;
}

/**
 * 旧写法到新写法的桥: 一个区块一拍. 主角先写区块名, 镜头取方向白名单第一张, 版式 stack, 节奏 even / fast / slow 轮转,
 * 因此转出来的拍一定过 validateBeats 的节奏与镜头两项. 想要真正的叙事再手写 story.
 *
 * .agents/notes/implemented/architecture/2026-11-18-omni-page-beats.md
 */
export function sectionsToBeats<R extends SectionRegistry>(sections: ReadonlyArray<SectionOf<R>>, direction?: DirectionName): StoryBeat<R>[] {
  const shot = shotFor(direction);
  return sections.map((node, index) => ({
    id: idOf(node, index),
    lead: node.type,
    shot,
    layout: STORY_LAYOUT,
    pace: STORY_PACE_CYCLE[index % STORY_PACE_CYCLE.length],
    sections: [node],
  }));
}

/**
 * 一份 spec 该按哪些拍渲染: 有 story 用 story; 只有 sections 且给了 direction 时自动转拍; 否则 undefined (走旧的竖排).
 */
export function storyOf<R extends SectionRegistry>(spec: PageSpec<R>): ReadonlyArray<StoryBeat<R>> | undefined {
  if (spec.story) return spec.story;
  if (spec.direction && spec.sections) return sectionsToBeats(spec.sections, spec.direction);
  return undefined;
}
