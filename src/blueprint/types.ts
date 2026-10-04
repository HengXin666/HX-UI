import type { ReactNode } from "react";

/**
 * 蓝图的类型层。
 *
 * 设计取向: **类型是一张可注册的 DAG, 不是一个枚举。**
 * 枚举意味着每加一种数据都要回来改这个文件; DAG 意味着使用方自己注册
 * `"image": { extends: "tensor" }` 就能让 image 连进 tensor 输入口。
 *
 * 三个刻意的选择:
 *   1. 端口数据类型用开放 string (`DataTypeId`), 内置那几个只是默认值。
 *   2. 节点的**求值**是可选项 (`evaluate`)。蓝图库的本职是"图 + 合法性",
 *      执行引擎是另一个问题 —— 不提供也能用 (导出图 / 生成代码 / 交给后端)。
 *   3. 校验结果带 `code`。UI 要靠 code 决定"这条红线画在哪",
 *      靠 message 只能打印一行字。
 */

// ── 数据类型 ──────────────────────────────────────────────────────────

/** 端口上的数据类型标识。开放: 使用方注册什么就是什么。 */
export type DataTypeId = string;

/** 万物之父 —— 任何类型都能连进 `any` 输入口, `any` 能连进任何输入口。 */
export const ANY = "any";
/** 执行流。它不是数据, 是"下一步做这个"。UE5 的白线。 */
export const EXEC = "exec";

/** 内置数据类型。只是默认值, 不是全集。 */
export const BASE_TYPES: Record<string, DataTypeDef> = {
  [ANY]: { id: ANY, label: "任意" },
  [EXEC]: { id: EXEC, label: "执行", colorClass: "bg-foreground" },
  number: { id: "number", label: "数值", colorClass: "bg-emerald-400", extends: ANY },
  string: { id: "string", label: "文本", colorClass: "bg-primary", extends: ANY },
  boolean: { id: "boolean", label: "布尔", colorClass: "bg-amber-400", extends: ANY },
  object: { id: "object", label: "对象", colorClass: "bg-muted-foreground", extends: ANY },
};

export interface DataTypeDef {
  readonly id: DataTypeId;
  readonly label?: string;
  /**
   * 端口圆点的颜色类名 (bg-*)。不写就用默认描边色。
   *
   * 只写 bg-* 是不够的 —— 连线要按类型着色, 而线是 stroke, 不是 background。
   * 所以另给一个 strokeClass; 不写时从 colorClass 推导 (把 bg- 换成 stroke-),
   * 这样绝大多数情况只需写一处。
   */
  readonly colorClass?: string;

  /**
   * 连线的颜色类名 (stroke-*)。不写时由 colorClass 推导。
   *
   * 为什么要分开: Tailwind 的 bg-emerald-400 与 stroke-emerald-400 是两条
   * 独立的规则, 前者不能用来描线。推导能覆盖九成情况, 但想让"圆点"和"线"
   * 用不同深浅时 (例如圆点实心、线半透明) 就得显式写。
   */
  readonly strokeClass?: string;
  /**
   * 父类型。子类型的值可以连进父类型的输入口 (协变), 反过来不行。
   * 例如 `image extends tensor`: image 输出端能喂 tensor 输入端, 反之不能。
   * 不写就等于只与自身及 `any` 相容。
   */
  readonly extends?: DataTypeId;
}

// ── 端口 / 节点定义 ───────────────────────────────────────────────────

/** 一个端口。输入与输出共用这一个形状。 */
export interface PortDef {
  readonly id: string;
  readonly label?: string;
  readonly type: DataTypeId;
  /**
   * 非必填输入。没连线时用这个默认值, 不报"缺少输入"。
   * ComfyUI 的强制输入 / 可选输入之分; 这里用"有没有 default"表达,
   * 省掉一个布尔字段 —— 有 default 就是可选。
   */
  readonly default?: unknown;
  /**
   * 一个输入口能否接多条线 (默认 false = 独占)。
   * 独占是 UE5 的行为: 新连一根会顶掉旧的。多入是"收集器"节点需要的。
   */
  readonly multi?: boolean;
  /** 不画这个点, 但仍可连线 (用于"隐藏的执行入口"这类)。 */
  readonly hidden?: boolean;
}

/** 执行出口。`string` 简写 = id 与 label 同名。 */
export type ExecOutDef = string | { readonly id: string; readonly label?: string };

/**
 * 求值上下文。
 *
 * 只给**已经算好的输入值**, 不给整个图 —— 节点不该有遍历整张图的权力,
 * 那会让"局部求值"和"缓存"都没法做。
 */
export interface EvalContext {
  /** 输入端口 id -> 值。缺的输入不出现在 key 里 (调用方自己用 default 兜)。 */
  readonly inputs: Readonly<Record<string, unknown>>;
  /** 节点自身参数 (存在 node.params 上的那些)。 */
  readonly params: Readonly<Record<string, unknown>>;
  /** 走哪条执行出口。无执行出口时忽略。 */
  readonly execOut?: string;
}

