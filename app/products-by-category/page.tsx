"use client";
import BottomBarPublic from "../components/BottomBarPublic";
import ProductoCard from "../components/ProductoCard";
import { Loading3DIcon } from "../components/Loading3DIcon";
import { useRouter, useSearchParams } from "next/navigation";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";

import { obtenerProductos } from "../lib/productos-db";
import {
  obtenerCategorias,
  mapCategorySnapshot,
  sortCategoriasByOrder,
  sameCategoryId,
  productMatchesCategoria,
  productMatchesSubcategoria,
  productMatchesSubsubcategoria,
} from "../lib/categorias-db";
import { useUser } from "../context/UserContext";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";

// Categoría de "Trabajos entregados" — solo debe mostrarse en la grilla
// de productos cuando el usuario la selecciona explícitamente, nunca en "Todos".
const TRABAJOS_ENTREGADOS_CAT_ID = "1785564342207";

export default function ProductsByCategoryPage() {
  // Estado para el mapeo de nombres
  const [catMap, setCatMap] = useState<any>({});
  const [subcatMap, setSubcatMap] = useState<any>({});
  const [subsubcatMap, setSubsubcatMap] = useState<any>({});
  const router = useRouter();

  useEffect(() => {
    async function fetchCategorias() {
      const cats = await obtenerCategorias();
      const catObj: any = {};
      const subcatObj: any = {};
      const subsubcatObj: any = {};
      cats.forEach((cat: any) => {
        catObj[cat.id] = cat.nombre || cat.id;
        if (cat.subcategorias) {
          cat.subcategorias.forEach((sub: any) => {
            subcatObj[sub.id] = sub.nombre || sub.id;
            if (sub.subcategorias) {
              sub.subcategorias.forEach((subsub: any) => {
                subsubcatObj[subsub.id] = subsub.nombre || subsub.id;
              });
            }
          });
        }
      });
      setCatMap(catObj);
      setSubcatMap(subcatObj);
      setSubsubcatMap(subsubcatObj);
    }
    fetchCategorias();
  }, []);

  function getCategoryName(id: string) {
    return catMap[id] || id;
  }
  function getSubcategoryName(id: string) {
    return subcatMap[id] || id;
  }
  function getSubsubcategoryName(id: string) {
    return subsubcatMap[id] || id;
  }



  const isLogged = useUser();
  const searchParams = useSearchParams();

  const categoriaFromUrl = (searchParams?.get("cat") || searchParams?.get("category") || "").trim();
  const subcategoriaFromUrl = (searchParams?.get("subcat") || searchParams?.get("subcategory") || searchParams?.get("sub") || "").trim();
  const subsubcategoriaFromUrl = (searchParams?.get("subsubcat") || searchParams?.get("subsubcategory") || searchParams?.get("subsub") || "").trim();

  // Estado local: responde al click al instante (router.push a veces no actualiza searchParams en la misma ruta)
  const [filterCat, setFilterCat] = useState(categoriaFromUrl);
  const [filterSub, setFilterSub] = useState(subcategoriaFromUrl);
  const [filterSubsub, setFilterSubsub] = useState(subsubcategoriaFromUrl);

  useEffect(() => {
    setFilterCat(categoriaFromUrl);
    setFilterSub(subcategoriaFromUrl);
    setFilterSubsub(subsubcategoriaFromUrl);
  }, [categoriaFromUrl, subcategoriaFromUrl, subsubcategoriaFromUrl]);

  const categoriaId = filterCat;
  const subcategoriaId = filterSub;
  const subsubcategoriaId = filterSubsub;
  
  // Leer parámetros de precio DIRECTAMENTE desde URL
  const urlMinPrice = searchParams?.get("minPrice") || "";
  const urlMaxPrice = searchParams?.get("maxPrice") || "";

  // --- Estados de datos ---
  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // --- Estados de filtros ---
  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");
  const [orden, setOrden] = useState("price-high");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [categorias, setCategorias] = useState<any[]>([]);
  const categoriesScrollRef = useRef<HTMLDivElement>(null);

  // 1. Control de Montaje - Inicializa filtros desde URL
  useEffect(() => {
    setIsMounted(true);
    const loggedIn = Boolean(localStorage.getItem("token"));
    setIsAuthenticated(loggedIn);
    
    // Sincronizar filtros de precio desde URL params después del montaje
    const minPrice = searchParams?.get("minPrice") || "";
    const maxPrice = searchParams?.get("maxPrice") || "";
    if (minPrice) setPrecioMin(minPrice);
    if (maxPrice) setPrecioMax(maxPrice);
  }, [searchParams]);

  const selectCategoria = useCallback(
    (catId: string) => {
      setFilterCat(catId);
      setFilterSub("");
      setFilterSubsub("");
      const url = catId
        ? `/products-by-category?cat=${encodeURIComponent(catId)}`
        : "/products-by-category";
      router.replace(url, { scroll: false });
    },
    [router]
  );

  const selectTodas = useCallback(() => {
    setFilterCat("");
    setFilterSub("");
    setFilterSubsub("");
    router.replace("/products-by-category", { scroll: false });
  }, [router]);

  // 2. Fetch productos (siempre catálogo completo + filtro por árbol de categorías)
  useEffect(() => {
    async function fetchProductos() {
      setLoading(true);
      try {
        const all = await obtenerProductos();
        let prods = all;

        if (categoriaId && categorias.length > 0) {
          prods = prods.filter((p) =>
            productMatchesCategoria(p, categoriaId, categorias)
          );
          if (subcategoriaId) {
            prods = prods.filter((p) =>
              productMatchesSubcategoria(
                p,
                categoriaId,
                subcategoriaId,
                categorias
              )
            );
          }
          if (subsubcategoriaId) {
            prods = prods.filter((p) =>
              productMatchesSubsubcategoria(
                p,
                categoriaId,
                subcategoriaId,
                subsubcategoriaId,
                categorias
              )
            );
          }
        } else if (categoriaId) {
          const needle = categoriaId.trim().toLowerCase();
          prods = all.filter(
            (p) =>
              String(p.categoria || "").trim().toLowerCase() === needle
          );
        }

        setProductos(prods || []);
      } catch {
        setProductos([]);
      } finally {
        setLoading(false);
      }
    }
    fetchProductos();
  }, [categoriaId, subcategoriaId, subsubcategoriaId, categorias]);

  // 2.5. Cargar categorías
  useEffect(() => {
    const categoriasRef = collection(db, "categorias");
    const q = query(categoriasRef);
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCategorias(sortCategoriasByOrder(mapCategorySnapshot(snapshot.docs)));
    });

    return () => unsubscribe();
  }, []);

  // 3. Filtrado y orden (Memoizado)
  const productosFiltrados = useMemo(() => {
    // Usar URL params primero, luego estado local como fallback
    const effectiveMin = urlMinPrice || precioMin;
    const effectiveMax = urlMaxPrice || precioMax;
    
    const minNum = effectiveMin && effectiveMin !== "" ? parseFloat(effectiveMin) : null;
    const maxNum = effectiveMax && effectiveMax !== "" ? parseFloat(effectiveMax) : null;
    
    const filtered = productos
      .filter((p: any) => {
        // Filtrado estricto por ID
        if (categoriaId && categorias.length > 0) {
          if (!productMatchesCategoria(p, categoriaId, categorias)) return false;
          if (
            subcategoriaId &&
            !productMatchesSubcategoria(
              p,
              categoriaId,
              subcategoriaId,
              categorias
            )
          ) {
            return false;
          }
          if (
            subsubcategoriaId &&
            !productMatchesSubsubcategoria(
              p,
              categoriaId,
              subcategoriaId,
              subsubcategoriaId,
              categorias
            )
          ) {
            return false;
          }
        } else if (categoriaId) {
          if (!sameCategoryId(p.categoria, categoriaId)) return false;
        } else {
          // "Todas": excluir siempre los productos de "Trabajos entregados"
          if (productMatchesCategoria(p, TRABAJOS_ENTREGADOS_CAT_ID, categorias)) {
            return false;
          }
        }

        const basePrice = Number(p.precio || 0);
        
        const matchMin = minNum === null || basePrice >= minNum;
        const matchMax = maxNum === null || basePrice <= maxNum;

        return matchMin && matchMax;
      })
      .sort((a: any, b: any) => {
        const basePrice = (p: any) => Number(p.precio || 0);
        if (orden === "price-low") return basePrice(a) - basePrice(b);
        if (orden === "price-high") return basePrice(b) - basePrice(a);
        return (new Date(b.createdAt).getTime() || 0) - (new Date(a.createdAt).getTime() || 0);
      });
    return filtered;
  }, [productos, categoriaId, subcategoriaId, subsubcategoriaId, categorias, precioMin, precioMax, orden, urlMinPrice, urlMaxPrice]);

    // --- Paginación responsive: 10 productos en móvil, cols*3 en desktop ---
    const [currentPage, setCurrentPage] = useState(1);
    const getProductsPerPage = () => {
      if (typeof window !== 'undefined') {
        if (window.innerWidth < 640) return 10; // móvil
        if (window.innerWidth >= 1024) return 4 * 3; // lg: 4 cols x 3 filas
        if (window.innerWidth >= 768) return 3 * 3; // md: 3 cols x 3 filas
        if (window.innerWidth >= 640) return 2 * 3; // sm: 2 cols x 3 filas
      }
      return 10;
    };
    const [productsPerPage, setProductsPerPage] = useState(getProductsPerPage());
    useEffect(() => {
      function handleResize() {
        setProductsPerPage(getProductsPerPage());
      }
      window.addEventListener('resize', handleResize);
      handleResize();
      return () => window.removeEventListener('resize', handleResize);
    }, []);
    
    const totalPages = Math.ceil(productosFiltrados.length / productsPerPage);
    
    // Resetear a página 1 cuando cambia el filtro
    useEffect(() => {
      setCurrentPage(1);
    }, [productosFiltrados.length, categoriaId, subcategoriaId, subsubcategoriaId, urlMinPrice, urlMaxPrice]);
    
    const paginatedProducts = useMemo(() => {
      return productosFiltrados.slice((currentPage - 1) * productsPerPage, currentPage * productsPerPage);
    }, [productosFiltrados, currentPage, productsPerPage]);

  return (
    <div className="min-h-screen flex flex-col transition-colors bg-black text-white">
        <BottomBarPublic />

      <main className="max-w-350 mx-auto w-full px-3 sm:px-5 py-8 flex-1">
        {/* Cabecera */}
        {(categoriaId || subcategoriaId || subsubcategoriaId) && (
          <div className="mb-4">
            <nav className="flex items-center gap-1 text-xs text-white/40 mb-1 select-none">
              <span className="hover:underline cursor-pointer" onClick={() => window.location.href = '/products-by-category'}>Categorías</span>
              {categoriaId && (
                <>
                  <span className="mx-1">›</span>
                  <span className="hover:underline cursor-pointer" onClick={() => window.location.href = `/products-by-category?cat=${encodeURIComponent(categoriaId)}`}>{getCategoryName(categoriaId)}</span>
                </>
              )}
              {subcategoriaId && (
                <>
                  <span className="mx-1">›</span>
                  <span className="hover:underline cursor-pointer" onClick={() => window.location.href = `/products-by-category?cat=${encodeURIComponent(categoriaId)}&subcat=${encodeURIComponent(subcategoriaId)}`}>{getSubcategoryName(subcategoriaId)}</span>
                </>
              )}
              {subsubcategoriaId && (
                <>
                  <span className="mx-1">›</span>
                  <span className="font-semibold text-white/80">{getSubsubcategoryName(subsubcategoriaId)}</span>
                </>
              )}
            </nav>
            <h1 className="text-xl sm:text-2xl font-bold leading-tight text-white">
              {subsubcategoriaId
                ? getSubsubcategoryName(subsubcategoriaId)
                : subcategoriaId
                  ? getSubcategoryName(subcategoriaId)
                  : getCategoryName(categoriaId)}
            </h1>
          </div>
        )}

        {/* ── Categorías — círculos, mismo patrón que en /productos ── */}
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
                  !categoriaId
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
                  !categoriaId ? "text-white" : "text-white/70"
                } text-center`}
              >
                Todos
              </span>
            </button>

            {categorias.map((cat) => {
              const selected = sameCategoryId(categoriaId, cat.id);

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

        {/* Grid de productos o Loading */}
        {(!isMounted || loading) ? (
          <div className="flex flex-col items-center justify-center py-32 transition-opacity duration-500">
            <Loading3DIcon />
            <p className="text-xs text-white/30 mt-6 font-medium tracking-widest uppercase">Cargando catálogo</p>
          </div>
        ) : productosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
              <span className="material-icons-round text-3xl text-white/20">search_off</span>
            </div>
            <div>
              <p className="font-semibold text-white/80">Sin resultados</p>
              <p className="text-sm text-white/30 mt-1 max-w-60">No hay productos en esta categoría</p>
            </div>
          </div>
        ) : (
          <>
            <div className={`grid grid-cols-3 gap-2 sm:grid-cols-4 animate-in fade-in duration-700`}>
              {paginatedProducts.map((p: any) => (
                <ProductoCard
                  key={p.id}
                  producto={p}
                  showFav={isAuthenticated}
                  isCompact={false}
                />
              ))}
            </div>
            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex flex-wrap justify-center items-center gap-2 mt-8 select-none w-full">
                <button
                  className="px-3 py-1.5 rounded border text-xs font-medium bg-black border-white/15 text-white hover:border-red-600 transition-all disabled:opacity-40"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  &lt;
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    className={`px-3 py-1.5 rounded border text-xs font-medium transition-all ${currentPage === n ? 'bg-red-600 border-red-600 text-white shadow-sm' : 'bg-black border-white/15 text-white hover:border-red-600'}`}
                    onClick={() => setCurrentPage(n)}
                  >
                    {n}
                  </button>
                ))}
                <button
                  className="px-3 py-1.5 rounded border text-xs font-medium bg-black border-white/15 text-white hover:border-red-600 transition-all disabled:opacity-40"
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
