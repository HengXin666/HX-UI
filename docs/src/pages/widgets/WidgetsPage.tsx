import { useState, type JSX } from "react";
import { Callout, Code, H2, H3, P, Preview, PropsTable } from "../../components/DocKit";
import { ColorSwatch, FileDropzone, Rating, TagInput, Timeline, TimelineItem, type FileRejection } from "../../../../src/widgets";
import { ALIGN, TONE_VARIANT, UI_CLASSES, VARIANT } from "../../../../src/constants";
import { WIDGET_DOCS, WIDGET_ICON, WIDGET_TONE } from "../../../../src/constants/widgets";
import { DEMO_TECH_STACK_LABEL } from "../../../../src/constants/docs-demos";

const D = WIDGET_DOCS;
const NOTE = UI_CLASSES.mutedSm;

/**
 * 富交互件文档页: 时间线, 评分, 拖放上传, 标签输入, 色块选择.
 * .agents/notes/implemented/feature/2026-11-01-rich-widgets.md
 */
export function WidgetsPage(): JSX.Element {
  const [score, setScore] = useState<number>(D.initialScore);
  const [tags, setTags] = useState<string[]>([...D.initialTags]);
  const [color, setColor] = useState<string>(WIDGET_TONE.primary);
  const [files, setFiles] = useState<File[]>([]);
  const [rejects, setRejects] = useState<FileRejection[]>([]);

  return (
    <>
      <P>
        五个富交互件都能只用键盘走完全流程: 每组只占一个 Tab 停靠点, 组内用方向键移动.
        颜色只来自语义令牌, 动效在系统开启减弱动效时自动收敛.
      </P>

      <H2>Timeline 时间线</H2>
      <P>
        有序列表语义. <Code>tone</Code> 决定圆点颜色, 传 <Code>icon</Code> 换成带浅底的图标,
        <Code>animated</Code> 打开自上而下的交错入场.
      </P>
      <Preview
        align={ALIGN.stretch}
        code={`<Timeline animated aria-label="部署记录">
  <TimelineItem tone="success" title="构建通过" time="10:02" description="用时 48 秒" />
  <TimelineItem tone="warning" title="灰度 10%" time="10:05" />
  <TimelineItem tone="danger" icon="icon-[solar--danger-circle-linear]" title="回滚" time="10:09" last />
</Timeline>`}
      >
        <Timeline animated label="部署记录" className="w-full max-w-md">
          <TimelineItem tone={WIDGET_TONE.primary} title="提交合并" time="09:58" description="main 分支 8ed4dea" />
          <TimelineItem tone={WIDGET_TONE.success} title="构建通过" time="10:02" description="用时 48 秒, 产物 1.2 MB" />
          <TimelineItem tone={WIDGET_TONE.warning} title="灰度 10%" time="10:05" description="错误率略高于基线" />
          <TimelineItem tone={WIDGET_TONE.danger} icon={WIDGET_ICON.error} title="自动回滚" time="10:09" last />
        </Timeline>
      </Preview>

      <H2>Rating 评分</H2>
      <P>
        <Code>role="radiogroup"</Code>, 每个分值是一个 radio. 方向键加减一档, Home / End 到两端,
        Backspace 清零; <Code>allowHalf</Code> 时一档是半星.
      </P>
      <Preview
        code={`const [score, setScore] = useState<number>(D.initialScore);

<Rating allowHalf value={score} onChange={setScore} label="服务评分" />
<Rating defaultValue={4} readOnly label="平均分" />`}
      >
        <Rating allowHalf value={score} onChange={setScore} label="服务评分" />
        <span className={NOTE}>当前 {score}</span>
        <Rating defaultValue={D.readOnlyScore} readOnly label="平均分" />
        <Rating defaultValue={D.disabledScore} disabled label="已禁用" />
      </Preview>

      <H2>FileDropzone 拖放上传</H2>
      <P>
        投放区是一个按钮: 拖入时带 <Code>data-dragging</Code> 高亮, 聚焦后 Enter 打开文件选择框.
        <Code>accept</Code> 与 <Code>maxSize</Code> 不合的文件逐条写出原因, 不会静默丢弃.
      </P>
      <Preview
        align={ALIGN.stretch}
        code={`<FileDropzone
  accept="image/*,.pdf"
  maxSize={2 * 1024 * 1024}
  maxFiles={5}
  onFilesChange={setFiles}
  onReject={(list) => console.warn(list)}
/>`}
      >
        <div className="flex w-full max-w-lg flex-col gap-2">
          <FileDropzone accept={D.accept} maxSize={D.maxUpload} maxFiles={D.maxFiles} onFilesChange={setFiles} onReject={setRejects} />
          <span className={NOTE}>
            已收 {files.length} 个, 最近一次拒收 {rejects.length} 个
          </span>
        </div>
      </Preview>

      <H2>TagInput 标签输入</H2>
      <P>
        回车或逗号建签, 粘贴 "a, b, c" 或多行文本一次拆成多个. 输入框为空时 Backspace 删最后一个;
        光标在最前按左方向键进入标签行, 左右移动, Backspace / Delete 删除当前签.
      </P>
      <Preview
        align={ALIGN.stretch}
        code={`const [tags, setTags] = useState(["react", "motion"]);

<TagInput value={tags} onChange={setTags} maxTags={D.maxTags} placeholder="添加技术栈" />`}
      >
        <div className="flex w-full max-w-lg flex-col gap-2">
          <TagInput value={tags} onChange={setTags} maxTags={D.maxTags} placeholder="添加技术栈" label={DEMO_TECH_STACK_LABEL} />
          <span className={NOTE}>{tags.join(D.tagJoin) || "空"}</span>
        </div>
      </Preview>

      <H2>ColorSwatch 色块选择</H2>
      <P>
        单选组, 方向键循环移动并选中, 跳过禁用项. 选中态是 1px 环加勾, 色弱用户也能分辨.
      </P>
      <Preview
        code={`<ColorSwatch
  label="标签颜色"
  value={color}
  onChange={setColor}
  options={[
    { value: "primary", label: "主色", color: "var(--primary)" },
    { value: "success", label: "成功", color: "var(--success)" },
  ]}
/>`}
      >
        <ColorSwatch label="标签颜色" options={D.swatches} value={color} onChange={setColor} />
        <ColorSwatch label="小号" size={VARIANT.sm} options={D.swatches} defaultValue={WIDGET_TONE.success} />
      </Preview>

      <Callout kind={TONE_VARIANT.info} title="受控与非受控">
        Rating, TagInput, ColorSwatch 都同时支持 <Code>value</Code> 与 <Code>defaultValue</Code>;
        FileDropzone 只收集与校验, 上传由调用方在 <Code>onFilesChange</Code> 里做.
      </Callout>

      <H2>属性</H2>
      <H3>TimelineItem</H3>
      <PropsTable rows={[...D.props.timeline]} />
      <H3>Rating</H3>
      <PropsTable rows={[...D.props.rating]} />
      <H3>FileDropzone</H3>
      <PropsTable rows={[...D.props.dropzone]} />
      <H3>TagInput</H3>
      <PropsTable rows={[...D.props.tagInput]} />
      <H3>ColorSwatch</H3>
      <PropsTable rows={[...D.props.swatch]} />
    </>
  );
}
