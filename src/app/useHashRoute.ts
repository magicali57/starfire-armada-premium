import { useEffect, useState } from "react";
import { resolveRoute, type RouteId } from "./routes";

// Minimal hash-based router: safe for static hosting (GitHub Pages, nested
// paths) since it never touches the History API's path segment.
export function useHashRoute(): RouteId {
  const [route, setRoute] = useState<RouteId>(() =>
    resolveRoute(window.location.hash || "#/home"),
  );

  useEffect(() => {
    if (!window.location.hash) {
      window.location.hash = "#/home";
    }
    const handleHashChange = () => {
      setRoute(resolveRoute(window.location.hash));
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return route;
}
