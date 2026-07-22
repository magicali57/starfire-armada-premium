import { HOME_BOTTOM_NAV_FINAL } from "@/data/assetRegistry";
import { navigate } from "@/app/routes";
import "./HubBottomNav.css";

export type HubNavTabId = "home" | "battle" | "fleet" | "inventory" | "shop";

interface HubBottomNavProps {
  active: HubNavTabId;
  onComingSoon?: (title: string, message: string) => void;
}

const TABS: { id: HubNavTabId; label: string; icon: string }[] = [
  { id: "home", label: "HOME", icon: HOME_BOTTOM_NAV_FINAL.home },
  { id: "battle", label: "BATTLE", icon: HOME_BOTTOM_NAV_FINAL.battle },
  { id: "fleet", label: "FLEET", icon: HOME_BOTTOM_NAV_FINAL.fleet },
  { id: "inventory", label: "INVENTORY", icon: HOME_BOTTOM_NAV_FINAL.inventory },
  { id: "shop", label: "SHOP", icon: HOME_BOTTOM_NAV_FINAL.shop },
];

/**
 * Reusable five-tab bottom navigation for every non-Home hub screen.
 *
 * Visually reproduces Home's own bottom nav exactly — same assets
 * (`HOME_BOTTOM_NAV_FINAL`), same layout/spacing/clip-path/active-tab
 * treatment — modeled on `HomeScreen.tsx`'s private `HomeBottomNav`. Home
 * itself is untouched; this is a separate, pixel-matching implementation,
 * per instruction, since extracting Home's actual code risked a visual
 * regression there. Must be rendered as the `footer` of a `HubScreenShell`
 * (its grid row 5) — that's what gives it Home's exact height/width/
 * position; this component has no layout opinion of its own beyond its
 * internal five-tab grid.
 *
 * Every tab navigates to its implemented top-level hub, including Shop
 * (#/shop).
 */
export function HubBottomNav({ active, onComingSoon: _onComingSoon = () => {} }: HubBottomNavProps) {
  const handleTap = (id: HubNavTabId) => {
    switch (id) {
      case "home":
        return navigate("home");
      case "battle":
        return navigate("battle");
      case "fleet":
        return navigate("ship-selection");
      case "inventory":
        return navigate("inventory");
      case "shop":
        return navigate("shop");
    }
  };

  return (
    <nav className="hub-bottom-nav" aria-label="Primary">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`hub-bottom-nav__item press-scale${
            tab.id === active ? " hub-bottom-nav__item--active" : ""
          }`}
          onClick={() => handleTap(tab.id)}
          aria-current={tab.id === active ? "page" : undefined}
        >
          <img src={tab.icon} alt="" />
          <strong>{tab.label}</strong>
        </button>
      ))}
    </nav>
  );
}
