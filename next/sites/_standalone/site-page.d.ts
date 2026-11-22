declare module "@site-page" {
  import type { ComponentType } from "react";
  const Page: ComponentType;
  export default Page;
  export const meta: { title: string; description: string; themeColor: string; icon: string };
}
