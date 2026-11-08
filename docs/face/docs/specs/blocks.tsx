import type { ReactNode } from "react";
import {
  BlocksProvider,
  Button,
  CtaBanner,
  DENSITY,
  DENSITY_LIST,
  Hero,
  Input,
  LogoWall,
  Newsletter,
  SKIN,
  SKIN_LIST,
  SegmentedControl,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SettingRow,
  SettingSection,
  Switch,
  type HeroProps,
} from "@hx/ui";
import heroRaw from "../../../../src/blocks/marketing/Hero.tsx?raw";
import settingRaw from "../../../../src/layout/SettingChrome.tsx?raw";
import { CTA_BOXED, HERO_CENTERED, HERO_PRODUCT, LOGO_WALL_GRID, NEWSLETTER_DATA, json } from "../../../src/pages/blocks/marketing-v102/data";
import { select, toggle, type PageSpec, type Values } from "./types";

/**
 * 样板批的两个整块页: 首屏区块 (Hero 为主件, 同组的 LogoWall, CtaBanner, Newsletter 作部件) 与设置页模板.
 * 皮肤与密度写在舞台包裹层的 data-skin / data-density 上, 区块只读语义令牌.
 * .agents/notes/implemented/feature/2026-11-08-docs-component-pages.md
 */

const SKINS = SKIN_LIST.map((skin) => skin.name);
const DENSITIES = DENSITY_LIST.map((density) => density.name);
/** 区块共有的槽位与样式钩子, 每个区块都有, 不在每张表里重复. */
const BLOCK_HOOKS = ["id", "className", "style", "classNames", "styles", "as", "labels", "slots", "aria-label", "aria-labelledby"];
const HOOKS_NOTE = "另有区块共有的 id, className, style, classNames / styles 槽位, as, labels, slots 与 aria-label(ledby), 每个区块都一样, 见区块总述.";

function Skinned({ skin, density, children }: { readonly skin: unknown; readonly density?: unknown; readonly children: ReactNode }) {
  return (
    <div data-skin={String(skin)} data-density={density ? String(density) : undefined} className="min-h-full bg-background text-foreground">
      <BlocksProvider locale="zh-CN">{children}</BlocksProvider>
    </div>
  );
}

/** 模拟订阅: 含 fail 的邮箱走失败态, 其余 800ms 后成功. */
function fakeSubscribe(email: string): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => (email.includes("fail") ? reject(new Error("demo")) : resolve()), 800);
  });
}

// ── 首屏区块 ────────────────────────────────────────────────────────
const HERO_KEYS = ["tone", "pad", "align", "titleSize", "reveal"] as const;

function heroUsage(values: Values): string {
  const changed = HERO_KEYS.filter((key) => values[key] !== HERO_BASE[key]).map((key) => `  ${key}=${JSON.stringify(values[key] === "false" ? false : values[key])}`);
  const skin = values.skin === SKIN.default ? "" : ` data-skin=${JSON.stringify(values.skin)}`;
  const props = changed.length > 0 ? `\n  {...data}\n${changed.join("\n")}\n` : " {...data} ";
  return `import { BlocksProvider, Hero, type HeroProps } from "@hx/ui";\n\nconst data: HeroProps = ${json(HERO_CENTERED)};\n\nexport function Demo() {\n  return (\n    <div${skin}>\n      <BlocksProvider locale="zh-CN">\n        <Hero${props}/>\n      </BlocksProvider>\n    </div>\n  );\n}`;
}

const HERO_BASE: Values = { tone: "plain", pad: "lg", align: "center", titleSize: "xl", reveal: "rise" };

