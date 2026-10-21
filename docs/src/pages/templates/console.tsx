import type { JSX } from "react";
import { Badge, Button, LogViewer, Stepper, VARIANT, type LogLine } from "@hx/ui";
import { H2, P, Preview } from "../../components/DocKit";
import { ApplySteps, TemplateFiles, TemplateFrame } from "../../components/TemplateKit";

const STEPS = [
  { id: "pull", title: "拉取镜像", description: "60.2 MB" },
  { id: "build", title: "构建配置", description: "2 个服务" },
  { id: "up", title: "启动容器", description: "进行中" },
  { id: "check", title: "健康检查" },
];

const LOGS: readonly LogLine[] = [
  { id: "1", level: "info", message: "pulling image ghcr.io/acme/gateway:1.4.2", time: "10:02:11" },
  { id: "2", level: "success", message: "image pulled (60.2 MB)", time: "10:02:19" },
  { id: "3", level: "warn", message: "upstream search-index 响应偏慢, 已切到降级策略", time: "10:02:24" },
  { id: "4", level: "error", message: "container gateway-2 启动失败: port 8081 已被占用", time: "10:02:31", detail: "exit code 1" },
];

const CODE = `import { LogViewer, Stepper } from "@hx/ui";

export function DeployConsole() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <Stepper steps={steps} current={current} orientation="horizontal" />
      <LogViewer lines={logs} height={320} />
    </div>
  );
}`;

/** 部署 / 运维控制台模板: 步骤条 + 日志框 + 操作按钮. */
export function TemplateConsolePage(): JSX.Element {
  return (
    <>
      <P>整页骨架: 顶部步骤条反映部署进度, 中间日志框按级别过滤并贴底跟随, 底部放危险操作。日志行自带时间与级别色, 不需要你再套一层表格。</P>
      <ApplySteps steps={[
        "安装 @hx/ui 并引入样式入口",
        "复制下面这段进 src/pages/DeployConsole.tsx, logs 换成你的 SSE 或 WS 流",
        "推进步骤只改 current, 失败的那一步用 steps[i].status 显式覆盖",
      ]} />
      <H2>整页预览</H2>
      <TemplateFrame height={430}>
        <div className="flex h-full flex-col gap-4 overflow-y-auto p-5">
          <div className="flex items-center justify-between">
            <Stepper steps={STEPS} current={2} />
            <Button size={VARIANT.sm} variant="destructive">停止</Button>
          </div>
          <LogViewer lines={LOGS} height="min(320px, 46vh)" />
          <div className="flex items-center gap-2 rounded-lg border border-border p-3">
            <Badge variant="warning">1 个告警</Badge>
            <span className="min-w-0 flex-1 truncate text-[12.5px] text-muted-foreground">
              search-index 延迟升高, 已启用降级策略, 无需人工介入
            </span>
            <Button size={VARIANT.sm} variant={VARIANT.ghost}>查看详情</Button>
          </div>
        </div>
      </TemplateFrame>
      <H2>完整代码</H2>
      <TemplateFiles files={["src/pages/DeployConsole.tsx"]} />
      <Preview code={CODE} lang="tsx">
        <div className="text-[12.5px] text-muted-foreground">这段就是上面的结构, 组件顺序与间距保持原样。</div>
      </Preview>
    </>
  );
}
