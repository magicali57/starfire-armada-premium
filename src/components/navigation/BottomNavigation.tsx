import { ROUTES, navigate } from "@/app/routes";
import { useHashRoute } from "@/app/useHashRoute";
import "./BottomNavigation.css";

const NAV_ITEMS: { id: (typeof ROUTES)[number]["id"]; icon: string }[] = [
  { id: "home", icon: "⌂" },
  { id: "ship-selection", icon: "✈" },
  { id: "campaign", icon: "☄" },
  { id: "ship-upgrade", icon: "▲" },
];

export function BottomNavigation() {
  const activeRoute = useHashRoute();

  return (
    <nav className="bottom-nav" aria-label="Primary">
      {NAV_ITEMS.map((item) => {
        const route = ROUTES.find((r) => r.id === item.id)!;
        const isActive = activeRoute === item.id;
        return (
          <button
            key={item.id}
            type="button"
            className={`bottom-nav__item press-scale${isActive ? " bottom-nav__item--active" : ""}`}
            onClick={() => navigate(item.id)}
            aria-current={isActive ? "page" : undefined}
          >
            <span className="bottom-nav__icon" aria-hidden="true">
              {item.icon}
            </span>
            <span className="bottom-nav__label">{route.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
