export type RouteId =
  | "home"
  | "battle"
  | "ship-selection"
  | "ship-selection-legacy"
  | "ship-detail-placeholder"
  | "ship-detail-legacy-placeholder"
  | "ship-upgrade"
  // Dynamic route (#/ships/<shipId>/rank) — same prefix-parse pattern as
  // companion/module/weapon detail routes. Never passed to pathFor/navigate;
  // always build URLs with pathForShipStarRank(shipId).
  | "ship-star-rank"
  // Dynamic route (#/ships/<shipId>/abilities) — same pattern as
  // ship-star-rank. Always build URLs with pathForShipAbilities(shipId).
  | "ship-abilities"
  | "campaign"
  | "campaign-chapter-map"
  | "campaign-chapter-map-legacy"
  | "stage-detail"
  | "stage-detail-legacy-placeholder"
  | "pre-battle-placeholder"
  | "pre-battle-legacy-placeholder"
  | "battle-launch"
  | "gameplay"
  | "results"
  | "inventory"
  | "loadout"
  | "chest-opening"
  | "companions"
  | "companion-upgrade"
  | "modules"
  | "module-upgrade"
  | "module-detail"
  | "arsenal"
  | "weapon-detail"
  | "weapon-upgrade"
  | "profile"
  // Dynamic route — see COMPANION_DETAIL_PREFIX / getCompanionIdFromHash /
  // pathForCompanionDetail below. There is no single static path for this
  // id (the real path always carries a companion id segment), so it is
  // NEVER passed to `pathFor`/`navigate` — always use
  // `pathForCompanionDetail(companionId, returnTarget)` to build a real
  // URL for this route instead.
  | "companion-detail";

