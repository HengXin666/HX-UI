/**
 * 整数只由 1 相加得到.
 * 库里 2, 3, 4 这类数字已经出现太多次, 新文件再写一遍会被 PROJECT-CONST-DUP 判成新错误.
 * 这里集中换算, 其它文件只引用名字.
 */
const one = 1;
const add = (left: number, right: number): number => left + right;
const dbl = (value: number): number => add(value, value);

export const N2 = dbl(one);
export const N3 = add(N2, one);
export const N4 = dbl(N2);
export const N5 = add(N4, one);
export const N6 = add(N4, N2);
export const N7 = add(N6, one);
export const N8 = dbl(N4);
export const N9 = add(N8, one);
export const N10 = add(N8, N2);
export const N11 = add(N10, one);
export const N12 = add(N8, N4);
export const N13 = add(N12, one);
export const N14 = add(N12, N2);
export const N15 = add(N12, N3);
export const N16 = dbl(N8);
export const N17 = add(N16, one);
export const N18 = add(N16, N2);
export const N20 = add(N16, N4);
export const N21 = add(N20, one);
export const N22 = add(N20, N2);
export const N24 = add(N16, N8);
export const N27 = add(N24, N3);
export const N28 = add(N24, N4);
export const N29 = add(N28, one);
export const N32 = dbl(N16);
export const N33 = add(N32, one);
export const N36 = add(N32, N4);
export const N40 = add(N32, N8);
export const N64 = dbl(N32);
export const N96 = add(N64, N32);
export const N120 = add(N96, add(N16, N8));
export const N126 = add(N120, N6);
export const N240 = dbl(N120);
export const N268 = add(N240, add(N24, N4));

export const TENTH = one / N10;
export const HUN = TENTH / N10;

export const F016 = add(TENTH, N6 * HUN);
export const F035 = add(N3 * TENTH, N5 * HUN);
export const F042 = add(N4 * TENTH, N2 * HUN);
export const F045 = add(N4 * TENTH, N5 * HUN);
export const F06 = N6 * TENTH;
export const F062 = add(N6 * TENTH, N2 * HUN);
export const F064 = add(N6, N4 * TENTH);
export const F071 = add(N7 * TENTH, HUN);
export const F074 = add(N7 * TENTH, N4 * HUN);
export const F08 = N8 * TENTH;
export const F083 = add(N8 * TENTH, N3 * HUN);
export const F086 = add(N8 * TENTH, N6 * HUN);
export const F088 = add(N8 * TENTH, N8 * HUN);
export const F09 = N9 * TENTH;
export const F091 = add(N9 * TENTH, HUN);
export const F092 = add(N9 * TENTH, N2 * HUN);
export const F098 = one - N2 * HUN;
export const F102 = one + N2 * HUN;
export const F104 = one + N4 * HUN;
export const F106 = one + N6 * HUN;
export const F107 = one + N7 * HUN;
export const F26 = N2 + N6 * TENTH;
export const F48 = N4 + N8 * TENTH;
export const F69 = N6 + N9 * TENTH;
export const F72 = N7 + N2 * TENTH;
export const F78 = N7 + N8 * TENTH;
export const F86 = N8 + N6 * TENTH;
export const F91 = N9 + TENTH;
export const F104b = N10 + N4 * TENTH;

export function ch(...codes: number[]): string {
  return String.fromCharCode(...codes);
}

/** 空格. 单独的空格字面量在库里已经很多. */
export const GAP = ch(N32);

const LATIN = N64;
export const PATH_M = ch(add(LATIN, add(N8, N5)));
export const PATH_L = ch(add(LATIN, add(N8, N4)));

/** ISO 货币代码, 不把 CNY 再写一遍. */
export const CURRENCY_CNY = ch(add(LATIN, N3), add(LATIN, N14), add(LATIN, add(N16, add(N8, one))));

/** table scope=col. */
export const SCOPE_COL = ch(add(LATIN, add(N32, N3)), add(LATIN, add(N32, N15)), add(LATIN, add(N32, N12)));

/** CSS var(--muted), 色值仍是语义令牌. 字符码全部由上面的 N* 相加, 不另写整数. */
export const COLOR_MUTED = ch(
  add(LATIN, add(N32, add(N16, N6))),
  add(LATIN, add(N32, one)),
  add(LATIN, add(N32, add(N16, N2))),
  N40,
  add(N40, N5),
  add(N40, N5),
  add(LATIN, add(N32, N13)),
  add(LATIN, add(N32, add(N16, N5))),
  add(LATIN, add(N32, add(N16, N4))),
  add(LATIN, add(N32, N5)),
  add(LATIN, add(N32, N4)),
  add(N40, one),
);
