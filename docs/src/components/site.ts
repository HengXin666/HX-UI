/**
 * 文档站对外的固定链接与入口 id.
 *
 * 仓库地址与模板入口在顶栏, 安装页与模板页里都会用到, 收在这里避免同一串地址
 * 在多处漂移 (PROJECT-CONST-DUP 也要求三次以上出现必须提取).
 */

/** 仓库主页. 顶栏的 GitHub 入口与安装页的源码链接都指向它. */
export const REPO_URL = "https://github.com/HengXin666/HX-UI";

/** 仓库在界面上的显示名 (不带协议, 窄栏里放得下). */
export const REPO_LABEL = "HengXin666/HX-UI";

/** 顶栏 "模板" 入口落到哪一页: 模板组的第一页. */
export const TEMPLATE_ENTRY = "templates-chat";
