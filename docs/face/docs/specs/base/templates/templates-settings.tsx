import { Button, DENSITY, Input, SKIN, SegmentedControl, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SettingRow, SettingSection, Switch } from "@hx/ui";
import settingRaw from "../../../../../../src/layout/SettingChrome.tsx?raw";
import { DENSITIES, SKINS, Skinned } from "../../block-stage";
import { select, toggle, type PageSpec } from "../../types";

/**
 * 设置页模板: 整页由 SettingSection 与 SettingRow 拼成.
 * .agents/notes/implemented/feature/2026-11-08-docs-component-pages.md
 */

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

export const TEMPLATE_SETTINGS: PageSpec = {
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
