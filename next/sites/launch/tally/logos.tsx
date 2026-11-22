import { Hexagon, Mountain, Plus, Sailboat, Triangle } from "lucide-react";

/** 演示用客户标识: 纯排版 + 线性图标, 风格各异但同为单色, 看起来像真实品牌墙. */
export const TALLY_LOGOS = [
  <span key="1" className="flex items-center gap-1.5 text-lg font-semibold tracking-tight"><Triangle className="size-4 fill-current" />Bluewhale</span>,
  <span key="2" className="font-serif text-xl italic tracking-tight">Qinghe</span>,
  <span key="3" className="text-[15px] font-bold uppercase tracking-[0.28em]">Aurora</span>,
  <span key="4" className="flex items-center gap-1 text-lg font-medium"><Plus className="size-4" strokeWidth={3} />northstar</span>,
  <span key="5" className="font-mono text-lg font-semibold">yunqi_</span>,
  <span key="6" className="flex items-center gap-1.5 text-lg font-semibold tracking-tight"><Mountain className="size-4" />Shanhai</span>,
  <span key="7" className="flex items-center gap-1.5 text-lg tracking-tight"><Sailboat className="size-4" /><b className="font-semibold">Qian</b>fan</span>,
  <span key="8" className="flex items-center gap-1.5 font-serif text-lg font-semibold"><Hexagon className="size-4" />Zhixing & Co.</span>,
];
