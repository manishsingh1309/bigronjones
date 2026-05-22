
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";

export type FAQItem = { q: string; a: string };

interface Props {
  items: FAQItem[];
}

export default function FAQAccordion({ items }: Props) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <ul className="flex flex-col">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <li key={item.q} className="border-t border-[#1a1a1a] last:border-b">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-6 py-6 text-left transition-colors hover:text-white"
            >
              <span className="font-['Bebas_Neue'] text-xl tracking-wide text-white sm:text-2xl">
                {item.q}
              </span>
              <motion.span
                animate={{ rotate: isOpen ? 45 : 0 }}
                transition={{ duration: 0.3 }}
                className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#1a1a1a] text-[#E8192C]"
              >
                <Plus size={16} strokeWidth={2.5} />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <p className="pb-6 pr-12 font-['DM_Sans'] text-[15px] leading-relaxed text-white/65">
                    {item.a}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        );
      })}
    </ul>
  );
}
