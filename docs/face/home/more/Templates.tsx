import type { JSX, ReactNode } from "react";
import { BUTTON_TYPE, Grain } from "@hx/ui";
import { DashboardPage } from "../../../src/pages/templates/page-dashboard/DashboardPage";
import { OpenSourcePage } from "../../../src/pages/templates/page-opensource/OpenSourcePage";
import { PortfolioPage } from "../../../src/pages/templates/page-portfolio/PortfolioPage";
import { PricingPage } from "../../../src/pages/templates/page-pricing/PricingPage";
import { SaasLandingPage } from "../../../src/pages/templates/page-saas/SaasLandingPage";
import { TEMPLATE_ENTRY } from "../../../src/components/site";
import { PagePreview, SectionHead, Tile } from "../kit/Tile";
import { ARROW, BTN, WRAP } from "../kit/layout";
import { FACTS } from "../site-facts";

const TOP_H = 268;
const LOW_H = 200;
/** 整页缩略在图区里的框: 上左右留边, 底边出血, 像一张从下面露出来的截图. */
const FRAME = "left-7 right-7 top-7 bottom-0 rounded-t-lg border border-b-0 border-border";

/** 定价页的导航与大标题在矮卡顶上, 滚到顶栏底下会被切成半行; 往上推到套餐卡那一截. */
const PRICING_OFFSET = 300;

function Shot({ children, offset }: { readonly children: ReactNode; readonly offset?: number }): JSX.Element {
  return (
    <>
      <Grain opacity={0.08} />
      <PagePreview className={FRAME} offset={offset}>{children}</PagePreview>
    </>
  );
}

/** 整页模板卡墙 (对标 Pro 段): 两大三小, 每张卡里是文档站里那套模板的真实整页, 缩到卡宽. */
export function Templates({ onGo }: { readonly onGo: (id: string) => void }): JSX.Element {
  return (
    <section aria-labelledby="templates-title" className={`${WRAP} pt-[207px] pb-[105px]`}>
      <SectionHead
        title={<span id="templates-title">不止首屏, 一整页都有.</span>}
        sub={`${FACTS.templates} 套整页模板与 ${FACTS.blocks} 组区块, 全是能改的源码.`}
        action={
          <button type={BUTTON_TYPE} className={BTN.light} onClick={() => onGo(TEMPLATE_ENTRY)}>
            浏览模板 <span aria-hidden>{ARROW}</span>
          </button>
        }
      />
      <div className="mt-10 grid gap-[13px] md:grid-cols-2">
        <Tile art={<Shot><SaasLandingPage /></Shot>} artHeight={TOP_H} title="SaaS 落地页" desc="主视觉, 客户墙, 便当格, 定价与问答, 三套皮肤." onOpen={() => onGo("page-saas")} />
        <Tile art={<Shot><OpenSourcePage /></Shot>} artHeight={TOP_H} title="开源项目站" desc="安装命令, 代码展示, 案例与更新日志." onOpen={() => onGo("page-opensource")} />
      </div>
      <div className="mt-[14px] grid gap-[13px] md:grid-cols-3">
        <Tile art={<Shot offset={PRICING_OFFSET}><PricingPage /></Shot>} artHeight={LOW_H} title="定价页" desc="月年切换套餐, 功能对比表, 分组问答." onOpen={() => onGo("page-pricing")} />
        <Tile art={<Shot><DashboardPage /></Shot>} artHeight={LOW_H} title="仪表盘" desc="侧栏, 指标行, 双图表, 动态流." onOpen={() => onGo("page-dashboard")} />
        <Tile art={<Shot><PortfolioPage /></Shot>} artHeight={LOW_H} title="个人主页" desc="粘性双栏, 经历, 项目与文章." onOpen={() => onGo("page-portfolio")} />
      </div>
    </section>
  );
}
