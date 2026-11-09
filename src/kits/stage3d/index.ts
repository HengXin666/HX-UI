/**
 * 立体族出口. 由 src/kits/index.ts 汇入 @hx/ui/kits 子路径.
 *
 * .agents/notes/implemented/feature/2026-11-10-kits-stage3d.md
 */
export { LANYARD_CARD_W, LANYARD_FLIP, ROPE_ANCHORS, SwingLanyard, cardAngle, createRope, ropePath, stepRope, type Rope, type RopeAnchor, type RopeParams, type SwingLanyardProps } from "./SwingLanyard";
export { ORBIT_DRAG_SPEED, ORBIT_FOV_DEG, OrbitViewer, clampPitch, createOrbit, orbitDrag, orbitPerspective, orbitTransform, stepOrbit, type OrbitOptions, type OrbitState, type OrbitViewerProps } from "./OrbitViewer";
export { SPHERE_DEFAULTS, SphereMenu, fibonacciSphere, frontmost, frontness, nearestOfItem, snapTarget, tileLook, wrapAngle, type SphereItem, type SphereMenuProps, type SpherePoint } from "./SphereMenu";
