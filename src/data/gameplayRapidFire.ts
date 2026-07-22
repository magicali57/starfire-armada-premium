import { CHAPTER_BACKGROUND_IMAGE, RAPID_FIRE_GAMEPLAY_ASSETS, SHIP_GAMEPLAY_SPRITE } from "@/data/assetRegistry";

/** Focused manifest for the Rapid-Fire ch1-stage-1 combat slice. */
export const RAPID_FIRE_SLICE_ASSETS = {
  shipSprite: SHIP_GAMEPLAY_SPRITE["ship-01-rapid-fire"],
  background: CHAPTER_BACKGROUND_IMAGE["chapter-01"],
  ...RAPID_FIRE_GAMEPLAY_ASSETS,
} as const;

export const RAPID_FIRE_SHIP_ID = "ship-01-rapid-fire" as const;
export const RAPID_FIRE_SLICE_STAGE_ID = "ch1-stage-1" as const;
