"use client";
import { useRouter, useSearchParams } from "next/navigation";
import ProductoCard from "../components/ProductoCard";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import type { Producto } from "../lib/productos-db";
import { obtenerProductos } from "../lib/productos-db";
import BottomBarPublic from "../components/BottomBarPublic";
import {
  mapCategorySnapshot,
  sortCategoriasByOrder,
  sameCategoryId,
  productMatchesCategoria,
  productMatchesSubcategoria,
  productMatchesSubsubcategoria,
} from "../lib/categorias-db";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";

// Categoría de "Trabajos entregados" — solo debe mostrarse en la grilla
// de productos cuando el usuario la selecciona explícitamente, nunca en "Todos".
const TRABAJOS_ENTREGADOS_CAT_ID = "1785564342207";

export default function ProductosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const categoriaFromUrl = (
    searchParams?.get("cat") ||
    searchParams?.get("category") ||
    ""
  ).trim();
  const subcategoriaFromUrl = (
    searchParams?.get("subcat") ||
    searchParams?.get("subcategory") ||
    searchParams?.get("sub") ||
    ""
  ).trim();
  const subsubcategoriaFromUrl = (
    searchParams?.get("subsubcat") ||
    searchParams?.get("subsubcategory") ||
    searchParams?.get("subsub") ||
    ""
  ).trim();

  const [filterCat, setFilterCat] = useState(categoriaFromUrl);
  const [filterSub, setFilterSub] = useState(subcategoriaFromUrl);
  const [filterSubsub, setFilterSubsub] = useState(subsubcategoriaFromUrl);

  useEffect(() => {
    setFilterCat(categoriaFromUrl);
    setFilterSub(subcategoriaFromUrl);
    setFilterSubsub(subsubcategoriaFromUrl);
  }, [categoriaFromUrl, subcategoriaFromUrl, subsubcategoriaFromUrl]);

  const categoria = filterCat;
  const subcategoria = filterSub;
  const subsubcategoria = filterSubsub;

  const [currentPage, setCurrentPage] = useState(1);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");
  const [orden, setOrden] = useState("price-high");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [categorias, setCategorias] = useState<any[]>([]);
  const categoriesScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const categoriasRef = collection(db, "categorias");
    const unsubscribe = onSnapshot(query(categoriasRef), (snapshot) => {
      setCategorias(sortCategoriasByOrder(mapCategorySnapshot(snapshot.docs)));
    });
    return () => unsubscribe();
  }, []);

  const selectCategoria = useCallback(
    (catId: string) => {
      setFilterCat(catId);
      setFilterSub("");
      setFilterSubsub("");
      const url = catId
        ? `/productos?cat=${encodeURIComponent(catId)}`
        : "/productos";
      router.replace(url, { scroll: false });
    },
    [router]
  );

  const selectTodas = useCallback(() => {
    setFilterCat("");
    setFilterSub("");
    setFilterSubsub("");
    router.replace("/productos", { scroll: false });
  }, [router]);

  useEffect(() => {
    async function fetchProductos() {
      setLoading(true);
      try {
        const all = await obtenerProductos();
        let prods = all;

        if (categoria && categorias.length > 0) {
          prods = prods.filter((p) =>
            productMatchesCategoria(p, categoria, categorias)
          );
          if (subcategoria) {
            prods = prods.filter((p) =>
              productMatchesSubcategoria(
                p,
                categoria,
                subcategoria,
                categorias
              )
            );
          }
          if (subsubcategoria) {
            prods = prods.filter((p) =>
              productMatchesSubsubcategoria(
                p,
                categoria,
                subcategoria,
                subsubcategoria,
                categorias
              )
            );
          }
        } else if (categoria) {
          const needle = categoria.trim().toLowerCase();
          prods = all.filter(
            (p) =>
              String(p.categoria || "").trim().toLowerCase() === needle
          );
        }

        setProductos(prods);
      } catch (error) {
        console.error("Error cargando productos:", error);
        setProductos([]);
      } finally {
        setLoading(false);
      }
    }

    fetchProductos();
  }, [categoria, subcategoria, subsubcategoria, categorias]);

  useEffect(() => {
    const loggedIn = Boolean(localStorage.getItem("token"));
    setIsAuthenticated(loggedIn);
  }, []);

  const productosFiltrados = useMemo(() => {
    return productos
      .filter((p: any) => {
        if (categoria && categorias.length > 0) {
          if (!productMatchesCategoria(p, categoria, categorias)) return false;
        } else if (categoria && !sameCategoryId(p.categoria, categoria)) {
          return false;
        } else if (!categoria) {
          // "Todos": excluir siempre los productos de "Trabajos entregados"
          if (productMatchesCategoria(p, TRABAJOS_ENTREGADOS_CAT_ID, categorias)) {
            return false;
          }
        }

        if (subcategoria && categorias.length > 0) {
          if (
            !productMatchesSubcategoria(
              p,
              categoria,
              subcategoria,
              categorias
            )
          ) {
            return false;
          }
        } else if (subcategoria && !sameCategoryId(p.subcategoria, subcategoria)) {
          return false;
        }

        if (subsubcategoria && categorias.length > 0) {
          if (
            !productMatchesSubsubcategoria(
              p,
              categoria,
              subcategoria,
              subsubcategoria,
              categorias
            )
          ) {
            return false;
          }
        } else if (
          subsubcategoria &&
          !sameCategoryId(p.subsubcategoria, subsubcategoria)
        ) {
          return false;
        }

        const texto = search.toLowerCase().trim();
        const matchTexto =
          !texto ||
          (p.nombre?.toLowerCase() || "").includes(texto) ||
          (p.descripcion?.toLowerCase() || "").includes(texto);

        const base = Number(p.precio || 0);
        const disc = Number(p.descuento || 0);
        const finalPrice =
          disc > 0 && disc < 100 ? base * (1 - disc / 100) : base;

        const min = precioMin ? parseFloat(precioMin) : null;
        const max = precioMax ? parseFloat(precioMax) : null;
        const matchMin = min === null || finalPrice >= min;
        const matchMax = max === null || finalPrice <= max;

        return matchTexto && matchMin && matchMax;
      })
      .sort((a: any, b: any) => {
        const fp = (p: any) => {
          const base = Number(p.precio || 0);
          const d = Number(p.descuento || 0);
          return d > 0 && d < 100 ? base * (1 - d / 100) : base;
        };

        if (orden === "price-low") return fp(a) - fp(b);
        if (orden === "price-high") return fp(b) - fp(a);
        if (a.createdAt && b.createdAt) return b.createdAt - a.createdAt;
        return 0;
      });
  }, [
    productos,
    categoria,
    subcategoria,
    subsubcategoria,
    categorias,
    search,
    precioMin,
    precioMax,
    orden,
  ]);

  const getProductsPerPage = () => {
    if (typeof window !== "undefined") {
      if (window.innerWidth < 640) return 10;
      if (window.innerWidth >= 1024) return 12;
      if (window.innerWidth >= 768) return 9;
      if (window.innerWidth >= 640) return 6;
    }
    return 10;
  };
  const [productsPerPage, setProductsPerPage] = useState(getProductsPerPage());

  useEffect(() => {
    function handleResize() {
      setProductsPerPage(getProductsPerPage());
    }
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const totalPages = Math.ceil(productosFiltrados.length / productsPerPage);
  const paginatedProducts = productosFiltrados.slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [productosFiltrados.length, categoria, subcategoria, subsubcategoria, search, precioMin, precioMax]);

  const hasFilters = !!(search || precioMin || precioMax || orden !== "newest");

  const clearFilters = useCallback(() => {
    setSearch("");
    setPrecioMin("");
    setPrecioMax("");
    setOrden("newest");
  }, []);

  const inputCls =
    "px-3 py-2 rounded-xl border text-sm transition-all";
  const inputStyle = {
    borderColor: "var(--border)",
    background: "var(--card)",
    color: "var(--text)",
    boxShadow: "none",
  };

  return (
    <div className="min-h-screen flex flex-col transition-colors" style={{color: "var(--text)" }}>
      <BottomBarPublic />
      <main className="max-w-7xl mx-auto w-full px-3 sm:px-5 py-6 sm:py-15 flex-1">

      {categorias.length > 0 && (
        <div
          ref={categoriesScrollRef}
          className="mt-2 mb-8 w-full max-w-full flex items-center justify-start sm:justify-center gap-4 overflow-x-auto overflow-y-hidden pb-2 pl-4 pr-4 -mx-3 sm:mx-0 sm:px-3 sm:pr-2 no-scrollbar"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <button
            type="button"
            onClick={selectTodas}
            className="flex flex-col items-center w-24 shrink-0 select-none"
          >
            <div
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 shadow-sm flex items-center justify-center ${
                !categoria
                  ? "border-red-600 ring-2 ring-white/20"
                  : "border-white/20"
              } bg-black`}
            >
              <span className="text-xs font-bold tracking-wide text-white/80">
                TODOS
              </span>
            </div>

            <span
              className={`mt-2 text-sm ${
                !categoria ? "text-white" : "text-white/70"
              } text-center`}
            >
              Todos
            </span>
          </button>

          {categorias.map((cat) => {
            const selected = sameCategoryId(categoria, cat.id);

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => selectCategoria(cat.id)}
                className="flex flex-col items-center w-24 shrink-0 select-none"
              >
                <div
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 shadow-sm overflow-hidden ${
                    selected
                      ? "border-red-600 ring-2 ring-white/20"
                      : "border-white/20"
                  } bg-black`}
                >
                  {cat.imagen ? (
                    <img
                      src={cat.imagen}
                      alt={cat.nombre}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-2xl font-black text-white/70">
                        {cat.nombre.slice(0, 1).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                <span
                  className={`mt-2 text-sm ${
                    selected ? "text-white" : "text-white/70"
                  } text-center leading-tight`}
                >
                  {cat.nombre}
                </span>
              </button>
            );
          })}
        </div>
      )}

        {loading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden bg-white dark:bg-white/4 border border-slate-100 dark:border-white/10 shadow-sm animate-pulse">
                {/* Imagen placeholder */}
                <div className="w-full h-32 sm:h-48 bg-slate-200 dark:bg-white/10" />
                {/* Contenido placeholder */}
                <div className="p-1.5 sm:p-4 flex flex-col gap-2">
                  <div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-3/4" />
                  <div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-1/2" />
                  <div className="h-6 bg-slate-200 dark:bg-white/10 rounded w-1/3 mt-1" />
                </div>
              </div>
            ))}
          </div>
  ) : productosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center">
              <span className="material-icons-round text-3xl text-slate-300 dark:text-white/20">
                search_off
              </span>
            </div>
            <div>
              <p className="font-semibold text-slate-700 dark:text-white/80">Sin resultados</p>
              <p className="text-sm text-slate-400 dark:text-white/30 mt-1 max-w-60">
                {categoria
                  ? `No hay productos en "${categorias.find((c) => sameCategoryId(c.id, categoria))?.nombre || "esta categoría"}".`
                  : "Prueba otros términos o ajusta los filtros de precio"}
              </p>
            </div>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-purple-500 dark:text-#e8c862 underline underline-offset-2"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 animate-in fade-in duration-700">
              {paginatedProducts.map((p: any, index: number) => (
                <ProductoCard
                  key={p.id}
                  producto={p}
                  index={index}
                  showFav={isAuthenticated}
                  isCompact={false}
                />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex flex-wrap justify-center items-center gap-2 mt-8 select-none w-full">
                <button
                  className="px-3 py-1.5 rounded border text-xs font-medium bg-white border-slate-300 text-slate-900 hover:border-black/60 transition-all disabled:opacity-40"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  &lt;
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    className={`px-3 py-1.5 rounded border text-xs font-medium transition-all ${currentPage === n ? "bg-black border-black text-white shadow-sm" : "bg-white border-slate-300 text-slate-900 hover:border-black/60"}`}
                    onClick={() => setCurrentPage(n)}
                  >
                    {n}
                  </button>
                ))}
                <button
                  className="px-3 py-1.5 rounded border text-xs font-medium bg-white border-slate-300 text-slate-900 hover:border-black/60 transition-all disabled:opacity-40"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  &gt;
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}