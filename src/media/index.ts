/**
 * 媒体原语桶文件: 响应式图片, 亮暗双图, 视频, 画廊, 灯箱, 设备与浏览器外框.
 * 名字逐个写出, 不用 export *. 根入口 src/index.ts 的接入归集成任务.
 *
 * .agents/notes/implemented/feature/2026-11-02-media-primitives.md
 */
export { Image, type ImageProps, type ImageSizing } from "./image/image";
export { ThemedImage, type ThemedImageProps } from "./image/themed-image";
export { useImageStatus, type UseImageStatusReturn } from "./image/use-image-status";
export { Video, type VideoProps, type VideoSource } from "./video";
export { Gallery, type GalleryProps } from "./gallery/gallery";
export { Lightbox, type LightboxProps, type LightboxState } from "./gallery/lightbox";
export type { MediaItem, LightboxIndexChange } from "./gallery/types";
export { DeviceFrame, type DeviceFrameProps } from "./frames/device-frame";
export { BrowserFrame, type BrowserFrameProps } from "./frames/browser-frame";
export { resolveSlots, type SlotResolver } from "./slots";
export {
	BROWSER_FRAME_SLOTS, DEVICE, DEVICE_FRAME_SLOTS, GALLERY_SLOTS, IMAGE_FIT, IMAGE_PLACEHOLDER, IMAGE_SLOTS, IMAGE_STATUS,
	LIGHTBOX_SLOTS, MEDIA_LABELS, MEDIA_MODE, THEMED_IMAGE_SLOTS, VIDEO_SLOTS,
	type DeviceKind, type ImageFit, type ImageStatus, type MediaLabels, type MediaMode, type SlotClassNames, type SlotStyles,
} from "../constants/media";
