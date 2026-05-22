import { Suspense } from "react";
import ApplyForm from "@/components/apply/ApplyForm";
import PageHeader from "@/components/shared/PageHeader";

export default function ApplyPage() {
  return (
    <>
              <title>Apply | BigRonJones</title>
        <meta
          name="description"
          content="Apply to BigRonJones' Men's Alliance or Women's Wellness Program. Ron and the team review every application personally."
        />
      <section className="bg-[#050505] pt-28 pb-12 md:pt-36 md:pb-16">
        <PageHeader
          eyebrow="APPLICATION"
          headline={["APPLY TO", "WORK WITH RON."]}
          sub="Both alliances are application-only. Ron and the team review each one personally to make sure it's the right fit on both sides."
        />
      </section>

      <section className="bg-[#050505] pb-24">
        <Suspense fallback={<div className="h-96" />}>
          <ApplyForm />
        </Suspense>
      </section>
    </>
  );
}
