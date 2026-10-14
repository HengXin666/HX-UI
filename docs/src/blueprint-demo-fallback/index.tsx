import type { JSX } from "react";
import { Callout } from "../components/DocKit";

export * from "./dsh";

/** 演示组件替身: 明确告诉读者真实演示包缺席, 而不是渲染一块空白 */
function Missing(): JSX.Element {
    return (
        <Callout title="演示包未就位">
            本次构建没有兄弟目录 HX-Blueprint-Demo (父仓里的使用方演示包), 这里只显示占位说明.
            在父仓内构建文档站即可看到完整的 dsh 演示.
        </Callout>
    );
}

export const DshArchitectureDemo = Missing;
export const DshDemo = Missing;
export const OtherDomainDemo = Missing;
export const AgentApiDemo = Missing;
