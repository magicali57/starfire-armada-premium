import type { ModuleSlot, PlayerLoadout } from "@/types";

// In-memory-only, non-persistent, tab/session-scoped draft cache for the
// Loadout Manager screen's in-progress companion/module selections.
// NOT PlayerState, NOT localStorage/sessionStorage — a plain module-level
// variable, the exact same mechanism LoadoutManagerScreen.tsx originally
// implemented as a private `let inMemoryDraftCache` (see
// LOADOUT_MANAGER_COMPLETION_REPORT.md). Centralized here — rather than
// left private to LoadoutManagerScreen.tsx — so Companion Detail can
// safely update just the draft's companion selection and Module Detail can
// safely update one compatible module selection without either
// screen reaching into the other's private module state or a second,
// incompatible draft mechanism being invented.
//
// Cleared only by Loadout Manager's own Save, Reset, and Discard actions
// (via clearLoadoutDraftSession) — opening or closing Companion Detail
// never clears it. External detail screens write only through the narrow
// companion/module helpers below. Never consulted after a real page
// reload — a reload always starts Loadout Manager from the real saved
// `player.activeLoadout`, exactly as before this file existed.
let draftSession: PlayerLoadout | null = null;

export function getLoadoutDraftSession(): PlayerLoadout | null {
  return draftSession;
}

export function setLoadoutDraftSession(loadout: PlayerLoadout): void {
  draftSession = loadout;
}

/**
 * Updates only the companion slot of the existing draft session, leaving
 * any unsaved core/plating/system module selections completely untouched
 * — this is what makes it safe for Companion Detail to call from outside
 * Loadout Manager without corrupting an in-progress module draft.
 *
 * If no draft session exists yet (e.g. Companion Detail was opened via a
 * direct reload straight into `?return=loadout` before Loadout Manager
 * ever mounted this session in this tab), a new session is seeded from
 * `fallback` (the caller passes the real, currently-saved
 * `player.activeLoadout`) so the companion change still has somewhere
 * safe to live until Loadout Manager itself mounts and picks up this
 * exact session via `getLoadoutDraftSession()`.
 */
export function updateLoadoutDraftCompanion(companionId: string, fallback: PlayerLoadout): PlayerLoadout {
  const base = draftSession ?? fallback;
  const next: PlayerLoadout = { ...base, companionId };
  draftSession = next;
  return next;
}

/** Updates exactly one compatible module slot while preserving the
 * companion and the other two module selections. Module Detail validates
 * the real definition before calling this narrow draft helper. */
export function updateLoadoutDraftModule(
  moduleId: string,
  slot: ModuleSlot,
  fallback: PlayerLoadout,
): PlayerLoadout {
  const base = draftSession ?? fallback;
  const next: PlayerLoadout =
    slot === "core"
      ? { ...base, coreModuleId: moduleId }
      : slot === "plating"
        ? { ...base, platingModuleId: moduleId }
        : { ...base, systemModuleId: moduleId };
  draftSession = next;
  return next;
}

export function clearLoadoutDraftSession(): void {
  draftSession = null;
}
