import { useState, type JSX } from "react";
import { CopyIcon, FileTextIcon, RefreshCwIcon, SparklesIcon, XIcon } from "lucide-react";
import { ALIGN, Attachment, AttachmentAction, AttachmentActions, AttachmentContent, AttachmentDescription, AttachmentGroup, AttachmentMedia, AttachmentTitle, Avatar, AvatarFallback, BUTTON_TYPE, Bubble, BubbleCollapsible, BubbleContent, BubbleGroup, BubbleReactions, Button, DOC, DOC_SAMPLE, Marker, MarkerContent, MarkerIcon, Message, MessageAvatar, MessageContent, MessageFooter, MessageHeader, SIZE, TASK_STATUS, TONE_VARIANT, VARIANT } from "@hx/ui";
import { Callout, H2, P, Preview } from "../../components/DocKit";
import { Props, Usage } from "../../components/DocSpec";

/** 会话组合件文档页 (一): Attachment, Bubble, Marker, Message. */
export function AttachmentPage(): JSX.Element {
  const [progress, setProgress] = useState<number>(DOC_SAMPLE.progress);
  return (
    <>
      <P>文件 / 图片附件: 缩略图或图标, 文件名, 大小或状态, 操作. uploading 时底部出现进度条 (不传 progress 为不定长), error 时边框与说明转危险色. 进场时缩放淡入.</P>
      <Usage names={["Attachment", "AttachmentMedia", "AttachmentContent", "AttachmentTitle", "AttachmentDescription", "AttachmentActions", "AttachmentAction", "AttachmentGroup"]} />
      <H2>示例</H2>
      <Preview code={`<AttachmentGroup>
  <Attachment>
    <AttachmentMedia><FileTextIcon /></AttachmentMedia>
    <AttachmentContent>
      <AttachmentTitle>设计稿.pdf</AttachmentTitle>
      <AttachmentDescription>2.4 MB</AttachmentDescription>
    </AttachmentContent>
    <AttachmentActions>
      <AttachmentAction asChild><Button size={SIZE.iconXs} variant="ghost" aria-label="移除"><XIcon /></Button></AttachmentAction>
    </AttachmentActions>
  </Attachment>
  <Attachment state="uploading" progress={42}>...</Attachment>
  <Attachment state={TASK_STATUS.error}>...</Attachment>
</AttachmentGroup>`}>
        <AttachmentGroup>
          <Attachment>
            <AttachmentMedia><FileTextIcon /></AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>设计稿.pdf</AttachmentTitle>
              <AttachmentDescription>2.4 MB</AttachmentDescription>
            </AttachmentContent>
            <AttachmentActions>
              <AttachmentAction asChild>
                <Button size={SIZE.iconXs} variant={VARIANT.ghost} aria-label="移除"><XIcon /></Button>
              </AttachmentAction>
            </AttachmentActions>
          </Attachment>
          <Attachment state="uploading" progress={progress}>
            <AttachmentMedia />
            <AttachmentContent>
              <AttachmentTitle>日志.zip</AttachmentTitle>
              <AttachmentDescription>上传中 {Math.min(progress, DOC_SAMPLE.full)}%</AttachmentDescription>
            </AttachmentContent>
            <AttachmentActions>
              <AttachmentAction asChild>
                <Button size={SIZE.xs} variant={VARIANT.ghost} onClick={() => setProgress((value) => (value >= DOC_SAMPLE.full ? 0 : value + DOC_SAMPLE.progressStep))}>
                  推进
                </Button>
              </AttachmentAction>
            </AttachmentActions>
          </Attachment>
          <Attachment state={TASK_STATUS.error}>
            <AttachmentMedia />
            <AttachmentContent>
              <AttachmentTitle>超大视频.mov</AttachmentTitle>
              <AttachmentDescription>超过 100 MB 上限</AttachmentDescription>
            </AttachmentContent>
            <AttachmentActions>
              <AttachmentAction asChild>
                <Button size={SIZE.iconXs} variant={VARIANT.ghost} aria-label="重试"><RefreshCwIcon /></Button>
              </AttachmentAction>
            </AttachmentActions>
          </Attachment>
        </AttachmentGroup>
      </Preview>
      <H2>属性</H2>
      <Props spec={`
state ~ "idle" | "uploading" | "done" | "error" ~ "idle" ~ 上传状态
progress ~ number ~ - ~ 0 到 100; uploading 时不传即为不定长进度
size ~ "default" | "sm" ~ "default" ~ 卡片宽度与内边距
`} />
    </>
  );
}

