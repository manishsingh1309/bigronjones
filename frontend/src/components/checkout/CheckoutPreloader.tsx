import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { getProgramAsCartItem } from "@/data/programs";
import { getProductBySlug } from "@/data/products";

/**
 * Reads `?program=<slug>` or `?product=<slug>` from the URL and pre-populates
 * the cart on mount. Strips the params after applying so refreshes don't
 * keep re-adding lines.
 *
 * Premium programs (mens, womens) are application-only — if someone lands
 * here with one of those, we punt them to /apply with the program preserved.
 */
export default function CheckoutPreloader() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const addItem = useCart((s) => s.addItem);
  const items = useCart((s) => s.items);
  const hydrated = useCart((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated) return;

    const programSlug = params.get("program");
    const productSlug = params.get("product");

    if (programSlug) {
      if (programSlug === "mens" || programSlug === "womens") {
        navigate(`/apply?program=${programSlug}`, { replace: true });
        return;
      }
      const item = getProgramAsCartItem(programSlug);
      if (item && !items.find((i) => i.id === item.id)) {
        addItem(item);
      }
      navigate("/checkout", { replace: true });
      return;
    }

    if (productSlug) {
      const product = getProductBySlug(productSlug);
      if (product && !items.find((i) => i.id === product.id)) {
        addItem(product);
      }
      navigate("/checkout", { replace: true });
      return;
    }
    // intentionally only run when hydration flips or query changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, params]);

  return null;
}