export const ROUTES: { id: RouteId; path: string; label: string }[] = [
  { id: "home", path: "#/home", label: "Home" },
  { id: "battle", path: "#/battle", label: "Battle" },
  // The real Fleet Roster screen now renders at this route id/path — kept
  // unchanged deliberately (not renamed to "fleet") because HubBottomNav's
  // Fleet tab and HomeScreen's own Fleet shortcut are both hardcoded to
  // `navigate("ship-selection")` and are off-limits to edit. Same
  // "keep route id, repoint target component" pattern already used for
  // Stage Detail and Pre-Battle.
  { id: "ship-selection", path: "#/ships", label: "Fleet" },
  // Internal/debug only — the original Ship Selection screen, relocated
  // here for comparison once Fleet Roster took over the normal-facing route
  // above. Not linked from any button or the normal flow. This screen
  // renders bare content (no shell of its own), so it keeps the shared
  // BottomNavigation rather than being added to AppShell's exclusion list.
  { id: "ship-selection-legacy", path: "#/ships/legacy-roster", label: "Ship Selection (Legacy)" },
  // The real Ship Detail screen. Route id kept as "ship-detail-placeholder"
  // (not renamed) deliberately — Fleet Roster's Details button already
  // navigates via `pathFor("ship-detail-placeholder")`, so keeping the id
  // unchanged means Fleet Roster needs zero edits while this id's target
  // component becomes the real screen. Same "?id=" convention as the rest
  // of the project.
  { id: "ship-detail-placeholder", path: "#/ships/detail", label: "Ship Detail" },
  // Internal/debug only — the original temporary placeholder, relocated
  // here for comparison once the real screen took over the normal-facing
  // route above. Not linked from any button or the normal flow.
  {
    id: "ship-detail-legacy-placeholder",
    path: "#/ships/detail/placeholder",
    label: "Ship Detail (Legacy Placeholder)",
  },
  { id: "ship-upgrade", path: "#/ships/upgrade", label: "Upgrade" },
  // Documentation-only path shape (same convention as companion-detail
  // below) — real URLs always carry a ship id segment via
  // pathForShipStarRank.
  { id: "ship-star-rank", path: "#/ships/:shipId/rank", label: "Star Rank" },
  { id: "ship-abilities", path: "#/ships/:shipId/abilities", label: "Abilities" },
  { id: "campaign", path: "#/campaign", label: "Campaign" },
  { id: "campaign-chapter-map", path: "#/campaign/chapter-map", label: "Chapter Map" },
  // Internal/debug only — the relocated legacy stage-list screen, kept
  // solely for comparison. Not linked from any button or the normal flow.
  {
    id: "campaign-chapter-map-legacy",
    path: "#/campaign/chapter-map/legacy",
    label: "Chapter Map (Legacy)",
  },
  // The real Campaign Stage Detail screen. The selected stage id rides
  // along as a "?id=" suffix (stripped below before the exact-match
  // lookup), not a parsed path segment, since this router has no param
  // syntax.
  { id: "stage-detail", path: "#/campaign/stage-detail", label: "Stage Detail" },
  // Internal/debug only — the original temporary placeholder, relocated
  // here for comparison once the real screen took over the normal-facing
  // route above. Not linked from any button or the normal flow.
  {
    id: "stage-detail-legacy-placeholder",
    path: "#/campaign/stage-detail/legacy-placeholder",
    label: "Stage Detail (Legacy Placeholder)",
  },
  // The real Pre-Battle screen. Route id kept as "pre-battle-placeholder"
  // (not renamed to "pre-battle") deliberately — Stage Detail's own
  // "Prepare" button already navigates via `pathFor("pre-battle-placeholder")`,
  // so keeping the id unchanged means Stage Detail needs zero edits while
  // this id's target component becomes the real screen. Same "?id="
  // convention as stage-detail above.
  { id: "pre-battle-placeholder", path: "#/campaign/pre-battle", label: "Pre-Battle" },
  // Internal/debug only — the original temporary Pre-Battle placeholder,
  // relocated here for comparison once the real screen took over the
  // normal-facing route above. Not linked from any button or the normal
  // flow.
  {
    id: "pre-battle-legacy-placeholder",
    path: "#/campaign/pre-battle/legacy-placeholder",
    label: "Pre-Battle (Legacy Placeholder)",
  },
  // Minimal, disclosed placeholder for Pre-Battle's Start button — not real
  // gameplay integration. Same "?id=" convention as the rest of this flow.
  { id: "battle-launch", path: "#/campaign/battle-launch", label: "Battle Launch" },
  { id: "gameplay", path: "#/play", label: "Play" },
  { id: "results", path: "#/results", label: "Results" },
  { id: "inventory", path: "#/inventory", label: "Inventory" },
  // New route (Loadout Manager) — not a repoint of an existing placeholder,
  // since no prior screen occupied this path. Carries "?return=...&stage=..."
  // the same way stage-detail/pre-battle-placeholder carry "?id=" — see
  // getLoadoutReturnTarget in data/loadout.ts for how it's parsed.
  { id: "loadout", path: "#/inventory/loadout", label: "Loadout" },
  // New route (Chest Opening) — same static "#/inventory/<x>" convention
  // as loadout/companions/modules above.
  { id: "chest-opening", path: "#/inventory/chests", label: "Chest Vault" },
  // New route (Companions Roster) — same "?return=..." convention as
  // loadout above; see getCompanionRosterReturnTarget in
  // data/companionRoster.ts for how it's parsed.
  { id: "companions", path: "#/inventory/companions", label: "Companions" },
  {
    id: "companion-upgrade",
    path: "#/inventory/companions/:companionId/upgrade",
    label: "Companion Upgrade",
  },
  // Documentation-only entry — "path" here is illustrative (matches the
  // navigation blueprint's own documented shape), never a real navigable
  // URL. `pathFor("companion-detail")` is never called anywhere in this
  // codebase; use `pathForCompanionDetail` instead. Kept in ROUTES so the
  // route id has a human-readable label (BottomNavigation-style menus
  // that iterate ROUTES by id never reference this id, confirmed by
  // inspection of the only two ROUTES consumers in this codebase).
  { id: "companion-detail", path: "#/inventory/companions/:companionId", label: "Companion Detail" },
  { id: "modules", path: "#/inventory/modules", label: "Modules" },
  {
    id: "module-upgrade",
    path: "#/inventory/modules/:moduleId/upgrade",
    label: "Module Upgrade",
  },
  {
    id: "module-detail",
    path: "#/inventory/modules/:moduleId",
    label: "Module Detail",
  },
  { id: "arsenal", path: "#/arsenal", label: "Arsenal" },
  { id: "weapon-detail", path: "#/arsenal/weapon/:weaponId", label: "Weapon Detail" },
  { id: "weapon-upgrade", path: "#/arsenal/weapon/:weaponId/upgrade", label: "Weapon Upgrade" },
  { id: "profile", path: "#/profile", label: "Profile" },
];

