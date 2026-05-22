import { Suspense } from "react";
import CheckoutClient from "@/components/checkout/CheckoutClient";
import CheckoutPreloader from "@/components/checkout/CheckoutPreloader";

export default function CheckoutPage() {
  return (
    <>
              <title>Checkout | BigRonJones</title>
        <meta
          name="description"
          content="Complete your BigRonJones order. Secure checkout. Cancel anytime."
        />
      <section className="bg-[#050505] pt-28 pb-24 md:pt-36 md:pb-32">
        <Suspense fallback={null}>
          <CheckoutPreloader />
        </Suspense>
        <CheckoutClient />
      </section>
    </>
  );
}
