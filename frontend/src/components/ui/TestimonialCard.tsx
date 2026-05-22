
interface TestimonialProps {
  name: string;
  program: string;
  quote: string;
  stars: number;
  initials: string;
  color: string;
}

export default function TestimonialCard({
  name,
  program,
  quote,
  stars,
  initials,
  color,
}: TestimonialProps) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-[#111827] p-6">
      <div className="mb-4 flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white ${color}`}
        >
          {initials}
        </div>
        <div>
          <p className="font-semibold text-white font-body">{name}</p>
          <div className="flex gap-0.5">
            {Array.from({ length: stars }).map((_, i) => (
              <span key={i} className="text-xs text-brand-red">
                ★
              </span>
            ))}
          </div>
        </div>
      </div>
      <p className="flex-1 text-sm italic text-gray-200 font-body">
        &ldquo;{quote}&rdquo;
      </p>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-brand-blue font-body">
        {program}
      </p>
    </div>
  );
}
