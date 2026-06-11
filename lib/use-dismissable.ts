"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Etat ouvert/fermé d'un menu flottant, avec fermeture au clic extérieur
 * et à la touche Échap.
 */
export function useDismissable<T extends HTMLElement>() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<T | null>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return { containerRef, open, setOpen };
}
