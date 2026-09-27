import { useState, type JSX } from "react";
import { SettingSection, SettingRow, SettingHeading, Input, Switch, SegmentedControl } from "@hx/ui";
import { H2, H3, P, Preview, PropsTable } from "../components/DocKit";

const SECTION = { id: "demo" };

export function SettingChromePage(): JSX.Element {
  const [mode, setMode] = useState("dark");

  return (
    <>
      <P>
        这是设置页版式的**关键组件**, 也是整套界面里最容易做歪的一处。
        上游的设置页不是"每个设置项一张卡", 而是**一张卡里一行一个设置项**:
        左侧标题与说明占满剩余宽度, 右侧控件固定宽度, 行间用 1px 下边框分隔。
      </P>

      <H2>SettingSection + SettingRow</H2>
      <P>
        <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">SettingSection</code> 提供分组标题外面那层
        <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]"> rounded-xl border bg-card</code> 容器,
        <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">SettingRow</code> 是行。
        最后一行的 <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">border</code> 要传 <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[11.5px]">false</code>, 否则会在卡片底边上方多一条线。
      </P>
      <Preview
        align="stretch"
        code={`<SettingSection section={{ id: "general" }} title="常规">
  <SettingRow title="工作区" description="新建项目时将在此目录下创建对应的项目文件夹">
    <Input defaultValue="/home/user/workspace" className="w-64" />
  </SettingRow>
  <SettingRow title="系统通知" description="agent 完成一轮回答时发系统通知">
    <Switch defaultChecked />
  </SettingRow>
  <SettingRow title="外观模式" description="立即生效, 不需要重启" border={false}>
    <SegmentedControl items={[...]} value={mode} onChange={setMode} />
  </SettingRow>
</SettingSection>`}
      >
        <div className="w-full">
          <SettingSection section={SECTION} title="常规">
            <SettingRow title="工作区" description="新建项目时将在此目录下创建对应的项目文件夹">
              <Input defaultValue="/home/user/workspace" className="w-64" />
            </SettingRow>
            <SettingRow title="系统通知" description="agent 完成一轮回答时发系统通知">
              <Switch defaultChecked />
            </SettingRow>
            <SettingRow title="外观模式" description="立即生效, 不需要重启" border={false}>
              <SegmentedControl
                items={[{ key: "light", label: "浅色" }, { key: "dark", label: "深色" }, { key: "auto", label: "跟随系统" }]}
                value={mode}
                onChange={setMode}
              />
            </SettingRow>
          </SettingSection>
        </div>
      </Preview>

      <H2>带说明的分组</H2>
      <P>分组标题下面可以再接一句说明, 标题与说明的间距会自动收紧。</P>
      <Preview
        align="stretch"
        code={`<SettingSection section={{ id: "net" }} title="网络代理" description="开启后模型请求与下载走代理出网">
  <SettingRow title="启用应用代理" description="本机地址始终直连, 不走代理" border={false}>
    <Switch />
  </SettingRow>
</SettingSection>`}
      >
        <div className="w-full">
          <SettingSection section={{ id: "net" }} title="网络代理" description="开启后模型请求与下载走代理出网">
            <SettingRow title="启用应用代理" description="本机地址始终直连, 不走代理" border={false}>
              <Switch />
            </SettingRow>
          </SettingSection>
        </div>
      </Preview>

      <H2>SettingHeading</H2>
      <P>只想要分组标题 (不要外面那层卡片容器) 时用它 —— 例如区块内容本身就是网格卡片。</P>
      <Preview align="start" code={`<SettingHeading section={{ id: "x" }} title="外观模式" className="mb-3" />`}>
        <SettingHeading section={{ id: "x" }} title="外观模式" />
      </Preview>

      <H2>属性</H2>
      <H3>SettingSection</H3>
      <PropsTable
        rows={[
          { name: "section", type: "{ id: string; title?: string }", desc: "分组标识与标题。id 会写到 DOM 上供锚点与高亮定位。" },
          { name: "title", type: "ReactNode", desc: "覆盖 section.title。" },
          { name: "description", type: "string", desc: "标题下方的说明文字。" },
        ]}
      />
      <H3>SettingRow</H3>
      <PropsTable
        rows={[
          { name: "title", type: "string", default: "-", desc: "行标题, 单行截断。" },
          { name: "description", type: "string", desc: "行说明, 最多两行。" },
          { name: "border", type: "boolean", default: "true", desc: "是否画底部分隔线。分组最后一行传 false。" },
        ]}
      />
    </>
  );
}
