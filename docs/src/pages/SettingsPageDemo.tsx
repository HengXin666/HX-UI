import { useState, type JSX } from "react";
import {
  SettingsSidebarView,
  SettingSection,
  SettingRow,
  SettingHeading,
  Input,
  Switch,
  SegmentedControl,
  MotionSelect,
  Button,
  type SettingsSidebarTabItem,
} from "@hx/ui";
import { H2, P } from "../components/DocKit";

/**
 * 完整设置页 —— 照 open-vetta 的三级布局做。
 *
 * 结构 (从左到右):
 *   主侧栏 240px  |  设置二级栏 200px  |  内容区
 *   二级栏右侧有一条**浮着的 1px 竖线**, 底部留 44px 不到底。
 *
 * 这里没有用"页签"导航 —— 上游是靠左栏定位的, 顶部不重复一套页签。
 */

const TABS: SettingsSidebarTabItem[] = [
  { key: "general", label: "通用设置", icon: "icon-[solar--settings-linear]" },
  { key: "remote", label: "远程连接", icon: "icon-[solar--monitor-linear]" },
  { key: "appearance", label: "外观", icon: "icon-[solar--palette-linear]" },
  { key: "agent", label: "Agent配置", icon: "icon-[solar--user-circle-linear]" },
  { key: "model", label: "模型配置", icon: "icon-[solar--cpu-bolt-linear]" },
  { key: "ssh", label: "SSH 主机", icon: "icon-[solar--server-square-linear]" },
  { key: "notify", label: "消息推送", icon: "icon-[solar--bell-linear]" },
  { key: "archived", label: "已归档", icon: "icon-[solar--archive-minimalistic-outline]" },
  { key: "shortcut", label: "快捷键", icon: "icon-[solar--keyboard-linear]" },
  { key: "env", label: "应用环境", icon: "icon-[solar--code-square-linear]" },
  { key: "vivi", label: "Vetta Vivi", icon: "icon-[solar--magic-stick-2-linear]" },
];

const MAIN_NAV = [
  { key: "new", label: "新会话", icon: "icon-[solar--chat-round-line-linear]" },
  { key: "agents", label: "智能体", icon: "icon-[solar--user-circle-linear]" },
  { key: "abilities", label: "能力", icon: "icon-[solar--widget-2-linear]" },
  { key: "design", label: "设计", icon: "icon-[solar--layers-linear]" },
  { key: "settings", label: "设置", icon: "icon-[solar--settings-linear]" },
];

function GeneralPanel(): JSX.Element {
  const [notify, setNotify] = useState(true);
  const [proxy, setProxy] = useState(false);
  const const1 = 1; void const1;

  return (
    <>
      <h2 className="text-[20px] font-bold text-foreground">常规</h2>

      <div className="mt-6">
        <SettingSection section={{ id: "basic" }} title="基础">
          <SettingRow title="工作区" description="新建项目时将在此目录下创建对应的项目文件夹">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                className="flex h-8 w-64 items-center gap-2 rounded-lg border border-border bg-card px-2.5 text-[12px] text-foreground transition-colors hover:bg-accent"
              >
                <span className="icon-[solar--folder-linear] size-4 shrink-0 text-muted-foreground" />
                <span className="truncate">/home/user/workspace</span>
                <span className="icon-[solar--alt-arrow-down-linear] ml-auto size-4 shrink-0 text-muted-foreground" />
              </button>
              <button type="button" aria-label="重载" className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                <span className="icon-[solar--refresh-linear] size-4" />
              </button>
            </div>
          </SettingRow>

          <SettingRow title="默认沙盒状态" description="新建会话未单独设置时使用的工具访问范围; 不会改变已打开会话">
            <MotionSelect
              value="full"
              onValueChange={() => {}}
              options={[{ value: "full", label: "完全访问" }, { value: "limited", label: "受限" }, { value: "none", label: "只读" }]}
              triggerClassName="w-40"
            />
          </SettingRow>

          <SettingRow title="系统通知" description="agent 完成一轮回答时发系统通知; 你正在前台查看该会话时不打扰" border={false}>
            <Switch checked={notify} onCheckedChange={setNotify} />
          </SettingRow>
        </SettingSection>
      </div>

      <div className="mt-6">
        <SettingSection section={{ id: "proxy" }} title="网络代理">
          <SettingRow title="启用应用代理" description="开启后, 模型请求、本地命令与下载默认经该代理出网; 本机地址 (localhost / 127.0.0.1) 始终直连。" border={false}>
            <Switch checked={proxy} onCheckedChange={setProxy} />
          </SettingRow>
        </SettingSection>
      </div>

      <div className="mt-6">
        <SettingSection section={{ id: "app" }} title="应用">
          <SettingRow title="当前版本" description="当前已是最新版本 (0.1.0)">
            <Button variant="outline" size="sm">
              <span className="icon-[solar--refresh-linear] size-3.5" />
              检查更新
            </Button>
          </SettingRow>
          <SettingRow title="App 引导" description="重新打开首次进入时的引导流程 (语言与外观、权限等)" border={false}>
            <Button variant="outline" size="sm">启动 App 引导</Button>
          </SettingRow>
        </SettingSection>
      </div>
    </>
  );
}

