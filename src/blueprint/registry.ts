import {
  BASE_TYPES,
  ANY,
  type BlueprintRegistry,
  type DataTypeDef,
  type DataTypeId,
  type NodeTypeDef,
  type NodeValidator,
} from "./types";

/**
 * 注册中心。
 *
 * 为什么不用 React Context: 节点定义是**静态**的, 与组件树无关。
 * 放进 Context 会逼着每个使用方包一层 Provider, 而校验函数在图外也要能跑
 * (后端导出、单元测试) —— 那时根本没有 React。
 *
 * 但**自定义校验钩子**(`validators`)是一次性的、按实例装的, 所以放在这里
 * 而不写进 NodeTypeDef: 定义是可序列化的 JSON, 钩子不是。
 */
export class BlueprintRegistryImpl implements BlueprintRegistry {
  readonly nodeTypes = new Map<string, NodeTypeDef>();
  readonly dataTypes = new Map<DataTypeId, DataTypeDef>();
  /** 按节点类型装的自定义校验钩子。 */
  readonly validators = new Map<string, NodeValidator>();

  constructor(withBaseTypes = true) {
    if (withBaseTypes) for (const t of Object.values(BASE_TYPES)) this.dataTypes.set(t.id, t);
  }

  /** 注册一个节点类型。重名覆盖 —— 交给源码的最后一版说话。 */
  node(def: NodeTypeDef): this {
    this.nodeTypes.set(def.type, def);
    return this;
  }

  /** 批量注册。写成 `nodes({...})` 的话用这个。 */
  nodes(defs: Record<string, NodeTypeDef>): this {
    for (const def of Object.values(defs)) {
      this.nodeTypes.set(def.type ?? def.type, def);
    }
    return this;
  }

  /** 注册数据类型。 */
  type(def: DataTypeDef): this {
    this.dataTypes.set(def.id, def);
    return this;
  }

  /** 给某个节点类型装校验钩子。返回拆卸函数。 */
  validator(type: string, fn: NodeValidator): () => void {
    this.validators.set(type, fn);
    return () => {
      if (this.validators.get(type) === fn) this.validators.delete(type);
    };
  }

  /** 取节点定义。未知类型返回 undefined —— 调用方按"未注册"处理。 */
  def(type: string): NodeTypeDef | undefined {
    return this.nodeTypes.get(type);
  }

  /** 必须存在的节点定义。未知类型抛错, 用于"这里理论上不可能未知"的地方。 */
  requireDef(type: string): NodeTypeDef {
    const d = this.nodeTypes.get(type);
    if (!d) throw new Error(`[blueprint] 未注册的节点类型: ${type}`);
    return d;
  }

  /**
   * 类型相容判定: `from` 的值能不能喂给 `to` 输入口。
   *
   * 沿 `extends` 链向上走 (协变)。`any` 在两个方向都通:
   *   - 输出端是 any  ->  能进任何输入口 (编译器不知道它是什么, 只能放行)
   *   - 输入端是 any  ->  任何输出都能进
   * 相等短路在前面, 免得自引用类型走进死循环。
   */
  assignable(from: DataTypeId, to: DataTypeId): boolean {
    if (from === to) return true;
    if (from === ANY || to === ANY) return true;
    const seen = new Set<DataTypeId>([from]);
    let cur: DataTypeId | undefined = from;
    while (cur) {
      const parent: DataTypeId | undefined = this.dataTypes.get(cur)?.extends;
      if (!parent) return false;
      if (parent === to) return true;
      if (seen.has(parent)) return false; // 环: 注册写错了, 不让它拖死 UI
      seen.add(parent);
      cur = parent;
    }
    return false;
  }

  /** 数据流类型的显示色。未注册的类型走默认描边。 */
  typeColor(type: DataTypeId): string | undefined {
    return this.dataTypes.get(type)?.colorClass;
  }
}

/** 建一个注册中心。`withBaseTypes = false` 时不预置内置类型。 */
export function createRegistry(withBaseTypes = true): BlueprintRegistryImpl {
  return new BlueprintRegistryImpl(withBaseTypes);
}

/** 内置类型注册好的默认中心。用它做一次性演示, 自己的东西另建。 */
export const defaultRegistry: BlueprintRegistryImpl = createRegistry();
