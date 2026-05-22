import ShopGrid from "@/components/shop/ShopGrid";
import PageHeader from "@/components/shared/PageHeader";

export default function ShopPage() {
  return (
    <>
              <title>Shop | BigRonJones</title>
        <meta
          name="description"
          content="Band workouts, pediatrics programs, private calls. Everything BigRonJones — direct from Ron's team."
        />
      <section className="bg-[#050505] pt-28 pb-12 md:pt-36 md:pb-16">
        <PageHeader
          eyebrow="THE STORE"
          headline={["INVEST IN", "YOUR HEALTH."]}
          sub="Programs, training products, and 1-on-1 sessions. Everything is built or hand-picked by Ron — no fluff, no upsells."
        />
      </section>
      <ShopGrid />
    </>
  );
}