/**
 * 节点实例自带的端口声明。
 *
 * 为什么需要它: 子图的进出端点 ("隧道") 是**每个子图都不一样**的,
 * 而 NodeTypeDef 是注册中心里静态的、按 type 共享的 —— 用静态定义表达不了。
 * 把端口声明下放一层到实例上, 隧道就变成一个普通节点:
 * 校验 / 环检测 / 拓扑序 / 求值全都无需为子图写特例。
 *
 * 附带的好处: 使用方也能拿它做"动态端口"的节点 (参数决定端口数)。
 */
export interface NodePorts {
  readonly inputs?: readonly PortDef[];
  readonly outputs?: readonly PortDef[];
  readonly execIn?: boolean;
  readonly execOut?: readonly ExecOutDef[];
  /** 见 NodeTypeDef.multiExecIn。子图与实例覆盖时也要能表达。 */
  readonly multiExecIn?: boolean;
}

export interface NodeTypeDef {
  readonly type: string;
  readonly label: string;
  /** 右键菜单里的分组。 */
  readonly category?: string;
  readonly description?: string;
  readonly icon?: ReactNode;
  /** 卡片宽度提示 (px)。不写用默认值。 */
  readonly width?: number;
  /** 可折叠节点 (子图)。折叠时不画端口以外的控件。 */
  readonly collapsed?: boolean;

  readonly inputs?: readonly PortDef[];
  readonly outputs?: readonly PortDef[];

  /** 有没有执行入口。有 = 它是一次"动作"的起点或中途站。 */
  readonly execIn?: boolean;
  /** 执行出口。`["then"]` 单出口; `["true","false"]` 分支。 */
  readonly execOut?: readonly ExecOutDef[];

  /** 节点内参数 (可编辑字段)。声明式, UI 照它渲染控件。 */
  readonly params?: readonly ParamDef[];

  /**
   * 执行入口是否允许接多条线 (默认 false = 独占)。
   *
   * 独占是绝大多数节点想要的: 新连一根会顶掉旧的, 语义是"我要这个来源"。
   * 但**回路汇合点**必须放开 —— 例如"循环回到起点"与"启动进入"两条边
   * 同时存在, 独占会把其中一条顶掉, 而那两条都是真的。
   *
   * 这条只影响执行入口; 数据输入口的独占与否仍由 PortDef.multi 决定。
   */
  readonly multiExecIn?: boolean;

  /** 求值。返回 输出端口 id -> 值。不提供 = 该节点只参与静态校验。 */
  readonly evaluate?: (ctx: EvalContext) => Record<string, unknown> | Promise<Record<string, unknown>>;
}

/** 节点内可编辑字段。刻意只做四种 —— 够覆盖九成场景, 多一个就多一份 UI 维护。 */
export interface ParamDef {
  readonly id: string;
  readonly label?: string;
  readonly kind: "text" | "number" | "select" | "switch";
  readonly default?: unknown;
  /** kind === "select" 时的选项。 */
  readonly options?: readonly { readonly value: string; readonly label: string }[];
  /** kind === "number" 时的上下界与步长。 */
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
}

/** 注册中心。使用方把它当容器往里塞, 组件从它读。 */
export interface BlueprintRegistry {
  readonly nodeTypes: ReadonlyMap<string, NodeTypeDef>;
  readonly dataTypes: ReadonlyMap<DataTypeId, DataTypeDef>;

  /**
   * 类型相容: `from` 的值能不能喂给 `to` 输入口。
   *
   * 沿 `extends` 链向上走 (协变)。`any` 双向都通。
   * 放在接口上而不是写成自由函数, 是因为判定需要读 dataTypes 表 ——
   * 让它跟着注册中心走, 调用方不用到处传两张表。
   */
  assignable(from: DataTypeId, to: DataTypeId): boolean;

  /** 数据类型的端口圆点颜色类名。未注册的类型返回 undefined。 */
  typeColor(type: DataTypeId): string | undefined;

  /** 连线的颜色类名 (stroke-*)。由 colorClass 推导, 或取显式写的 strokeClass。 */
  typeStroke(type: DataTypeId): string | undefined;
}

// ── 图 ────────────────────────────────────────────────────────────────

export interface BlueprintNode {
  readonly id: string;
  readonly type: string;
  readonly x: number;
  readonly y: number;
  /** 覆盖 NodeTypeDef.label。 */
  readonly title?: string;
  readonly params?: Readonly<Record<string, unknown>>;
  readonly collapsed?: boolean;
  /** 实例级端口声明, 覆盖 NodeTypeDef 上的同名部分。子图隧道靠它。 */
  readonly ports?: NodePorts;
  /** 引用一张子图。有它时, 该节点对外的端口由子图定义决定。 */
  readonly subgraph?: string;
  /** 覆盖宽度。子图节点通常比普通节点宽。 */
  readonly width?: number;
}

