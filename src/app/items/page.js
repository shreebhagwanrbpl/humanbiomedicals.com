"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import PageBanner from "@/components/PageBanner";
import SectionTitle from "@/components/SectionTitle";
import ProductCard from "@/components/ProductCard";
import { fetchAllDynamicProducts, normalizeProduct } from "@/lib/fetchProducts";
import { subscribeToCatalog } from "@/lib/data-fetcher";
import { Search, X, Filter, Package, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";

function ProductsContent({ city }) {
  /* =========================================================
     ONLY DYNAMIC PRODUCTS
     NO FALLBACK / STATIC PRODUCTS
  ========================================================= */

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");

  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlCategory = searchParams
    ? searchParams.get("category") || searchParams.get("cat")
    : null;

  /* =========================================================
     DISTRICT / ROUTING
  ========================================================= */

  const pathParts = pathname.split("/").filter(Boolean);

  const staticRoutes = ["about", "services", "items", "contact", "products"];

  const district =
    pathParts.length > 0 && !staticRoutes.includes(pathParts[0])
      ? pathParts[0]
      : null;

  const makeLink = (path) => {
    if (!district) return path;

    if (path === "/") {
      return `/${district}`;
    }

    if (path.startsWith("/items?")) {
      return `/${district}${path}`;
    }

    return `/${district}${path.startsWith("/") ? path : `/${path}`}`;
  };

  /* =========================================================
     LOAD ONLY DYNAMIC PRODUCTS
  ========================================================= */

  useEffect(() => {
    let isMounted = true;

    const loadInitialProducts = async () => {
      try {
        const fetched = await fetchAllDynamicProducts();

        if (isMounted) {
          if (Array.isArray(fetched)) {
            setProducts(fetched);
          } else {
            setProducts([]);
          }
        }
      } catch (err) {
        console.error("Error loading dynamic products:", err);

        if (isMounted) {
          setProducts([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadInitialProducts();

    /* =======================================================
       REAL-TIME DYNAMIC CATALOG
    ======================================================= */

    const unsubscribe = subscribeToCatalog((updatedCatalog) => {
      if (!isMounted) return;

      if (Array.isArray(updatedCatalog)) {
        const normalized = updatedCatalog
          .map((item) => normalizeProduct(item))
          .filter(Boolean);

        /* IMPORTANT:
           Even if catalog is empty, set [].
           Never use fallback/static products.
        */

        setProducts(normalized);
      } else {
        setProducts([]);
      }
    });

    return () => {
      isMounted = false;

      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  /* =========================================================
     DYNAMIC CATEGORIES
  ========================================================= */

  const categoriesList = useMemo(() => {
    const categorySet = new Set(["All Categories"]);

    products.forEach((product) => {
      if (product.category && String(product.category).trim()) {
        categorySet.add(String(product.category).trim());
      }
    });

    return Array.from(categorySet);
  }, [products]);

  /* =========================================================
     SYNC CATEGORY FROM URL
  ========================================================= */

  useEffect(() => {
    if (urlCategory && typeof urlCategory === "string" && urlCategory.trim()) {
      const decoded = decodeURIComponent(urlCategory.trim());
      setSelectedCategory(decoded);
    }
  }, [urlCategory]);

  /* =========================================================
     FILTER DYNAMIC PRODUCTS
  ========================================================= */

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === "All Categories" ||
        (product.category &&
          product.category
            .toLowerCase()
            .trim() === selectedCategory.toLowerCase().trim()) ||
        (product.subCategory &&
          product.subCategory
            .toLowerCase()
            .trim() === selectedCategory.toLowerCase().trim());

      const q = searchQuery.toLowerCase().trim();

      const matchesQuery =
        !q ||
        (product.title && product.title.toLowerCase().includes(q)) ||
        (product.description &&
          product.description.toLowerCase().includes(q)) ||
        (product.category &&
          product.category.toLowerCase().includes(q)) ||
        (product.brand && product.brand.toLowerCase().includes(q)) ||
        (product.model && product.model.toLowerCase().includes(q));

      return matchesCategory && matchesQuery;
    });
  }, [products, selectedCategory, searchQuery]);

  return (
    <div className="!bg-[#f5fcfd]/40 !text-[#12383a]">

      {/* =====================================================
          PAGE BANNER
      ===================================================== */}

      <PageBanner
        badge="Product Inventory"
        title={
          city
            ? `Diagnostic Equipment Collection in ${city}`
            : "Diagnostic Equipment Collection"
        }
        subtitle="Explore our certified catalog of clinical chemistry analyzers, hematology counters, PCR systems, patient monitors, and laboratory consumables."
      />

      {/* =====================================================
          MAIN CATALOG
      ===================================================== */}

      <section className="section-padding !bg-gradient-to-b from-white via-[#f5fcfd] to-[#eaf9fa]">
        <div className="container-custom">

          {/* =================================================
              CONTROLS
          ================================================= */}

          <div className="sticky top-20 z-40 rounded-2xl border !border-[#bfe8ea] !bg-white/95 p-4 shadow-lg shadow-black/5 backdrop-blur-xl transition-all sm:rounded-3xl sm:p-5">

            <div className="grid items-center gap-4 md:grid-cols-12">

              {/* SEARCH */}

              <div className="relative md:col-span-5">

                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 !text-[#007f86]"
                />

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by equipment name, model, or parameter..."
                  className="w-full rounded-xl border !border-[#bfe8ea] !bg-[#f5fcfd]/60 py-2.5 pl-10 pr-10 text-xs !text-[#12383a] transition-all placeholder:!text-[#6b8587] focus:!border-[#007f86] focus:!bg-white focus:outline-none focus:ring-2 focus:ring-[#007f86]/20 sm:py-3 sm:text-sm"
                />

                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 !text-[#12383a] hover:!text-[#007f86]"
                    aria-label="Clear search"
                  >
                    <X size={16} />
                  </button>
                )}

              </div>

              {/* CATEGORY FILTERS */}

              <div className="scrollbar-none flex items-center gap-2 overflow-x-auto pb-1 md:col-span-7 md:pb-0">

                <Filter
                  size={16}
                  className="mr-1 shrink-0 !text-[#007f86]"
                />

                {categoriesList.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${selectedCategory.toLowerCase().trim() ===
                      cat.toLowerCase().trim()
                      ? "!bg-[#007f86] !text-white shadow-md shadow-[#007f86]/30"
                      : "!border !border-[#bfe8ea] !bg-[#f5fcfd] !text-[#12383a] hover:!bg-[#d9f3f5]"
                      }`}
                  >
                    {cat}
                  </button>
                ))}

              </div>
            </div>

            {/* =================================================
                RESULTS COUNT
            ================================================= */}

            <div className="mt-3 flex items-center justify-between border-t !border-[#bfe8ea]/40 pt-3 text-xs font-semibold !text-[#12383a]">

              <span>
                Showing{" "}
                <strong className="font-bold !text-[#007f86]">
                  {filteredProducts.length}
                </strong>{" "}
                of {products.length} instruments

                {selectedCategory !== "All Categories" && (
                  <span className="ml-1 !text-[#007f86]">
                    in &ldquo;{selectedCategory}&rdquo;
                  </span>
                )}
              </span>

              {(selectedCategory !== "All Categories" || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedCategory("All Categories");
                    setSearchQuery("");
                  }}
                  className="font-bold !text-[#007f86] hover:underline"
                >
                  Reset all filters
                </button>
              )}

            </div>

          </div>

          {/* =================================================
              LOADING
          ================================================= */}

          {loading ? (
            <div className="mt-16 flex min-h-[300px] items-center justify-center">

              <div className="flex flex-col items-center gap-3">

                <Loader2
                  size={42}
                  className="animate-spin !text-[#007f86]"
                />

                <p className="text-sm font-bold !text-[#00656a]">
                  Loading Medical Equipment Catalog...
                </p>

              </div>

            </div>
          ) : filteredProducts.length === 0 ? (

            /* =================================================
               NO PRODUCTS
            ================================================= */

            <div className="mt-16 rounded-3xl border !border-[#bfe8ea] !bg-white p-16 text-center shadow-sm">

              <Package
                size={48}
                className="mx-auto mb-4 animate-bounce !text-[#007f86]/60"
              />

              <h3 className="text-2xl font-bold !text-[#12383a]">
                No Instruments Found
              </h3>

              <p className="mt-2 text-sm !text-[#12383a]">
                {products.length === 0
                  ? "No products are currently available in the dynamic catalog."
                  : "Try adjusting your search keyword or selecting a different equipment category."}
              </p>

              {(searchQuery ||
                selectedCategory !== "All Categories") && (
                  <button
                    onClick={() => {
                      setSelectedCategory("All Categories");
                      setSearchQuery("");
                    }}
                    className="mt-6 inline-flex items-center gap-2 rounded-2xl !bg-[#007f86] px-6 py-3 text-sm font-bold !text-white shadow-md transition-all hover:!bg-[#00656a]"
                  >
                    Clear Search Filters
                  </button>
                )}

            </div>
          ) : (

            /* =================================================
               DYNAMIC PRODUCTS GRID
            ================================================= */

            <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">

              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id || product.slug}
                  product={product}
                  makeLink={makeLink}
                />
              ))}

            </div>

          )}

        </div>
      </section>

      {/* =====================================================
          BULK PROCUREMENT BANNER
      ===================================================== */}

      <section className="section-padding border-t !border-[#bfe8ea]/60 !bg-white">
        <div className="container-custom">

          <div className="rounded-3xl border !border-[#bfe8ea] !bg-gradient-to-r from-[#f5fcfd] via-[#eaf9fa] to-[#d9f3f5] p-8 shadow-lg sm:p-12">

            <div className="grid items-center gap-8 lg:grid-cols-12">

              <div className="lg:col-span-8">

                <span className="inline-flex items-center gap-2 rounded-full border !border-[#007f86]/30 !bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-wider !text-[#00656a]">

                  <ShieldCheck
                    size={16}
                    className="!stroke-[#007f86] !text-[#007f86]"
                  />

                  <span className="!text-[#00656a]">
                    Bulk Hospital Orders & Tenders
                  </span>

                </span>

                <h3 className="mt-4 text-3xl font-black !text-[#12383a]">
                  Procuring Equipment for New Hospital Blocks or Diagnostics Chains?
                </h3>

                <p className="mt-3 text-base leading-relaxed !text-[#12383a]">
                  We offer institutional discounts, customized equipment leasing plans, and complete turnkey lab setup packages with extended AMC warranties.
                </p>

              </div>

              <div className="flex items-center justify-end lg:col-span-4">

                <a
                  href={makeLink("/contact")}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl !bg-[#007f86] px-8 py-4 text-base font-bold !text-white shadow-lg transition-all hover:!bg-[#00656a] sm:w-auto"
                >
                  <span className="font-bold !text-white">
                    Request Bulk Tender Quote
                  </span>

                  <ArrowRight
                    size={18}
                    strokeWidth={2.5}
                    className="!stroke-white !text-white"
                  />
                </a>

              </div>

            </div>

          </div>

        </div>
      </section>

    </div>
  );
}

export default function ProductsPage({ city }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center !bg-[#f5fcfd]">
          <div className="flex flex-col items-center gap-3">

            <Loader2
              className="h-10 w-10 animate-spin !text-[#007f86]"
            />

            <p className="text-sm font-bold !text-[#00656a]">
              Loading Medical Equipment Catalog...
            </p>

          </div>
        </div>
      }
    >
      <ProductsContent city={city} />
    </Suspense>
  );
}