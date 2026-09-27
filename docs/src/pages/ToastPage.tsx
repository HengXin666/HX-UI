import type { JSX } from "react";
import { toast, Button, Card } from "@hx/ui";
import { H2, P, Preview, PropsTable, Callout, Code } from "../components/DocKit";

/** 点一下弹一条。四种语义各一个按钮, 便于逐个看。 */
function VariantButtons(): JSX.Element {
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="primary" size="sm" onClick={() => toast.success("配置已保存", { title: "保存成功" })}>
        成功
      </Button>
      <Button variant="destructive" size="sm" onClick={() => toast.error("模型返回 503, 请稍后重试", { title: "请求失败" })}>
        失败
      </Button>
      <Button variant="outline" size="sm" onClick={() => toast.warning("工作区剩余空间不足 1 GB", { title: "磁盘空间" })}>
        警告
      </Button>
      <Button variant="ghost" size="sm" onClick={() => toast.info("已复制到剪贴板")}>
        信息
      </Button>
    </div>
  );
}

export function ToastPage(): JSX.Element {
  return (
    <>
      <P>
        消息提醒。右下角堆叠是主形态，另有一个顶部居中的位置，用在"操作成功"这类一闪而过的短提示上。
      </P>

      <Callout title="整个应用只挂一个 Toaster">
        把它放在根布局里，不要每个页面各挂一个 —— 否则切页时正在显示的提醒会跟着页面的卸载一起消失。
        另外 <Code>showToast</Code> 是模块级函数，在请求失败的 <Code>catch</Code> 分支、定时回调、
        非 React 的工具函数里都能直接调用，不需要先拿到 context。
      </Callout>

      <H2>四种语义</H2>
      <P>点下面的按钮，看右下角弹出。四种语义用**内环色**区分，而不是换整个底色 —— 换底色会让提醒在最需要被看清时变成一个彩色方块，反而压过正文。</P>
      <Preview align="start" code={`toast.success("配置已保存", { title: "保存成功" });
toast.error("模型返回 503, 请稍后重试", { title: "请求失败" });
toast.warning("工作区剩余空间不足 1 GB", { title: "磁盘空间" });
toast.info("已复制到剪贴板");`}>
        <VariantButtons />
      </Preview>

      <H2>带操作按钮</H2>
      <P>
        带 <Code>action</Code> 的提醒会自动延长停留时间（4 秒 → 8 秒）—— 要留时间让人读完再决定点不点。
      </P>
      <Preview
        align="start"
        code={`toast.error("凭据已失效，需要重新登录", {
  title: "连接中断",
  action: { label: "前往设置", onClick: () => console.log("跳转设置") },
});`}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            toast.error("凭据已失效，需要重新登录", {
              title: "连接中断",
              action: { label: "前往设置", onClick: () => console.log("跳转设置") },
            })
          }
        >
          带操作按钮的提醒
        </Button>
      </Preview>

      <H2>顶部居中</H2>
      <P>
        位置由 <Code>Toaster</Code> 的 <Code>position</Code> 决定，不是每条自己带 ——
        一个应用里混用两种位置会让人不知道该看哪。
      </P>
      <Preview
        align="start"
        code={`// 根布局里换成这个位置
<Toaster position="top-center" />`}
      >
        <Card variant="muted" className="w-full p-3 text-[12.5px] text-muted-foreground">
          当前文档站挂的是 <Code>position="bottom-right"</Code>。换成 <Code>top-center</Code> 后，
          进场方向会从上下翻转（从上方落入、向上退场），与位置匹配。
        </Card>
      </Preview>

      <H2>不自动消失 / 手动关闭</H2>
      <Preview
        align="start"
        code={`{/* durationMs: 0 表示不自动消失，只能手动关 */}
const id = toast.error("需要你手动处理", { durationMs: 0 });

{/* 也可以拿到 id 后提前关掉 —— 例如"上传中"完成后关掉它 */}
toast.dismiss(id);

{/* 切页时清空，避免上一页的提醒跟着过来 */}
toast.dismissAll();`}
      >
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => toast.error("需要你手动处理", { title: "不自动消失", durationMs: 0 })}>
            弹一条不消失的
          </Button>
          <Button variant="ghost" size="sm" onClick={() => toast.dismissAll()}>
            全部关掉
          </Button>
        </div>
      </Preview>

      <H2>堆叠上限</H2>
      <P>
        默认最多同时显示 <Code>3</Code> 条，超出时从最旧的开始丢 —— 最新的最可能是用户刚触发的，更该被看到。
        连点下面这个按钮试试。上游没有这个限制，连续报错时会铺满半个屏幕。
      </P>
      <Preview
        align="start"
        code={`<Toaster maxVisible={3} />   {/* 传 0 表示不限制 */}`}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            for (let i = 1; i <= 6; i++) {
              setTimeout(() => toast.info(`第 ${i} 条提醒`), i * 120);
            }
          }}
        >
          连弹 6 条
        </Button>
      </Preview>

      <H2>用法</H2>
      <Preview
        align="start"
        code={`// 1. 根布局挂一次
import { Toaster } from "@hx/ui";

export function RootLayout({ children }) {
  return (
    <>
      {children}
      <Toaster position="bottom-right" maxVisible={3} />
    </>
  );
}

// 2. 任何地方调用
import { toast } from "@hx/ui";

async function save() {
  try {
    await api.save();
    toast.success("已保存");
  } catch (e) {
    toast.error(e.message, { title: "保存失败" });
  }
}`}
      >
        <Card variant="muted" className="w-full p-3 text-[12.5px] text-muted-foreground">
          文档站自己在 <Code>App.tsx</Code> 里挂了一个 <Code>Toaster</Code>，所以上面所有按钮都是真的在弹。
        </Card>
      </Preview>

      <H2>API</H2>
      <PropsTable
        rows={[
          { name: "toast.success / error / warning / info", type: "(message, opts?) => string", desc: "四种语义的快捷方法。返回 id，可用于提前关闭。" },
          { name: "opts.title", type: "string", desc: "标题，渲染在正文上方。" },
          { name: "opts.durationMs", type: "number", default: "4000（有 action 时 8000）", desc: "自动消失毫秒数。0 表示不自动消失。" },
          { name: "opts.action", type: "{ label, onClick }", desc: "可选操作按钮。" },
          { name: "dismissToast(id)", type: "(id: string) => void", desc: "手动关闭某一条。" },
          { name: "dismissAllToasts()", type: "() => void", desc: "清空全部。用在路由切换这类场合。" },
          { name: "<Toaster /> position", type: '"bottom-right" | "top-center"', default: '"bottom-right"', desc: "弹出位置。整个应用统一一个。" },
          { name: "<Toaster /> maxVisible", type: "number", default: "3", desc: "堆叠上限。超出丢最旧的。0 表示不限制。" },
        ]}
      />

      <H2>无障碍</H2>
      <P>
        容器带 <Code>role="region"</Code> 与 <Code>aria-live="polite"</Code>，屏幕阅读器会在内容更新时朗读，
        且不会打断用户正在读的东西。关闭按钮有 <Code>aria-label</Code>，图标本身 <Code>aria-hidden</Code>。
      </P>
      <P>
        重要提醒（例如"会话即将过期"）应该用 <Code>durationMs: 0</Code> 让它不自动消失 ——
        自动消失对辅助技术的使用者不友好，他们可能还没听到就已经没了。
      </P>
    </>
  );
}