/**
 * 子图定义 —— "把一片节点折成一个节点"之后, 里面那片东西存在这。
 *
 * 存在 graph.subgraphs 里而不是直接嵌在节点上, 是为了**可复用**:
 * 一个定义可以有多个调用点 (UE5 的函数就是这么回事), 改一处全变。
 */
export interface SubGraphDef {
  readonly id: string;
  readonly label?: string;
  /** 对外输入口。与内部隧道节点的输出一一对应。 */
  readonly inputs?: readonly PortDef[];
  /** 对外输出口。与内部隧道节点的输入一一对应。 */
  readonly outputs?: readonly PortDef[];
  readonly execIn?: boolean;
  readonly execOut?: readonly ExecOutDef[];
  /** 见 NodeTypeDef.multiExecIn。折叠时按被折叠区域是否含回路汇合点推导。 */
  readonly multiExecIn?: boolean;
  readonly nodes: readonly BlueprintNode[];
  readonly edges: readonly BlueprintEdge[];
}

/**
 * 区间注释 (UE5 的 Comment, n8n 的 Sticky)。
 *
 * 它不是节点: 不连线、不参与求值、不影响校验。它只是画布上**一个带标题的矩形**,
 * 拖动它时把完全落在里面的节点一起带走。
 */
export interface BlueprintComment {
  readonly id: string;
  readonly title?: string;
  readonly body?: string;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  /**
   * 语义色。注释是给**人**看的分组标记, 所以它可以用语义色 ——
   * 但只这几个, 不放开任意颜色, 否则换肤时又会失效。
   */
  readonly tone?: "default" | "primary" | "warning" | "success" | "info" | "danger" | "neutral";
  /**
   * 是否"锁定内容": true 时拖动注释**不带走**里面的节点。
   *
   * UE5 的注释有两种行为, 而用户会明确地想要其中一种 —— 有时你想挪整个
   * 分组, 有时你只想挪那张说明便签。做成字段而不是全局开关, 因为同一张
   * 图里两种需求会同时出现。
   */
  readonly moveWithNodes?: boolean;
}

/** 端口引用。`node` + `port` 两端齐全, 不带索引 —— 索引会随增删漂移。 */
export interface PortRef {
  readonly node: string;
  readonly port: string;
}

export interface BlueprintEdge {
  readonly id: string;
  readonly from: PortRef;
  readonly to: PortRef;
  /** 执行流边。由两端端口类型是否 exec 决定, 存下来只是为了省去反查。 */
  readonly kind?: "data" | "exec";
}

export interface BlueprintGraph {
  readonly nodes: readonly BlueprintNode[];
  readonly edges: readonly BlueprintEdge[];
  /** 子图定义表。节点用 `subgraph` 引用这里的 id。 */
  readonly subgraphs?: Readonly<Record<string, SubGraphDef>>;
  /** 区间注释。 */
  readonly comments?: readonly BlueprintComment[];
}

// ── 校验 ──────────────────────────────────────────────────────────────

export type IssueCode =
  | "unknown-node-type"
  | "unknown-port"
  | "duplicate-edge"
  | "type-mismatch"
  | "self-loop"
  | "cycle"
  | "input-occupied"
  | "missing-input"
  | "dangling-ref"
  | "no-entry"
  | "custom";

export type IssueLevel = "error" | "warning";

/**
 * 一条校验结论。
 *
 * `code` 是给机器看的 (UI 靠它决定红线画在哪、能不能拖);
 * `message` 是给人看的。`targets` 让 UI 能精确定位到节点或边。
 */
export interface ValidationIssue {
  readonly code: IssueCode;
  readonly level: IssueLevel;
  readonly message: string;
  /** 涉及的节点 id。 */
  readonly nodeIds?: readonly string[];
  /** 涉及的边 id。 */
  readonly edgeIds?: readonly string[];
}

export interface NodeValidation {
  readonly nodeId: string;
  /** 每个输入口的红点标记: portId -> 原因。UI 在端口旁画一个点。 */
  readonly portErrors: Readonly<Record<string, ValidationIssue>>;
  readonly issues: readonly ValidationIssue[];
  readonly ok: boolean;
}

export interface GraphValidation {
  readonly ok: boolean;
  readonly issues: readonly ValidationIssue[];
  /** 按节点索引, 便于渲染时 O(1) 取。 */
  readonly byNode: ReadonlyMap<string, NodeValidation>;
  /** 按边索引。 */
  readonly byEdge: ReadonlyMap<string, readonly ValidationIssue[]>;
}

/** 节点定义上的自定义校验钩子。 */
export type NodeValidator = (ctx: {
  readonly node: BlueprintNode;
  readonly def: NodeTypeDef;
  readonly params: Readonly<Record<string, unknown>>;
  /** 该节点各输入口当前连了几条边。 */
  readonly inDegree: Readonly<Record<string, number>>;
}) => readonly ValidationIssue[];
