/**
 * 字面量联合成员在源码里写下的顺序. checker 的 t.types 按内部类型 id 排, 而字面量类型全程序共享,
 * 顺序因此随 node_modules 变; 这里顺着声明的类型节点读出书写顺序, 读不出来返回 undefined.
 *
 * .agents/notes/implemented/process/2026-11-24-docs-props-deterministic.md
 */
import ts from "typescript";
import { BOOLEAN_TEXTS, FALSE_TEXT, QUERY_ELEMENTS, QUERY_KEYS, QUERY_VALUES, TRUE_TEXT, type QueryMode } from "../constants/docs-props.ts";

const MAX_DEPTH = 8;
const NUMERIC_KEY = /^-?\d+(\.\d+)?$/;

/** 属性名节点 (标识符, 字符串, 数字) 的文本; 计算属性等读不出时为 undefined. */
function keyName(name: ts.PropertyName | undefined): string | undefined {
  return name && (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) ? name.text : undefined;
}

function allDefined(xs: (string | undefined)[]): string[] | undefined {
  return xs.every((x) => x !== undefined) ? (xs as string[]) : undefined;
}

/** 字面量表达式 -> 与 checker.typeToString 同格式的文本 ('a', 1, true) */
function literalText(e: ts.Expression): string | undefined {
  if (ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e)) return `'${e.text}'`;
  if (ts.isNumericLiteral(e)) return e.text;
  if (e.kind === ts.SyntaxKind.TrueKeyword) return TRUE_TEXT;
  if (e.kind === ts.SyntaxKind.FalseKeyword) return FALSE_TEXT;
  if (ts.isPrefixUnaryExpression(e) && e.operator === ts.SyntaxKind.MinusToken && ts.isNumericLiteral(e.operand)) return `-${e.operand.text}`;
  return undefined;
}

/**
 * 返回 writtenOrder: 属性的各个声明里第一个读得出书写顺序的. 带类型注解的属性 / 参数走类型节点
 * (联合, 括号, 类型别名, T["k"], keyof typeof X 等); cva 这类 VariantProps 映射出来的属性走配置对象的键.
 */