const BLOCKS_HERO: PageSpec = {
  id: "blocks-hero",
  kind: "block",
  importName: "Hero",
  parts: ["LogoWall", "CtaBanner", "Newsletter"],
  source: "src/blocks/marketing/Hero.tsx",
  raw: heroRaw,
  deps: ["motion"],
  height: 560,
  controls: [
    select("skin", "皮肤", SKINS, SKIN.default, "", "舞台包裹层的 data-skin, 区块本身不感知皮肤名."),
    select("tone", "底色", ["plain", "muted", "card", "brand", "inverted"], "plain", "", "区块底色档."),
    select("pad", "上下留白", ["sm", "md", "lg", "xl"], "lg", "", "区块的上下节奏档."),
    select("align", "对齐", ["center", "start"], "center", "", "标题组对齐."),
    select("titleSize", "标题字号", ["md", "lg", "xl", "2xl"], "xl", "", "标题字号档."),
    select("reveal", "入场", ["rise", "fade", "stagger", "false"], "rise", "", "进入视口时的入场方式; false 不做入场."),
  ],
  hideProps: BLOCK_HOOKS,
  propsNote: HOOKS_NOTE,
  propDesc: {
    eyebrow: "标题上方的一行小字.",
    title: "主标题, 支持富文本片段.",
    lead: "导语.",
    trust: "按钮下的信任行 (头像组, 评分).",
    titleSize: "标题字号档.",
    titleLevel: "标题层级, 默认 h1.",
    tone: "区块底色档.",
    pad: "区块的上下节奏档.",
    width: "内容最大宽度档.",
    align: "标题组对齐.",
    reveal: "进入视口时的入场方式, false 不做入场.",
    heading: "完整标题组 (含动作), 给了就以它为准.",
    eyebrowTone: "眉标的语气色.",
  },
  toProps: (values) => ({ ...values, reveal: values.reveal === "false" ? false : values.reveal }),
  render: (props) => {
    const { skin, ...rest } = props;
    return (
      <Skinned skin={skin}>
        {/* 演示里降成 h2: 页面自己的 h1 是组件名, 区块默认的 h1 留给真实页面 */}
        <Hero {...HERO_CENTERED} {...(rest as Partial<HeroProps>)} titleLevel={2} />
      </Skinned>
    );
  },
  usage: heroUsage,
  examples: [
    {
      id: "product",
      title: "产品图 (linear / apple 型)",
      align: "stretch",
      code: `<Hero {...data} />\n\n// data\n${json(HERO_PRODUCT)}`,
      render: () => (
        <Skinned skin={SKIN.default}>
          <Hero {...HERO_PRODUCT} titleLevel={2} />
        </Skinned>
      ),
    },
    {
      id: "logo-wall",
      title: "LogoWall 标志墙",
      desc: "静态网格, 窄容器自动转横滚; 默认灰度, 悬停或聚焦复色.",
      align: "stretch",
      code: `<LogoWall {...data} />\n\n// data\n${json(LOGO_WALL_GRID)}`,
      render: () => (
        <Skinned skin={SKIN.default}>
          <LogoWall {...LOGO_WALL_GRID} />
        </Skinned>
      ),
    },
    {
      id: "cta",
      title: "CtaBanner 行动条",
      align: "stretch",
      code: `<CtaBanner {...data} />\n\n// data\n${json(CTA_BOXED)}`,
      render: () => (
        <Skinned skin={SKIN.default}>
          <CtaBanner {...CTA_BOXED} />
        </Skinned>
      ),
    },
    {
      id: "newsletter",
      title: "Newsletter 邮件订阅",
      desc: "idle, submitting, success, error 四态, 提示写进 role=\"status\". 邮箱里带 fail 演示失败态.",
      align: "stretch",
      code: `<Newsletter {...data} onSubmit={subscribe} />\n\n// data\n${json(NEWSLETTER_DATA)}`,
      render: () => (
        <Skinned skin={SKIN.default}>
          <Newsletter {...NEWSLETTER_DATA} onSubmit={fakeSubscribe} />
        </Skinned>
      ),
    },
  ],
};

// ── 设置页模板 ──────────────────────────────────────────────────────
const SETTINGS_CODE = `import {
  Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  SettingRow, SettingSection, Switch,
} from "@hx/ui";

export function SettingsPage() {
  return (
    <div className="mx-auto flex max-w-[880px] flex-col gap-4 p-6">
      <SettingSection section={{ id: "general", title: "通用" }} description="影响整个应用的偏好">
        <SettingRow title="界面语言" description="菜单与通知使用的语言">
          <Select defaultValue="zh">
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="zh">简体中文</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
        <SettingRow title="开机自启" description="登录系统后在后台启动">
          <Switch defaultChecked />
        </SettingRow>
      </SettingSection>
      <SettingSection section={{ id: "notify", title: "通知" }} description="哪些事件需要提醒">
        <SettingRow title="任务完成" description="耗时超过 10 秒的任务结束时提醒">
          <Switch defaultChecked />
        </SettingRow>
        <SettingRow title="自定义 Webhook" description="以 POST 形式发到你的服务">
          <Input placeholder="https://your-server.test/hook" className="w-64" />
        </SettingRow>
      </SettingSection>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm">取消</Button>
        <Button variant="primary" size="sm">保存</Button>
      </div>
    </div>
  );
}`;

