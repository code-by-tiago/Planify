"use client";

import { useEffect, useState } from "react";

/** Desativa animações Framer Motion em viewports mobile (artefatos de GPU no Android). */
export function useLandingMobileStatic() {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return mobile;
}
