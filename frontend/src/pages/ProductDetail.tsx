import { useParams, Link, Navigate } from "react-router-dom";
import { Check, ChevronLeft } from "lucide-react";
import { getProductBySlug, getRelatedProducts } from "@/data/products";
import ProductCard from "@/components/shared/ProductCard";
import AddToCartActions from "@/components/shop/AddToCartActions";

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const product = slug ? getProductBySlug(slug) : null;

  if (!product) return <Navigate to="/404" replace />;

  const related = getRelatedProducts(slug!, 3);

  return (
    <>
              <title>{`${product.name} | BigRonJones`}</title>
        <meta name="description" content={product.description} />
      <div className="bg-[#050505] pt-28 md:pt-32">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10">
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/60 hover:text-white"
          >
            <ChevronLeft size={14} />
            Back to shop
          </Link>
        </div>
      </div>

      <section className="bg-[#050505] py-12 md:py-20">
        <div className="mx-auto grid max-w-[1300px] grid-cols-1 gap-12 px-6 md:px-10 lg:grid-cols-2 lg:gap-16">
          <div className="relative aspect-[4/5] w-full overflow-hidden border border-[#1a1a1a]">
            <img
              src={product.image}
              alt={product.name}
              className="absolute inset-0 h-full w-full object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent opacity-30" />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
              }}
            />
          </div>

          <div className="flex flex-col gap-6">
            {product.badge && (
              <span className="w-fit bg-[#E8192C] px-3 py-1.5 font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white">
                {product.badge}
              </span>
            )}

            <h1
              className="font-['Bebas_Neue'] leading-[0.95] text-white"
              style={{ fontSize: "clamp(2rem, 5.5vw, 4.5rem)" }}
            >
              {product.name.toUpperCase()}
            </h1>

            <div className="flex items-baseline gap-2">
              <span className="font-['Bebas_Neue'] text-5xl tracking-wide text-[#E8192C]">
                ${product.price.toFixed(2)}
              </span>
              <span className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/40">
                USD
              </span>
              {product.duration && (
                <span className="ml-3 font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/40">
                  · {product.duration}
                </span>
              )}
            </div>

            <p className="font-['DM_Sans'] text-base leading-relaxed text-white/65">
              {product.fullDescription}
            </p>

            <ul className="flex flex-col gap-2.5 border-y border-[#1a1a1a] py-6">
              {product.features.map((f) => (
                <li
                  key={f}
                  className="flex items-start gap-3 font-['DM_Sans'] text-[14px] text-white/80"
                >
                  <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#E8192C]" strokeWidth={2.5} />
                  {f}
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-4 border border-[#1a1a1a] bg-[#0f0f0f] p-4">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden">
                <img
                  src={product.image}
                  alt={product.coach}
                  className="absolute inset-0 h-full w-full object-cover object-top"
                />
              </div>
              <div className="flex-1">
                <p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.2em] text-white/40">
                  With
                </p>
                <p className="font-['Bebas_Neue'] text-xl tracking-wide text-white">
                  {product.coach}
                </p>
              </div>
            </div>

            <AddToCartActions product={product} />

            <p className="font-['DM_Mono'] text-[10px] uppercase tracking-[0.22em] text-white/40">
              Secure checkout · Cancel anytime · 100% real coaching
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#050505] py-20 md:py-24">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10">
          <p className="mb-4 font-['DM_Mono'] text-[11px] uppercase tracking-[0.3em] text-[#E8192C]">
            — YOU MIGHT ALSO LIKE
          </p>
          <h2
            className="mb-10 font-['Bebas_Neue'] leading-[0.92] text-white"
            style={{ fontSize: "clamp(2rem, 5vw, 4.25rem)" }}
          >
            MORE FROM THE STORE.
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
