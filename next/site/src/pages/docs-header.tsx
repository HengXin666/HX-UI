import { Button } from "@/components/ui/button";
import { SiteHeader } from "@sites/_blocks/marketing/site-header";
import { ThemeToggle } from "@sites/_blocks/shell/theme-toggle";

/** 文档站顶栏: 三层各一个入口. */
export function DocsHeader() {
  return (
    <SiteHeader
      brand={<a href="#/" className="flex items-center gap-2"><span className="size-4 rounded-[3px] bg-foreground" />HX-UI</a>}
      links={[
        { label: "成品", href: "#/sites" },
        { label: "交互", href: "#/interactions" },
        { label: "控件", href: "#/components" },
      ]}
      actions={<><ThemeToggle /><Button size="sm" variant="outline" asChild><a href="#/components">源码</a></Button></>}
    />
  );
}
