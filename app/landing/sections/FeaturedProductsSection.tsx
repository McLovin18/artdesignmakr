"use client";

import React from "react";
import Link from "next/link";
import type {
  LandingSectionStyles,
  LandingFieldStyle,
} from "../../lib/landing-types";
import ProductoCard from "../../components/ProductoCard";
import {
  mapCategorySnapshot,
  sortCategoriasByOrder,
  sameCategoryId,
  productMatchesCategoria,
} from "../../lib/categorias-db";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";

export type FeaturedProductsSectionProps = {
  title?: string;
  products?: any[];
  styles?: LandingSectionStyles;
  fieldStyles?: Record<string, LandingFieldStyle>;
  device?: "mobile" | "desktop";
};

const MAX_PRODUCTS = 6;

// Esta sección solo muestra productos de la categoría "Ramos"
const RAMOS_CATEGORY_ID = "1784988607164";

// Extrae la fecha de creación de un producto en milisegundos,
// soportando Firestore Timestamp, Date, string ISO o number.
function getCreatedAtMillis(prod: any): number {
  const raw = prod?.createdAt ?? prod?.fechaCreacion ?? prod?.created_at ?? prod?.creadoEn;

  if (!raw) return 0;

  // Firestore Timestamp (tiene .seconds) o { _seconds }
  if (typeof raw === "object") {
    if (typeof raw.toMillis === "function") return raw.toMillis();
    if (typeof raw.seconds === "number") return raw.seconds * 1000;
    if (typeof raw._seconds === "number") return raw._seconds * 1000;
  }

  // Date, string ISO o number (epoch)
  const parsed = new Date(raw).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

export default function FeaturedProductsSection({
  title = "Productos recientes",
  products = [],
  styles,
  fieldStyles,
}: FeaturedProductsSectionProps) {
  const paddingTop = styles?.paddingTop || (typeof window !== "undefined" && window.innerWidth < 768 ? "0.5rem" : "2rem");
  const paddingBottom = styles?.paddingBottom || (typeof window !== "undefined" && window.innerWidth < 768 ? "0.5rem" : "0.5rem");

  // Necesitamos el árbol de categorías para poder resolver correctamente
  // a qué categoría pertenece cada producto (igual que en /productos)
  const [categorias, setCategorias] = React.useState<any[]>([]);

  React.useEffect(() => {
    const categoriasRef = collection(db, "categorias");
    const unsubscribe = onSnapshot(query(categoriasRef), (snapshot) => {
      setCategorias(sortCategoriasByOrder(mapCategorySnapshot(snapshot.docs)));
    });
    return () => unsubscribe();
  }, []);

  // Filtra productos válidos de la categoría Ramos, ordena por fecha de creación (más nuevo primero) y limita a 6
  const recentProducts = React.useMemo(() => {
    return products
      .filter((prod: any) => prod && prod.id)
      .filter((prod: any) => {
        if (categorias.length > 0) {
          return productMatchesCategoria(prod, RAMOS_CATEGORY_ID, categorias);
        }
        // Fallback mientras cargan las categorías: comparación directa por id
        return sameCategoryId(prod?.categoria, RAMOS_CATEGORY_ID);
      })
      .sort((a: any, b: any) => getCreatedAtMillis(b) - getCreatedAtMillis(a))
      .slice(0, MAX_PRODUCTS);
  }, [products, categorias]);

  // ── Return condicional DESPUÉS de todos los hooks ──
  if (!recentProducts.length) return null;

  return (
    <section
      style={{ paddingTop, paddingBottom }}
      className="w-full max-w-full px-2 md:px-2 flex flex-col items-center m-0 overflow-x-hidden"
    >
      {/* Título */}
      {title && (
        <h2
          className="section-title text-center py-2"
          style={fieldStyles?.title || { color: "var(--text)" }}
        >
          {title}
        </h2>
      )}

      <div className="w-full max-w-7xl mx-auto px-2 sm:px-6 md:px-12">
        {/* ── Grid: 1 columna en móvil, 3 desde sm ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5 md:gap-6">
          {recentProducts.map((prod: any, idx: number) => (
            <div
              key={prod.id}
              className="transition-all duration-300 flex flex-col items-stretch justify-stretch h-full"
            >
              <ProductoCard producto={prod} index={idx} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}