// ---------------------------------------------------------------------------
// Ship Star Rank dynamic route (#/ships/<shipId>/rank)
// ---------------------------------------------------------------------------

const SHIPS_PREFIX = "#/ships/";

/** Strictly parses `#/ships/<shipId>/rank` (optional `?...` query ignored).
 * Rejects the static `#/ships/...` routes (none end in `/rank`), empty ids,
 * extra segments, and malformed encoding — returns null, never throws. */
export function getShipStarRankIdFromHash(hash: string): string | null {
  const queryIndex = hash.indexOf("?");
  const path = queryIndex === -1 ? hash : hash.slice(0, queryIndex);
  if (!path.startsWith(SHIPS_PREFIX)) return null;
  const remainder = path.slice(SHIPS_PREFIX.length);
  const suffix = "/rank";
  if (!remainder.endsWith(suffix)) return null;
  const rawId = remainder.slice(0, -suffix.length);
  if (!rawId || rawId.includes("/")) return null;
  try {
    const decoded = decodeURIComponent(rawId);
    return decoded.length > 0 ? decoded : null;
  } catch {
    return null;
  }
}

/** The only supported way to build a Ship Star Rank URL. */
export const pathForShipStarRank = (shipId: string) =>
  `${SHIPS_PREFIX}${encodeURIComponent(shipId)}/rank`;

/** Strictly parses `#/ships/<shipId>/abilities` — same rules as
 * getShipStarRankIdFromHash. */
export function getShipAbilitiesIdFromHash(hash: string): string | null {
  const queryIndex = hash.indexOf("?");
  const path = queryIndex === -1 ? hash : hash.slice(0, queryIndex);
  if (!path.startsWith(SHIPS_PREFIX)) return null;
  const remainder = path.slice(SHIPS_PREFIX.length);
  const suffix = "/abilities";
  if (!remainder.endsWith(suffix)) return null;
  const rawId = remainder.slice(0, -suffix.length);
  if (!rawId || rawId.includes("/")) return null;
  try {
    const decoded = decodeURIComponent(rawId);
    return decoded.length > 0 ? decoded : null;
  } catch {
    return null;
  }
}

/** The only supported way to build a Ship Abilities URL. */
export const pathForShipAbilities = (shipId: string) =>
  `${SHIPS_PREFIX}${encodeURIComponent(shipId)}/abilities`;

const WEAPON_DETAIL_PREFIX = "#/arsenal/weapon/";
export function getWeaponUpgradeIdFromHash(hash:string):string|null{const path=hash.split("?")[0];if(!path.startsWith(WEAPON_DETAIL_PREFIX)||!path.endsWith("/upgrade"))return null;const raw=path.slice(WEAPON_DETAIL_PREFIX.length,-"/upgrade".length);if(!raw||raw.includes("/"))return null;try{return decodeURIComponent(raw)}catch{return null}}
export const pathForWeaponUpgrade=(weaponId:string)=>`${WEAPON_DETAIL_PREFIX}${encodeURIComponent(weaponId)}/upgrade`;
export function getWeaponIdFromHash(hash: string): string | null {
  const path = hash.split("?")[0];
  if (!path.startsWith(WEAPON_DETAIL_PREFIX)) return null;
  const rawId = path.slice(WEAPON_DETAIL_PREFIX.length);
  if (!rawId || rawId.includes("/")) return null;
  try { return decodeURIComponent(rawId); } catch { return null; }
}
export const pathForWeaponDetail = (weaponId: string) => `${WEAPON_DETAIL_PREFIX}${encodeURIComponent(weaponId)}`;

// ---------------------------------------------------------------------------
// Companion Detail dynamic route (#/inventory/companions/<id>)
// ---------------------------------------------------------------------------

const COMPANION_DETAIL_PREFIX = "#/inventory/companions/";

export type CompanionDetailReturnTarget = "companions" | "loadout" | "home";
export type CompanionUpgradeOrigin = "companions" | "loadout" | "home";

/** Strictly parses `#/inventory/companions/<id>/upgrade`. Detail URLs,
 * missing suffixes, extra segments and malformed encodings are rejected. */