function AppearancePanel(): JSX.Element {
  const [mode, setMode] = useState("dark");
  const [density, setDensity] = useState("comfortable");

  return (
    <>
      <h2 className="text-[20px] font-bold text-foreground">外观</h2>
      <p className="mt-1.5 mb-6 text-[12px] text-muted-foreground">默认跟随系统; 可固定为浅色或深色, 立即生效。</p>

      <SettingHeading section={{ id: "mode" }} title="外观模式" className="mb-3" />
      <div className="mb-6 grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
        {[
          { key: "light", label: "浅色", hint: "始终使用浅色界面", icon: "icon-[solar--sun-linear]" },
          { key: "dark", label: "深色", hint: "始终使用深色界面", icon: "icon-[solar--moon-linear]" },
          { key: "auto", label: "跟随系统", hint: "随系统外观自动切换", icon: "icon-[solar--monitor-linear]" },
        ].map((m) => {
          const active = mode === m.key;
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => setMode(m.key)}
              className={
                "group relative flex items-center gap-2.5 rounded-lg border bg-card px-3 py-2 text-left transition-colors " +
                (active ? "border-primary/50 bg-primary/10" : "border-border/60 hover:border-primary/40 hover:bg-accent/40")
              }
            >
              <span className={(active ? "text-primary " : "text-muted-foreground ") + m.icon + " size-4 shrink-0"} />
              <div className="min-w-0 flex-1 pr-5">
                <div className="text-[12px] font-medium text-foreground">{m.label}</div>
                <div className="truncate text-[11px] text-muted-foreground">{m.hint}</div>
              </div>
              {active && (
                <span className="absolute right-2 top-2 grid size-5 place-items-center rounded-full bg-background/85 shadow-sm backdrop-blur-sm">
                  <span className="icon-[solar--check-circle-linear] size-3.5 text-primary" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <SettingSection section={{ id: "density" }} title="密度">
        <SettingRow title="界面密度" description="影响列表行高与卡片间距" border={false}>
          <SegmentedControl
            items={[{ key: "compact", label: "紧凑" }, { key: "comfortable", label: "标准" }, { key: "loose", label: "宽松" }]}
            value={density}
            onChange={setDensity}
          />
        </SettingRow>
      </SettingSection>
    </>
  );
}

function StubPanel({ title }: { title: string }): JSX.Element {
  return (
    <>
      <h2 className="text-[20px] font-bold text-foreground">{title}</h2>
      <p className="mt-1.5 mb-6 text-[12px] text-muted-foreground">这一页只是把三级布局演示出来, 内容留空。</p>
      <div className="rounded-xl border border-dashed border-border/60 bg-card/20 p-10 text-center text-[12.5px] text-muted-foreground">
        内容区 (版心 680px 居中)
      </div>
    </>
  );
}

export function SettingsPageDemo(): JSX.Element {
  const [tab, setTab] = useState("general");

  return (
    <>
      <P>
        这是照 open-vetta 复刻的完整设置页。三级布局: 主侧栏 240px、设置二级栏 200px、内容区版心 680px 居中。
        二级栏右侧那条竖线是**独立绝对定位的 1px 元素**, 底部留 44px 不到底。
      </P>

      <H2>预览</H2>
      <P>
        下面的实例按真实窗口比例渲染。三级布局需要足够宽度: 240 (主侧栏) + 200 (设置栏) + 680 (版心), 再加两侧留白,
        所以画布固定 1440px —— 这是这套布局的固有宽度需求, 不是排版失误。
        文档正文只有 860px, 所以它在这里会被右边缘裁掉一点; 想看完整效果把浏览器窗口拉宽即可。
      </P>
      <div className="overflow-hidden rounded-xl border border-border" style={{ height: 720 }}>
      <div className="overflow-hidden" style={{ height: 720, width: 1440 }}>
        <div className="relative isolate flex h-full w-full flex-col overflow-hidden bg-background">
          <div className="relative z-10 flex min-h-0 flex-1 gap-2 p-2">
            {/* ── 一级: 主侧栏 ── */}
            <aside className="flex w-60 shrink-0 flex-col overflow-hidden rounded-xl border border-border/40 bg-card/25">
              <div className="h-11 shrink-0" />
              <div className="flex min-h-0 flex-1 flex-col gap-3 px-2.5 pb-2.5">
                <nav className="flex flex-col gap-0.5">
                  {MAIN_NAV.map((n) => (
                    <button
                      key={n.key}
                      type="button"
                      className={
                        "relative flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors " +
                        (n.key === "settings"
                          ? "bg-primary/10 font-semibold text-foreground ring-1 ring-inset ring-primary/30"
                          : "text-foreground hover:bg-accent/50")
                      }
                    >
                      <span className={(n.key === "settings" ? "text-primary " : "text-muted-foreground ") + n.icon + " size-4 shrink-0"} />
                      <span className="min-w-0 flex-1 truncate">{n.label}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </aside>

            {/* ── 二级 + 三级: 设置区 ── */}
            <div className="relative flex min-w-0 flex-1 overflow-hidden rounded-xl border border-border/40">
              {/* 浮着的分隔线: 底部留 44px 不到底 */}
              <div className="pointer-events-none absolute top-0 bottom-11 left-[200px] w-px bg-border" />

              <SettingsSidebarView
                activeTab={tab}
                activeChildKey={undefined}
                betaBadgeLabel="BETA"
                narrow={false}
                onSelectTab={setTab}
                tabs={TABS}
                title="设置"
              />

              <div className="min-w-0 flex-1 overflow-y-auto">
                <div className="mx-auto w-full max-w-[680px] px-8 pt-2 pb-4">
                  {tab === "general" ? <GeneralPanel /> : null}
                  {tab === "appearance" ? <AppearancePanel /> : null}
                  {tab !== "general" && tab !== "appearance" ? (
                    <StubPanel title={TABS.find((t) => t.key === tab)?.label ?? ""} />
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>

      <P>左栏可点, 「通用设置」与「外观」两页有完整内容, 其余只留版心占位。</P>
    </>
  );
}
