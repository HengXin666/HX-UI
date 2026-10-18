import { useState, type JSX } from "react";
import { CircleAlertIcon, FolderOpenIcon, InfoIcon, TriangleAlertIcon } from "lucide-react";
import { ALIGN, Alert, AlertDescription, AlertTitle, Button, DOC_SAMPLE, Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyState, EmptyTitle, Pagination, TASK_STATUS, TONE_VARIANT, TypographyBlockquote, TypographyH1, TypographyH2, TypographyH3, TypographyInlineCode, TypographyLead, TypographyList, TypographyMuted, TypographyP, UI_CLASSES, VARIANT } from "@hx/ui";
import { Callout, H2, P, Preview } from "../../components/DocKit";
import { Props, Usage } from "../../components/DocSpec";

/** 提示条, 分页, 排版与空状态的文档页. */
export function AlertPage(): JSX.Element {
  return (
    <>
      <P>提示条. 五种语义: default / info / success / warning / danger. warning 与 danger 用 role=alert 让读屏立即播报. 有图标时自动切成双列.</P>
      <Usage names={["Alert", "AlertTitle", "AlertDescription"]} />
      <H2>示例</H2>
      <Preview
        code={`<Alert variant="info">
  <InfoIcon />
  <AlertTitle>新版本可用</AlertTitle>
  <AlertDescription>刷新页面即可加载最新组件。</AlertDescription>
</Alert>`}
      >
        <div className="grid w-full gap-3">
          <Alert variant={TONE_VARIANT.info}>
            <InfoIcon />
            <AlertTitle>新版本可用</AlertTitle>
            <AlertDescription>刷新页面即可加载最新组件.</AlertDescription>
          </Alert>
          <Alert variant={VARIANT.warning}>
            <TriangleAlertIcon />
            <AlertTitle>配额即将用完</AlertTitle>
            <AlertDescription>本月已使用 92%, 超出后请求会被限流.</AlertDescription>
          </Alert>
          <Alert variant={VARIANT.danger}>
            <CircleAlertIcon />
            <AlertTitle>部署失败</AlertTitle>
            <AlertDescription>构建步骤退出码 1, 查看日志定位问题.</AlertDescription>
          </Alert>
        </div>
      </Preview>
      <H2>属性</H2>
      <Props spec={`
variant ~ "default" | "info" | "success" | "warning" | "danger" ~ "default" ~ 语义色与播报方式
`} />
    </>
  );
}

export function PaginationPage(): JSX.Element {
  const [page, setPage] = useState<number>(DOC_SAMPLE.page);
  return (
    <>
      <P>分页器: 上一页 / 页码 / 下一页. 页码序列长度恒定, 翻页时整排不左右跳; 当前页是 primary 实底并带 aria-current.</P>
      <Usage names={["Pagination"]} />
      <H2>示例</H2>
      <Preview align={ALIGN.center} code={`const [page, setPage] = useState<number>(DOC_SAMPLE.page);
<Pagination page={page} pageCount={DOC_SAMPLE.pageCount} onPageChange={setPage} />`}>
        <Pagination page={page} pageCount={DOC_SAMPLE.pageCount} onPageChange={setPage} />
      </Preview>
      <H2>属性</H2>
      <Props spec={`
page ~ number ~ - ~ 当前页, 从 1 开始
pageCount ~ number ~ - ~ 总页数, 为 0 时不显示页码
onPageChange ~ (page: number) => void ~ - ~ 翻页回调
siblings ~ number ~ 1 ~ 当前页两侧显示的页数
labels ~ Partial<PaginationLabels> ~ - ~ 覆盖默认文案
`} />
    </>
  );
}

export function TypographyPage(): JSX.Element {
  return (
    <>
      <P>shadcn 的 Typography 只是一组类名示例, 这里做成组件, 字号与颜色全部来自令牌: 标题用 heading, 正文用 foreground, 次要文字用 muted-foreground.</P>
      <Usage names={["TypographyH1", "TypographyH2", "TypographyP", "TypographyBlockquote", "TypographyList", "TypographyInlineCode", "TypographyLead", "TypographyMuted"]} />
      <H2>示例</H2>
      <Preview code={`<TypographyH1>把组件交给 AI</TypographyH1>
<TypographyLead>一套给自己项目用的组件库。</TypographyLead>
<TypographyH2>为什么</TypographyH2>
<TypographyP>...</TypographyP>
<TypographyBlockquote>...</TypographyBlockquote>
<TypographyList><li>...</li></TypographyList>`}>
        <div className="w-full max-w-prose">
          <TypographyH1>把组件交给 AI</TypographyH1>
          <TypographyLead>一套只服务自己项目的组件库, 美观, 有动效, 简单好用.</TypographyLead>
          <TypographyH2 className="mt-8">为什么</TypographyH2>
          <TypographyP>下游项目需要界面时先查 HX-UI; 没有就提组件需求, 而不是在下游手搓 <TypographyInlineCode>button</TypographyInlineCode>.</TypographyP>
          <TypographyBlockquote>同一个控件只能有一个来源.</TypographyBlockquote>
          <TypographyH3 className="mt-7">三层</TypographyH3>
          <TypographyList>
            <li>后台数据控件</li>
            <li>蓝图与配置界面</li>
            <li>Agent 会话界面</li>
          </TypographyList>
          <TypographyMuted>最后更新于 2026-10-18.</TypographyMuted>
        </div>
      </Preview>
    </>
  );
}

export function EmptyPage(): JSX.Element {
  return (
    <>
      <P>
        组合式空状态: 自定义图标, 标题, 说明与操作. 内容整体淡入上浮. 只需要按 kind (empty / error / loading / denied) 出固定文案时, 用 EmptyState 更省事 (见 HX 扩展里的 EmptyState 页).
      </P>
      <Usage names={["Empty", "EmptyHeader", "EmptyMedia", "EmptyTitle", "EmptyDescription", "EmptyContent"]} />
      <H2>示例</H2>
      <Preview code={`<Empty className="border">
  <EmptyHeader>
    <EmptyMedia variant="icon"><FolderOpenIcon /></EmptyMedia>
    <EmptyTitle>还没有项目</EmptyTitle>
    <EmptyDescription>创建第一个项目, 或从模板导入。</EmptyDescription>
  </EmptyHeader>
  <EmptyContent>
    <Button variant="primary">新建项目</Button>
  </EmptyContent>
</Empty>`}>
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant={VARIANT.icon}>
              <FolderOpenIcon />
            </EmptyMedia>
            <EmptyTitle>还没有项目</EmptyTitle>
            <EmptyDescription>创建第一个项目, 或从模板导入.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <div className={UI_CLASSES.row}>
              <Button variant={VARIANT.primary}>新建项目</Button>
              <Button>导入</Button>
            </div>
          </EmptyContent>
        </Empty>
      </Preview>
      <H2>快捷写法: EmptyState</H2>
      <Preview code={`<EmptyState kind={TASK_STATUS.error} />`}>
        <EmptyState kind={TASK_STATUS.error} />
      </Preview>
      <Callout title="与 EmptyState 的分工">组合式 Empty 用于自定义排版; EmptyState 用于列表与表格的固定四态 (empty / error / loading / denied), 二者可以同时存在.</Callout>
    </>
  );
}
