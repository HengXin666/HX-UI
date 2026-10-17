/**
 * hx-browser 实时预览模块的公开出口, 也是包子路径 @hx/ui/hxbrowser 的入口.
 */

export {
  LIVE_ENVS_PATH, LIVE_MSG, LIVE_EVT, LIVE_PRESET, LIVE_CLOSE, NO_RETRY_CLOSE_CODES, NAV_ACTION,
  MOUSE_ACTION, MOUSE_BUTTONS, KEY_ACTION, QUERY_KEY, QUERY_PRESET, HEADER_API_KEY, FRAME_DATA_URL_PREFIX,
  liveSessionPath, parseServerEvent,
  type LivePreset, type NavAction, type MouseAction, type MouseButtonName, type KeyAction,
  type LiveEnv, type LiveTab, type LiveMeta,
  type LiveServerEvent, type LiveFrameEvent, type LiveMetaEvent, type LiveTabsEvent, type LiveErrorEvent,
  type LiveClientMessage, type LiveMouseMessage, type LiveKeyMessage, type LiveTextMessage,
  type LiveNavigateMessage, type LiveQualityMessage, type LiveFlowMessage, type LiveActivateMessage,
} from "./core/protocol";
export { LIVE_STATUS } from "../constants/hxbrowser";
export {
  liveSessionUrl, liveEnvsUrl, fetchLiveEnvs,
  type HxBrowserTransport, type WebSocketCtor, type FetchLike,
} from "./core/transport";
export {
  LiveConnection, DEFAULT_RETRY, backoffDelay,
  type LiveStatus, type LiveSnapshot, type LiveRetryPolicy, type LiveTimers, type LiveConnectionOptions,
} from "./core/connection";
export {
  HeldInputs, buttonName, keyMessage, mouseMessage,
  type ModifierState, type SurfaceRect, type PointerSample, type KeySample,
} from "./core/input";
export { findFocused, focusedGone, pickFocusTarget } from "./core/focus";
export { DEFAULT_LIVE_LABELS, resolveLabels as resolveBrowserLiveLabels, type BrowserLiveLabels } from "./core/labels";
export {
  useHxBrowserLive, useHxBrowserLiveEnvs, useDocumentVisible, useElementInView,
  type UseHxBrowserLiveOptions, type HxBrowserLive, type UseHxBrowserLiveEnvsOptions, type HxBrowserLiveEnvs,
} from "./hooks";
export { useLiveInput } from "./useLiveInput";
export {
  BrowserLiveTile, BrowserLiveStatus, BrowserLiveEnvBadges,
  type BrowserLiveTileProps, type BrowserLiveStatusProps, type BrowserLiveEnvBadgesProps,
} from "./BrowserLiveTile";
export { BrowserLiveView, type BrowserLiveViewProps } from "./BrowserLiveView";
export { BrowserLiveWall, type BrowserLiveWallProps } from "./BrowserLiveWall";