export function BubblePage(): JSX.Element {
  return (
    <>
      <P>消息气泡. variant 决定底色: default 灰底, primary 蓝底 (我方), outline 只描边, ghost 无底 (助手长文). align 决定贴角与靠边. 超长内容用 BubbleCollapsible 收起, 底部渐隐.</P>
      <Usage names={["Bubble", "BubbleContent", "BubbleGroup", "BubbleReactions", "BubbleCollapsible"]} />
      <H2>示例</H2>
      <Preview code={`<Bubble>帮我把按钮换成 Dark Dimmed 配色。</Bubble>
<Bubble variant="primary" align="end">好的, 已经改好了。</Bubble>
<BubbleGroup>
  <Bubble variant="outline">第一条</Bubble>
  <Bubble variant="outline">连续的第二条</Bubble>
</BubbleGroup>`}>
        <div className={DOC.stackMd}>
          <Bubble>帮我把按钮换成 Dark Dimmed 配色.</Bubble>
          <Bubble variant={VARIANT.primary} align={ALIGN.end}>好的, 已经改好了, 顺便补上了水波纹.</Bubble>
          <div className="flex flex-col">
            <Bubble variant={TONE_VARIANT.outline}>这条有回应</Bubble>
            <BubbleReactions>
              <button type={BUTTON_TYPE} aria-label="赞">+1</button>
              <button type={BUTTON_TYPE} aria-label="收到">OK</button>
            </BubbleReactions>
          </div>
          <BubbleGroup>
            <Bubble variant={TONE_VARIANT.outline}>第一条</Bubble>
            <Bubble variant={TONE_VARIANT.outline}>连续的第二条, 贴角只在第一条</Bubble>
          </BubbleGroup>
          <Bubble variant={VARIANT.ghost}>
            <BubbleCollapsible collapsedHeight={DOC_SAMPLE.collapsedHeight}>
              <BubbleContent>
                <p>这是一段很长的助手回复. 收起时只显示前几行, 底部渐隐提示还有内容.</p>
                <p>展开后高度过渡到完整内容. 适合长日志, 长代码说明与工具输出.</p>
                <p>第三段: 收起按钮的箭头会旋转, 与 Accordion 的反馈一致.</p>
              </BubbleContent>
            </BubbleCollapsible>
          </Bubble>
        </div>
      </Preview>
      <H2>属性</H2>
      <Props spec={`
variant ~ "default" | "primary" | "outline" | "ghost" ~ "default" ~ 底色
align ~ "start" | "end" ~ "start" ~ 贴角与靠边
BubbleCollapsible.collapsedHeight ~ number ~ 120 ~ 收起高度 (px)
`} />
    </>
  );
}

export function MarkerPage(): JSX.Element {
  return (
    <>
      <P>会话里的行内标记: 系统提示, 状态行, 带边框的说明, 或带文字的分隔线 (例如日期). tone 用语义状态色; shimmer 让文字带一道扫光, 用于 "正在思考" 这类进行中状态.</P>
      <Usage names={["Marker", "MarkerIcon", "MarkerContent"]} />
      <H2>示例</H2>
      <Preview code={`<Marker variant="separator"><MarkerContent>今天</MarkerContent></Marker>
<Marker shimmer>
  <MarkerIcon><SparklesIcon /></MarkerIcon>
  <MarkerContent>正在思考...</MarkerContent>
</Marker>
<Marker variant="border" tone="warning"><MarkerContent>上下文即将用完</MarkerContent></Marker>`}>
        <div className={DOC.stackMd}>
          <Marker variant={TONE_VARIANT.separator}><MarkerContent>今天</MarkerContent></Marker>
          <Marker shimmer>
            <MarkerIcon><SparklesIcon /></MarkerIcon>
            <MarkerContent>正在思考...</MarkerContent>
          </Marker>
          <Marker tone={TONE_VARIANT.success}><MarkerContent>已连接到 hx-browser</MarkerContent></Marker>
          <Marker variant={TONE_VARIANT.border} tone={VARIANT.warning}><MarkerContent>上下文即将用完, 较早的消息会被压缩</MarkerContent></Marker>
        </div>
      </Preview>
      <H2>属性</H2>
      <Props spec={`
variant ~ "default" | "border" | "separator" ~ "default" ~ 外观
tone ~ "default" | "success" | "warning" | "danger" | "info" ~ "default" ~ 语义色
shimmer ~ boolean ~ false ~ 文字扫光; 减弱动效时不动
`} />
    </>
  );
}

export function MessagePage(): JSX.Element {
  return (
    <>
      <P>
        一条会话消息: 头像, 头部 (名字 / 时间), 正文, 底部 (操作 / 状态). align=end 时整条靠右并镜像排列. 每条新消息进场时上浮淡入, 底部操作在悬停时浮现.
        只要开箱即用的流式会话面板时用 ChatStream.
      </P>
      <Usage names={["Message", "MessageAvatar", "MessageHeader", "MessageContent", "MessageFooter", "MessageGroup"]} />
      <H2>示例</H2>
      <Preview code={`<Message>
  <MessageAvatar><Avatar><AvatarFallback>AI</AvatarFallback></Avatar></MessageAvatar>
  <MessageContent>
    <MessageHeader><strong>Hark</strong><span>11:27</span></MessageHeader>
    <Bubble>PR 已经开好了。</Bubble>
    <MessageFooter>...</MessageFooter>
  </MessageContent>
</Message>
<Message align="end">...</Message>`}>
        <div className="flex w-full max-w-lg flex-col gap-4">
          <Message align={ALIGN.end}>
            <MessageAvatar><Avatar><AvatarFallback>我</AvatarFallback></Avatar></MessageAvatar>
            <MessageContent>
              <MessageHeader><strong>辉萝莉</strong><span>11:26</span></MessageHeader>
              <Bubble variant={VARIANT.primary} align={ALIGN.end}>帮我对标 shadcn 的全部组件.</Bubble>
            </MessageContent>
          </Message>
          <Message>
            <MessageAvatar><Avatar><AvatarFallback>AI</AvatarFallback></Avatar></MessageAvatar>
            <MessageContent>
              <MessageHeader><strong>Agent</strong><span>11:27</span></MessageHeader>
              <Bubble>PR 已经开好了, 文档站也能部署到 GitHub Pages.</Bubble>
              <MessageFooter>
                <Button size={SIZE.iconXs} variant={VARIANT.ghost} aria-label={DOC.copy}><CopyIcon /></Button>
                <Button size={SIZE.iconXs} variant={VARIANT.ghost} aria-label="重新生成"><RefreshCwIcon /></Button>
              </MessageFooter>
            </MessageContent>
          </Message>
        </div>
      </Preview>
      <Callout title="组合方式">Message 管排版, Bubble 管正文外观, Attachment 放附件, Marker 放系统提示; 长会话外面套 MessageScroller.</Callout>
    </>
  );
}