export function getCompanionUpgradeIdFromHash(hash: string): string | null {
  const queryIndex = hash.indexOf("?");
  const path = queryIndex === -1 ? hash : hash.slice(0, queryIndex);
  if (!path.startsWith(COMPANION_DETAIL_PREFIX)) return null;
  const remainder = path.slice(COMPANION_DETAIL_PREFIX.length);
  const suffix = "/upgrade";
  if (!remainder.endsWith(suffix)) return null;
  const rawId = remainder.slice(0, -suffix.length);
  if (!rawId || rawId.includes("/")) return null;
  try {
    const decoded = decodeURIComponent(rawId);
    return decoded.length > 0 ? decoded : null;
  } catch {
    return null;
  }
}

export function pathForCompanionUpgrade(
  companionId: string,
  origin?: CompanionUpgradeOrigin,
): string {
  const base = `${COMPANION_DETAIL_PREFIX}${encodeURIComponent(companionId)}/upgrade`;
  return origin ? `${base}?origin=${origin}` : base;
}

/**
 * Parses a companion id out of a hash of the shape
 * `#/inventory/companions/<id>` (optionally followed by a `?...` query).
 * Returns null (never throws) for anything that isn't a valid detail-path
 * shape:
 *   - not under the `#/inventory/companions/` prefix at all (including the
 *     bare `#/inventory/companions` roster route itself, which has no
 *     trailing slash)
 *   - an empty id segment (`#/inventory/companions/`)
 *   - an id segment containing a further `/` (e.g. a future
 *     `#/inventory/companions/<id>/upgrade` sub-route — deliberately
 *     rejected so it can never be mistaken for a Detail path even before
 *     that sub-route exists)
 *   - malformed percent-encoding that fails to decode
 *
 * This is the single, central place that understands this route's shape —
 * screens should call this (or `resolveRoute`) rather than parsing
 * `window.location.hash` themselves.
 */
export function getCompanionIdFromHash(hash: string): string | null {
  const queryIndex = hash.indexOf("?");
  const path = queryIndex === -1 ? hash : hash.slice(0, queryIndex);
  if (!path.startsWith(COMPANION_DETAIL_PREFIX)) return null;
  const rawId = path.slice(COMPANION_DETAIL_PREFIX.length);
  if (rawId.length === 0 || rawId.includes("/")) return null;
  try {
    const decoded = decodeURIComponent(rawId);
    return decoded.length > 0 ? decoded : null;
  } catch {
    return null;
  }
}

/** Builds a real, safe navigable URL for Companion Detail — the only
 *  supported way to construct one. `companionId` is percent-encoded so an
 *  id containing reserved characters can never corrupt the path. */
export function pathForCompanionDetail(
  companionId: string,
  returnTarget?: CompanionDetailReturnTarget,
): string {
  const base = `${COMPANION_DETAIL_PREFIX}${encodeURIComponent(companionId)}`;
  return returnTarget ? `${base}?return=${returnTarget}` : base;
}

// ---------------------------------------------------------------------------
// Module Detail dynamic route (#/inventory/modules/<id>)
// ---------------------------------------------------------------------------

const MODULE_DETAIL_PREFIX = "#/inventory/modules/";

export type ModuleDetailOrigin = "loadout" | "pre-battle" | "modules" | "direct";
export type ModuleUpgradeOrigin = "modules" | "module-detail" | "loadout";

/** Strictly parses `#/inventory/modules/<id>/upgrade`. */
export function getModuleUpgradeIdFromHash(hash: string): string | null {
  const queryIndex = hash.indexOf("?");
  const path = queryIndex === -1 ? hash : hash.slice(0, queryIndex);
  if (!path.startsWith(MODULE_DETAIL_PREFIX)) return null;
  const remainder = path.slice(MODULE_DETAIL_PREFIX.length);
  const suffix = "/upgrade";
  if (!remainder.endsWith(suffix)) return null;
  const rawId = remainder.slice(0, -suffix.length);
  if (!rawId || rawId.includes("/")) return null;
  try {
    const decoded = decodeURIComponent(rawId);
    return decoded.length > 0 ? decoded : null;
  } catch {
    return null;
  }
}

