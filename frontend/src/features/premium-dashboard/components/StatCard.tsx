import { motion } from "framer-motion";

export default function StatCard({
  label,
  value,
  sublabel,
  accent = "#f5d77b",
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  accent?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-3xl border border-[#2a2417] bg-[linear-gradient(180deg,rgba(255,223,128,0.08),rgba(7,7,7,0.94))] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.25)]"
    >
      <p className="font-['DM_Mono'] text-[9px] uppercase tracking-[0.28em] text-white/45">
        {label}
      </p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <p className="font-['Bebas_Neue'] text-5xl leading-none text-white">
            {value}
          </p>
          {sublabel && <p className="mt-1 text-sm text-white/55">{sublabel}</p>}
        </div>
        <span
          className="h-3 w-3 rounded-full shadow-[0_0_20px_currentColor]"
          style={{ color: accent, backgroundColor: accent }}
        />
      </div>
    </motion.div>
  );
}
