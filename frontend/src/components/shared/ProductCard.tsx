

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { CursorSpotlight } from "@/components/ui/spotlight";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/useToast";
import type { Product } from "@/data/products";

interface Props {
  product: Product;
  index?: number;
  size?: "default" | "compact";
}

export default function ProductCard({ product, index = 0, size = "default" }: Props) {
  const addItem = useCart((s) => s.addItem);
  const push = useToast((s) => s.push);

  const handleAdd = () => {
    addItem(product);
    push({
      title: "Added to cart",
      description: product.name,
      variant: "success",
      cta: { label: "View Cart", href: "/checkout" },
    });
  };

  const featured = product.category === "consult";

  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        duration: 0.7,
        delay: index * 0.08,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={`group relative flex flex-col overflow-hidden border bg-[#0f0f0f] transition-colors duration-500 ${
        featured
          ? "border-[#E8192C]/40 hover:border-[#E8192C]/70"
          : "border-[#1a1a1a] hover:border-[#E8192C]/30"
      }`}
    >
      <CursorSpotlight size={300} color="rgba(232,25,44,0.16)" />

      <Link to={`/shop/${product.slug}`} className="relative block">
        <div
          className={`relative w-full overflow-hidden bg-[#0f0f0f] ${
            size === "compact" ? "h-[200px]" : "h-[280px]"
          }`}
        >
          <motion.div
            className="absolute inset-0 z-20 origin-right bg-[#E8192C]"
            initial={{ scaleX: 1 }}
            whileInView={{ scaleX: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{
              duration: 0.8,
              ease: [0.76, 0, 0.24, 1],
              delay: index * 0.1,
            }}
          />
          <img src={product.image} alt={product.name} className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.04]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/20 to-transparent" />
          {product.badge && (
            <span className="absolute right-3 top-3 bg-[#E8192C] px-3 py-1.5 font-['DM_Mono'] text-[9px] uppercase tracking-[0.2em] text-white">
              {product.badge}
            </span>
          )}
        </div>
      </Link>

      <div className="relative z-[2] flex flex-1 flex-col p-5">
        <p className="font-['DM_Mono'] text-[9px] uppercase tracking-[0.25em] text-white/40">
          {product.category === "training"
            ? "Training Program"
            : product.category === "program"
            ? "Coaching Program"
            : "1-on-1 Session"}
        </p>
        <Link to={`/shop/${product.slug}`}>
          <h3 className="mt-2 font-['Bebas_Neue'] text-xl leading-tight tracking-wide text-white transition-colors hover:text-[#E8192C]">
            {product.name}
          </h3>
        </Link>
        <p className="mt-3 font-['DM_Sans'] text-[13px] leading-relaxed text-white/55">
          {product.description}
        </p>

        <div className="mt-5 flex items-end justify-between gap-3">
          <div>
            <span className="font-['Bebas_Neue'] text-3xl tracking-wide text-[#E8192C]">
              ${product.price.toFixed(2)}
            </span>
            <span className="ml-1.5 font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/40">
              USD
            </span>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            onClick={handleAdd}
            className="inline-flex flex-1 items-center justify-center gap-2 bg-[#E8192C] px-4 py-3 font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#b50f1f]"
          >
            <ShoppingBag size={13} />
            Add to Cart
          </button>
          <Link
            to={`/shop/${product.slug}`}
            className="inline-flex items-center justify-center gap-2 border border-[#1a1a1a] px-4 py-3 font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/80 transition-colors hover:border-[#E8192C] hover:text-white"
          >
            Details
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
