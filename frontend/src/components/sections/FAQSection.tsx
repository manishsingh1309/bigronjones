import { motion } from "framer-motion";
import FAQAccordion, { type FAQItem } from "@/components/shared/FAQAccordion";
import { viewportOnce } from "@/lib/animations";

// Section 8 — homepage FAQ. Exactly the four client-approved Q&As.
const faqs: FAQItem[] = [
  { q: "Do I need a gym?", a: "No." },
  { q: "Will I meet with someone?", a: "Yes." },
  { q: "What happens after the trial?", a: "Next-step recommendations." },
  { q: "Who is this built for?", a: "Adults seeking structure." },
];

export default function FAQSection() {
  return (
    <section id="faq" className="bg-[#050505] py-24 md:py-32">
      <div className="mx-auto max-w-3xl px-6 md:px-10">
        <motion.header
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="mb-10"
        >
          <motion.p
            variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0, transition: { duration: 0.6 } } }}
            className="mb-5 font-['DM_Mono'] text-[11px] uppercase tracking-[0.3em] text-[#E8192C]"
          >
            — FAQ
          </motion.p>
          <motion.h2
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7 } } }}
            className="font-['Bebas_Neue'] leading-[0.92] text-white"
            style={{ fontSize: "clamp(2.5rem, 7vw, 5.5rem)" }}
          >
            QUESTIONS? ANSWERED.
          </motion.h2>
        </motion.header>

        <FAQAccordion items={faqs} />
      </div>
    </section>
  );
}
