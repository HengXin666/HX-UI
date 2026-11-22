import { Section } from "@sites/_blocks/marketing/section";
import { DocsHeader } from "./docs-header";
import { SiteGrid } from "./sites";

export default function SitesIndex() {
  return (
    <div>
      <DocsHeader />
      <main className="mx-auto max-w-6xl md:border-x">
        <Section eyebrow="L3 成品" title="整套页面，各有美术方向" description="点开全屏预览。R3 起每套附带 prompt.md，可以直接交给 AI 生成同款。" align="left">
          <SiteGrid />
        </Section>
      </main>
    </div>
  );
}
