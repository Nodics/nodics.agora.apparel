import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
}

export function useCompactListing() {
  return useSyncExternalStore(
    subscribe,
    () => window.innerWidth <= 780,
    () => false,
  );
}
