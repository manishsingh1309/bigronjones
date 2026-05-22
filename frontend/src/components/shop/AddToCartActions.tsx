
import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Check } from "lucide-react";
import { motion } from "framer-motion";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/useToast";
import type { Product } from "@/data/products";

export default function AddToCartActions({ product }: { product: Product }) {
  const addItem = useCart((s) => s.addItem);
  const push = useToast((s) => s.push);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addItem(product);
    setAdded(true);
    push({
      title: "Added to cart",
      description: product.name,
      variant: "success",
      cta: { label: "View Cart", href: "/checkout" },
    });
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleAdd}
        className="inline-flex flex-1 items-center justify-center gap-2 bg-[#E8192C] px-7 py-4 font-['DM_Mono'] text-[11px] uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#b50f1f]"
      >
        {added ? (
          <>
            <Check size={14} strokeWidth={3} />
            Added
          </>
        ) : (
          <>
            <ShoppingBag size={14} />
            Add to Cart — ${product.price.toFixed(2)}
          </>
        )}
      </motion.button>

      <Link
        to="/checkout"
        className="inline-flex items-center justify-center gap-2 border border-[#1a1a1a] px-7 py-4 font-['DM_Mono'] text-[11px] uppercase tracking-[0.18em] text-white transition-colors hover:border-[#E8192C]"
      >
        Go to Checkout
      </Link>
    </div>
  );
}