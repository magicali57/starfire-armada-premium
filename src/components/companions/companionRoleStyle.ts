import type { BattleModeIconVariant } from "@/components/icons/BattleModeIcon";
import type { CompanionRosterFilter } from "@/data/companionRoster";

// Shared per-role icon/color lookup used by both the filter pill row and
// each roster card's role row, so the two stay visually consistent. Colors
// map to existing design tokens (danger=red/Attack, secondary=cyan-blue/
// Defense, success=green/Support-Repair, primary=purple/Utility) rather
// than inventing new ones — see tokens.css. Icons reuse BattleModeIcon's
// existing "swords"/"shield" variants plus the new "medicalCross"/"wrench"
// variants added for this screen (see BattleModeIcon.tsx's own comment).
export const COMPANION_FILTER_ICON: Record<Exclude<CompanionRosterFilter, "all">, BattleModeIconVariant> = {
  attack: "swords",
  defense: "shield",
  repair: "medicalCross",
  utility: "wrench",
};

export const COMPANION_FILTER_COLOR_VAR: Record<Exclude<CompanionRosterFilter, "all">, string> = {
  attack: "var(--color-danger-300)",
  defense: "var(--color-secondary-300)",
  repair: "var(--color-success-300)",
  utility: "var(--color-primary-300)",
};
