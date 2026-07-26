const RF_PREMIUM = "/assets/ui-v2/gameplay/rapid-fire-premium";
const FRAME_BASE = `${RF_PREMIUM}/animations/enemy_basic_idle_frames`;

/**
 * Independent PNG textures for the basic enemy idle loop.
 *
 * These are deliberately ordinary image assets rather than a runtime-sliced
 * spritesheet. Each file is a verified 128×128 RGBA PNG with matching canvas
 * alignment, so mobile WebGL receives the same kind of texture as every other
 * static ship asset in the game.
 */
export const ENEMY_BASIC_IDLE_FRAME_URLS = [
  `${FRAME_BASE}/enemy_basic_idle_01.png?v=20260727-clean-v2`,
  `${FRAME_BASE}/enemy_basic_idle_02.png?v=20260727-clean-v2`,
  `${FRAME_BASE}/enemy_basic_idle_03.png?v=20260727-clean-v2`,
  `${FRAME_BASE}/enemy_basic_idle_04.png?v=20260727-clean-v2`,
  `${FRAME_BASE}/enemy_basic_idle_05.png?v=20260727-clean-v2`,
  `${FRAME_BASE}/enemy_basic_idle_06.png?v=20260727-clean-v2`,
  `${FRAME_BASE}/enemy_basic_idle_07.png?v=20260727-clean-v2`,
  `${FRAME_BASE}/enemy_basic_idle_08.png?v=20260727-clean-v2`,
] as const;

export const ENEMY_BASIC_IDLE_FPS = 8;