export function unionOrder(checker: ts.TypeChecker, flags: ts.TypeFormatFlags): (decls: readonly ts.Declaration[]) => string[] | undefined {
  function resolve(name: ts.EntityName): ts.Symbol | undefined {
    const sym = checker.getSymbolAtLocation(name);
    return sym && sym.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(sym) : sym;
  }

  function declaredOrder(node: ts.TypeNode | undefined, depth = 0): string[] | undefined {
    if (!node || depth > MAX_DEPTH) return undefined;
    if (ts.isParenthesizedTypeNode(node)) return declaredOrder(node.type, depth + 1);
    if (ts.isUnionTypeNode(node)) return collect(node.types, depth);
    if (ts.isLiteralTypeNode(node)) {
      if (node.literal.kind === ts.SyntaxKind.NullKeyword) return [];
      return [checker.typeToString(checker.getTypeFromTypeNode(node), undefined, flags)];
    }
    if (node.kind === ts.SyntaxKind.BooleanKeyword) return [...BOOLEAN_TEXTS];
    if (node.kind === ts.SyntaxKind.UndefinedKeyword) return [];
    if (ts.isTypeOperatorNode(node) && node.operator === ts.SyntaxKind.KeyOfKeyword && ts.isTypeQueryNode(node.type)) return queryOrder(node.type, QUERY_KEYS);
    if (ts.isTypeOperatorNode(node) && node.operator === ts.SyntaxKind.ReadonlyKeyword) return declaredOrder(node.type, depth + 1);
    if (ts.isTupleTypeNode(node)) return collect(node.elements, depth);
    if (ts.isIndexedAccessTypeNode(node)) {
      // (typeof X)[keyof typeof X] 与 (typeof ARR)[number]: 对象的值 / 数组的元素, 按书写顺序
      const obj = ts.isParenthesizedTypeNode(node.objectType) ? node.objectType.type : node.objectType;
      if (ts.isTypeQueryNode(obj) && ts.isTypeOperatorNode(node.indexType) && node.indexType.operator === ts.SyntaxKind.KeyOfKeyword) return queryOrder(obj, QUERY_VALUES);
      if (ts.isTypeQueryNode(obj) && node.indexType.kind === ts.SyntaxKind.NumberKeyword) return queryOrder(obj, QUERY_ELEMENTS);
    }
    if (ts.isTypeReferenceNode(node) && node.typeArguments?.length === 1 && ts.isTypeQueryNode(node.typeArguments[0])) {
      // ValueOf<typeof X> 这类 "T[keyof T]" 的单参别名
      const alias = resolve(node.typeName)?.getDeclarations()?.find(ts.isTypeAliasDeclaration);
      if (alias?.typeParameters?.length === 1 && ts.isIndexedAccessTypeNode(alias.type) && ts.isTypeOperatorNode(alias.type.indexType)) return queryOrder(node.typeArguments[0], QUERY_VALUES);
      return undefined;
    }
    if (ts.isTypeReferenceNode(node) && !node.typeArguments) {
      const alias = resolve(node.typeName)?.getDeclarations()?.find(ts.isTypeAliasDeclaration);
      return alias && !alias.typeParameters ? declaredOrder(alias.type, depth + 1) : undefined;
    }
    if (ts.isIndexedAccessTypeNode(node) && ts.isLiteralTypeNode(node.indexType) && ts.isStringLiteral(node.indexType.literal)) {
      const prop = checker.getPropertyOfType(checker.getTypeFromTypeNode(node.objectType), node.indexType.literal.text);
      const decl = prop?.getDeclarations()?.find((d): d is ts.PropertySignature => ts.isPropertySignature(d));
      return declaredOrder(decl?.type, depth + 1);
    }
    return undefined;
  }

  function collect(nodes: readonly ts.TypeNode[], depth: number): string[] | undefined {
    const out: string[] = [];
    for (const n of nodes) {
      const sub = declaredOrder(ts.isNamedTupleMember(n) ? n.type : n, depth + 1);
      if (!sub) return undefined;
      out.push(...sub);
    }
    return out;
  }

  /** typeof X: X 的对象字面量的键 / 值, 或数组字面量 (含 d.ts 里的 readonly 元组注解) 的元素, 按书写顺序 */
  function queryOrder(q: ts.TypeQueryNode, mode: QueryMode): string[] | undefined {
    const v = resolve(q.exprName)?.getDeclarations()?.find(ts.isVariableDeclaration);
    if (!v) return undefined;
    let init = v.initializer;
    while (init && (ts.isAsExpression(init) || ts.isSatisfiesExpression(init) || ts.isParenthesizedExpression(init))) init = init.expression;
    const elements = mode === QUERY_ELEMENTS;
    if (!init) return elements && v.type ? declaredOrder(v.type, 1) : undefined;
    if (ts.isArrayLiteralExpression(init)) return elements ? allDefined(init.elements.map(literalText)) : undefined;
    if (!ts.isObjectLiteralExpression(init) || elements) return undefined;
    if (mode === QUERY_KEYS) {
      return allDefined(init.properties.map((p) => (p.name && (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name)) ? `'${p.name.text}'` : p.name && ts.isNumericLiteral(p.name) ? p.name.text : undefined)));
    }
    return allDefined(init.properties.map((p) => (ts.isPropertyAssignment(p) ? literalText(p.initializer) : undefined)));
  }

  return function writtenOrder(decls) {
    for (const d of decls) {
      if ((ts.isPropertySignature(d) || ts.isPropertyDeclaration(d) || ts.isParameter(d)) && d.type) {
        const o = declaredOrder(d.type);
        if (o) return o;
      }
      if (ts.isPropertyAssignment(d) && ts.isObjectLiteralExpression(d.initializer)) {
        const keys = allDefined(d.initializer.properties.map((p) => keyName(p.name)));
        if (keys) return keys.map((k) => (NUMERIC_KEY.test(k) || BOOLEAN_TEXTS.includes(k) ? k : `'${k}'`));
      }
    }
    return undefined;
  };
}
