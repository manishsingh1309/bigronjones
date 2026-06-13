
import { motion, useInView } from "framer-motion";
import { useRef } from "react";



import { Lock, Calendar, MessageCircle, CheckCircle } from "lucide-react";
import GoldButton from "../ui/GoldButton";

const consultants = [
  {
    image:
      "/images/ron/mentality-portrait.jpg",
    title: "WELLNESS CONSULT",
    name: "with Ron",
    price: "$79.99 / session",
    cta: "Book with Ron",
  },
  {
    image:
      "/images/ron/dumbbell-side.jpg",
    title: "NUTRITION CALL",
    name: "with Sean",
    price: "$79.99 / session",
    cta: "Book with Sean",
  },
];

const trustSignals = [
  { icon: Lock, text: "Secure Payment" },
  { icon: Calendar, text: "Flexible Scheduling" },
  { icon: MessageCircle, text: "Private Session" },
  { icon: CheckCircle, text: "100% Tailored to You" },
];

export default function ConsultSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="consult" className="bg-brand-black py-24">
      <div
        ref={ref}
        className="mx-auto grid max-w-7xl overflow-hidden rounded-2xl md:grid-cols-2"
      >
        {/* Left content */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8 }}
            className="bg-[#111827] p-8 md:p-12"
        >
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-brand-red font-body">
            Personal Coaching
          </p>
          <h2 className="font-heading text-4xl uppercase tracking-wider text-white md:text-5xl">
            Book A 1:1 Session
          </h2>
          <p className="mt-4 text-brand-gray-light font-body leading-relaxed">
            Get direct face time with Ron or our nutritionist Sean for a private
            coaching call. Walk away with a clear, customized plan built
            specifically around your goals and lifestyle.
          </p>

          {/* Consultant cards */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {consultants.map((c) => (
              <div
                key={c.name}
                className="rounded-xl border border-white/10 bg-white/5 p-4"
              >
                <div className="relative mb-3 h-32 overflow-hidden rounded-lg">
                  <img src={c.image} alt={c.name} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover object-top" />
                </div>
                <h3 className="font-heading text-lg tracking-wider text-white">
                  {c.title}
                </h3>
                <p className="text-sm text-brand-gray-light font-body">{c.name}</p>
                <p className="mt-2 font-heading text-xl text-brand-blue">
                  {c.price}
                </p>
                <div className="mt-3">
                  <GoldButton size="sm" fullWidth onClick={() => {
                    const el = document.getElementById("consult");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}>
                    {c.cta}
                  </GoldButton>
                </div>
              </div>
            ))}
          </div>

          {/* Trust signals */}
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            {trustSignals.map((t) => (
              <div key={t.text} className="flex items-center gap-2">
                <t.icon size={16} className="text-brand-red" />
                <span className="text-xs text-brand-gray-light font-body">
                  {t.text}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right image */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative hidden md:block"
        >
          <img src="/images/ron/gym-standing.jpg" alt="Training session" loading="lazy" decoding="async" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-black via-transparent to-transparent" />
        </motion.div>
      </div>
    </section>
  );
}
