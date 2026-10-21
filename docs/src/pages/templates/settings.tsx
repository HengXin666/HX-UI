import type { JSX } from "react";
import {
  Button, Input, SegmentedControl, Select, SelectContent, SelectItem, SelectTrigger,
  SelectValue, SettingRow, SettingSection, Switch, VARIANT,
} from "@hx/ui";
import { H2, P, Preview } from "../../components/DocKit";
import { ApplySteps, TemplateFiles, TemplateFrame } from "../../components/TemplateKit";

const CODE = `import { SettingRow, SettingSection } from "@hx/ui";

export function SettingsPage() {
  return (
    <div className="mx-auto flex max-w-[880px] flex-col gap-4 p-6">
      <SettingSection section={{ id: "general", title: "通用" }} description="影响整个应用的偏好">
        <SettingRow label="语言" description="界面与通知的语言">
          <Select defaultValue="zh"><SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="zh">简体中文</SelectItem></SelectContent>
          </Select>
        </SettingRow>
        <SettingRow title="开机自启" description="登录系统后在后台启动">
          <Switch defaultChecked />
        </SettingRow>
      </SettingSection>
    </div>
  );
}`;

/** 设置页模板: 一张卡里一行一个设置项, 分组标题带说明. */
export function TemplateSettingsPage(): JSX.Element {
  return (
    <>
      <P>整页骨架: 分组卡片 + 一行一个设置项, 右侧放控件。行内说明文字压到最小, 避免和标签抢注意力; 危险操作单独一组放在最下面。</P>
      <ApplySteps steps={[
        "安装 @hx/ui 并引入样式入口",
        "把下面这段复制进 src/pages/SettingsPage.tsx, 按需要增删 SettingRow",
        "危险操作 (删除账号之类) 放最后一组, 用 variant=danger 的按钮",
      ]} />
      <H2>整页预览</H2>
      <TemplateFrame height={430}>
        <div className="flex h-full flex-col gap-4 overflow-y-auto p-5">
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
            <SettingRow title="密度" description="列表与表单的间距">
              <SegmentedControl
                items={[
                  { key: "compact", label: "紧凑" },
                  { key: "normal", label: "标准" },
                ]}
                value="normal"
                onChange={() => undefined}
              />
            </SettingRow>
          </SettingSection>

          <SettingSection section={{ id: "notify", title: "通知" }} description="哪些事件需要提醒">
            <SettingRow title="任务完成" description="耗时超过 10 秒的任务结束时提醒">
              <Switch defaultChecked />
            </SettingRow>
            <SettingRow title="错误报告" description="出错时的堆栈会一并发送">
              <Switch defaultChecked />
            </SettingRow>
            <SettingRow title="自定义 Webhook" description="以 POST 形式发到你的服务">
              <Input placeholder="https://example.com/hook" className="w-52" />
            </SettingRow>
          </SettingSection>

          <div className="flex justify-end gap-2">
            <Button variant={VARIANT.ghost} size={VARIANT.sm}>取消</Button>
            <Button variant={VARIANT.primary} size={VARIANT.sm}>保存</Button>
          </div>
        </div>
      </TemplateFrame>
      <H2>完整代码</H2>
      <TemplateFiles files={["src/pages/SettingsPage.tsx"]} />
      <Preview code={CODE} lang="tsx">
        <div className="text-[12.5px] text-muted-foreground">复制即用, 只保留了你真正会改的那几行。</div>
      </Preview>
    </>
  );
}
