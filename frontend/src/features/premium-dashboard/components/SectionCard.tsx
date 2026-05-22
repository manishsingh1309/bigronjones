import type { ReactNode } from "react";

export default function SectionCard({
  id,
  title,
  eyebrow,
  children,
  className = "",
}: {
  id?: string;
  title: string;
  eyebrow?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={`rounded-3xl border border-[#2a2417] bg-[linear-gradient(180deg,rgba(255,215,128,0.08),rgba(10,10,10,0.96))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl md:p-6 ${className}`}
    >
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          {eyebrow ? (
            <p className="mb-1 font-['DM_Mono'] text-[10px] uppercase tracking-[0.3em] text-[#f5d77b]/70">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="font-['Bebas_Neue'] text-3xl tracking-[0.08em] text-white md:text-4xl">
            {title}
          </h2>
        </div>
      </div>
      {children}
    </section>
  );
}
