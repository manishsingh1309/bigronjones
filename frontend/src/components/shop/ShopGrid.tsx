
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import ProductCard from "@/components/shared/ProductCard";
import { products, type ProductCategory } from "@/data/products";
import { cn } from "@/lib/cn";

type Filter = "all" | ProductCategory;

const filters: { label: string; value: Filter }[] = [
  { label: "All", value: "all" },
  { label: "Training", value: "training" },
  { label: "Programs", value: "program" },
  { label: "Consultations", value: "consult" },
];

export default function ShopGrid() {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(
    () =>
      filter === "all"
        ? products
        : products.filter((p) => p.category === filter),
    [filter]
  );

  return (
    <section className="bg-[#050505] pb-24 md:pb-32">
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <div className="mb-10 flex flex-wrap items-center gap-3 border-b border-[#1a1a1a] pb-6">
          <span className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.3em] text-white/40">
            Filter
          </span>
          {filters.map((f) => {
            const active = filter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  "relative px-4 py-2 font-['DM_Mono'] text-[10px] uppercase tracking-[0.22em] transition-colors",
                  active
                    ? "text-white"
                    : "text-white/40 hover:text-white"
                )}
              >
                {f.label}
                {active && (
                  <motion.span
                    layoutId="shop-filter"
                    className="absolute bottom-0 left-0 right-0 h-[1px] bg-[#E8192C]"
                  />
                )}
              </button>
            );
          })}
          <span className="ml-auto font-['DM_Mono'] text-[10px] uppercase tracking-[0.22em] text-white/40">
            {filtered.length} {filtered.length === 1 ? "Product" : "Products"}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="border border-[#1a1a1a] bg-[#0f0f0f] p-12 text-center">
            <p className="font-['DM_Sans'] text-white/60">
              Nothing in this category yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
