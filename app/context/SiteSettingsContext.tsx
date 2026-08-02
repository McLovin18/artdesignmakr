"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { db } from "../lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

type SiteSettings = {
  productWatermarkUrl: string | null;
};

type SiteSettingsContextType = {
  settings: SiteSettings;
  loading: boolean;
};

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined);

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [productWatermarkUrl, setProductWatermarkUrl] = useState<string | null>(null);

  useEffect(() => {
    const ref = doc(db, "landingPage", "main");
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const data = (snap.data() || {}) as Record<string, unknown>;
        const url = typeof data.productWatermarkUrl === "string" ? data.productWatermarkUrl : null;
        setProductWatermarkUrl(url);
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const value = useMemo<SiteSettingsContextType>(() => {
    return {
      loading,
      settings: {
        productWatermarkUrl,
      },
    };
  }, [loading, productWatermarkUrl]);

  return (
    <SiteSettingsContext.Provider value={value}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings(): SiteSettingsContextType {
  const ctx = useContext(SiteSettingsContext);
  if (!ctx) {
    throw new Error("useSiteSettings must be used within SiteSettingsProvider");
  }
  return ctx;
}