function SettingsDemo({ danger }: { readonly danger: boolean }) {
  return (
    <div className="mx-auto flex max-w-[880px] flex-col gap-4 p-6">
      <SettingSection section={{ id: "general", title: "通用" }} description="影响整个应用的偏好">
        <SettingRow title="界面语言" description="菜单与通知使用的语言">
          <Select defaultValue="zh">
            <SelectTrigger className="w-36" aria-label="界面语言">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="zh">简体中文</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
        <SettingRow title="开机自启" description="登录系统后在后台启动">
          <Switch defaultChecked aria-label="开机自启" />
        </SettingRow>
        <SettingRow title="密度" description="列表与表单的间距">
          <SegmentedControl items={[{ key: "compact", label: "紧凑" }, { key: "normal", label: "标准" }]} value="normal" onChange={() => undefined} />
        </SettingRow>
      </SettingSection>
      <SettingSection section={{ id: "notify", title: "通知" }} description="哪些事件需要提醒">
        <SettingRow title="任务完成" description="耗时超过 10 秒的任务结束时提醒">
          <Switch defaultChecked aria-label="任务完成" />
        </SettingRow>
        <SettingRow title="自定义 Webhook" description="以 POST 形式发到你的服务">
          <Input placeholder="https://your-server.test/hook" className="w-64" aria-label="自定义 Webhook" />
        </SettingRow>
      </SettingSection>
      {danger ? (
        <SettingSection section={{ id: "danger", title: "危险操作" }} description="不可撤销, 放在最后一组">
          <SettingRow title="删除账号" description="账号与全部数据会被永久删除">
            <Button variant="destructive" size="sm">删除账号</Button>
          </SettingRow>
        </SettingSection>
      ) : null}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm">取消</Button>
        <Button variant="primary" size="sm">保存</Button>
      </div>
    </div>
  );
}

const TEMPLATE_SETTINGS: PageSpec = {
  id: "templates-settings",
  kind: "block",
  importName: "SettingSection",
  parts: ["SettingRow"],
  source: "src/layout/SettingChrome.tsx",
  raw: settingRaw,
  deps: [],
  height: 600,
  controls: [
    select("skin", "皮肤", SKINS, SKIN.default, "", "整页包裹层的 data-skin."),
    select("density", "密度", DENSITIES, DENSITY.comfortable, "", "整页包裹层的 data-density: 紧凑, 舒适, 宽松."),
    toggle("danger", "危险操作组", true, "最后一组放不可撤销的操作, 按钮用 destructive."),
  ],
  propDesc: {
    section: "分组元信息: id 与标题, id 也是锚点.",
    title: "分组标题; 给了就覆盖 section.title.",
    description: "标题下的一行说明.",
    children: "这一组的 SettingRow.",
    t: "文案翻译函数, 多语言时传.",
    "SettingRow.title": "设置项名称.",
    "SettingRow.description": "名称下的一行说明.",
    "SettingRow.children": "右侧的控件.",
    border: "行与行之间的分隔线.",
  },
  propsNote: "整页由 SettingSection 与 SettingRow 拼成, 控件随便放; 复制用法代码进 src/pages/SettingsPage.tsx, 按需增删行.",
  toProps: (values) => ({ ...values }),
  render: (props) => (
    <Skinned skin={props.skin} density={props.density}>
      <SettingsDemo danger={Boolean(props.danger)} />
    </Skinned>
  ),
  usage: () => SETTINGS_CODE,
};

export const BLOCK_PAGES: readonly PageSpec[] = [BLOCKS_HERO, TEMPLATE_SETTINGS];