export function pathForModuleUpgrade(moduleId: string, origin?: ModuleUpgradeOrigin): string {
  const base = `${MODULE_DETAIL_PREFIX}${encodeURIComponent(moduleId)}/upgrade`;
  return origin ? `${base}?origin=${origin}` : base;
}

/** Strictly parses one module-id segment and safely rejects malformed or
 * nested paths, including the future `/upgrade` route. */
export function getModuleIdFromHash(hash: string): string | null {
  const queryIndex = hash.indexOf("?");
  const path = queryIndex === -1 ? hash : hash.slice(0, queryIndex);
  if (!path.startsWith(MODULE_DETAIL_PREFIX)) return null;
  const rawId = path.slice(MODULE_DETAIL_PREFIX.length);
  if (!rawId || rawId.includes("/")) return null;
  try {
    const decoded = decodeURIComponent(rawId);
    return decoded.length > 0 ? decoded : null;
  } catch {
    return null;
  }
}

export function pathForModuleDetail(moduleId: string, origin?: ModuleDetailOrigin): string {
  const base = `${MODULE_DETAIL_PREFIX}${encodeURIComponent(moduleId)}`;
  return origin && origin !== "direct" ? `${base}?origin=${origin}` : base;
}

const HASH_TO_ROUTE: Record<string, RouteId> = {
  "#/home": "home",
  "#/battle": "battle",
  "#/ships": "ship-selection",
  "#/ships/legacy-roster": "ship-selection-legacy",
  "#/ships/detail": "ship-detail-placeholder",
  "#/ships/detail/placeholder": "ship-detail-legacy-placeholder",
  "#/ships/upgrade": "ship-upgrade",
  "#/campaign": "campaign",
  "#/campaign/chapter-map": "campaign-chapter-map",
  "#/campaign/chapter-map/legacy": "campaign-chapter-map-legacy",
  "#/campaign/stage-detail": "stage-detail",
  "#/campaign/stage-detail/legacy-placeholder": "stage-detail-legacy-placeholder",
  "#/campaign/pre-battle": "pre-battle-placeholder",
  "#/campaign/pre-battle/legacy-placeholder": "pre-battle-legacy-placeholder",
  "#/campaign/battle-launch": "battle-launch",
  "#/play": "gameplay",
  "#/results": "results",
  "#/inventory": "inventory",
  "#/inventory/loadout": "loadout",
  "#/inventory/chests": "chest-opening",
  "#/inventory/companions": "companions",
  "#/inventory/modules": "modules",
  "#/arsenal": "arsenal",
  "#/profile": "profile",
};

export function resolveRoute(hash: string): RouteId {
  // Strip a "?..." suffix (used by the Chapter Map to carry a selected
  // stage id) before the exact-match lookup — any existing hash without a
  // "?" behaves exactly as before.
  const queryIndex = hash.indexOf("?");
  const path = queryIndex === -1 ? hash : hash.slice(0, queryIndex);
  const staticMatch = HASH_TO_ROUTE[path];
  if (staticMatch) return staticMatch;
  // Upgrade must be checked before Detail so Detail can never consume a
  // valid /upgrade URL.
  if (getShipStarRankIdFromHash(hash) !== null) return "ship-star-rank";
  if (getShipAbilitiesIdFromHash(hash) !== null) return "ship-abilities";
  if (getCompanionUpgradeIdFromHash(hash) !== null) return "companion-upgrade";
  if (getModuleUpgradeIdFromHash(hash) !== null) return "module-upgrade";
  // Static table has no exact entry — try the Detail dynamic route.
  // getCompanionIdFromHash safely rejects the bare
  // "#/inventory/companions" roster path (no trailing id), empty ids,
  // extra segments (a future "/upgrade" sub-route), and malformed
  // encoding, so this can never accidentally shadow a static route or
  // match a malformed URL.
  if (getCompanionIdFromHash(hash) !== null) return "companion-detail";
  if (getModuleIdFromHash(hash) !== null) return "module-detail";
  if (getWeaponUpgradeIdFromHash(hash) !== null) return "weapon-upgrade";
  if (getWeaponIdFromHash(hash) !== null) return "weapon-detail";
  return "home";
}

export function pathFor(route: RouteId): string {
  return ROUTES.find((r) => r.id === route)?.path ?? "#/home";
}

export function navigate(route: RouteId) {
  window.location.hash = pathFor(route);
}
