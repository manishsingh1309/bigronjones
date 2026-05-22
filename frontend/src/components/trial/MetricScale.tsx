// 1–10 button-grid scale — adapted from the original Replit MetricScale
// component. Replit used amber/gold accents; ours uses BigRonJones® crimson.
//
// Each value is a button you can tap (not a draggy slider) which makes it
// faster + more precise on mobile, and matches the Replit oversight UI Ron
// already knows.

type Props = {
  value: number;
  onChange: (val: number) => void;
  label: string;
  description?: string;
  lowLabel: string;
  highLabel: string;
  /** Whether 0 is a valid score (soreness allows 0). Defaults to false (1–10). */
  allowZero?: boolean;
};

export function MetricScale({
  value,
  onChange,
  label,
  description,
  lowLabel,
  highLabel,
  allowZero = false,
}: Props) {
  const min = allowZero ? 0 : 1;
  const range = Array.from({ length: 11 - min }, (_, i) => i + min);

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between">
        <div>
          <label className="block font-['DM_Sans'] text-sm font-semibold text-white">
            {label}
          </label>
          {description && (
            <p className="mt-1 font-['DM_Sans'] text-xs text-white/40">
              {description}
            </p>
          )}
        </div>
        <div className="font-['Bebas_Neue'] text-3xl leading-none text-[#E8192C]">
          {value}
          <span className="font-['DM_Sans'] text-sm text-white/30">/10</span>
        </div>
      </div>

      <div className="flex gap-1">
        {range.map((num) => {
          const isSelected = value === num;
          return (
            <button
              key={num}
              type="button"
              onClick={() => onChange(num)}
              aria-label={`${label}: ${num}`}
              aria-pressed={isSelected}
              className={
                "h-11 flex-1 font-['Bebas_Neue'] text-lg transition-all duration-150 " +
                (isSelected
                  ? "z-10 scale-110 bg-[#E8192C] text-white shadow-[0_0_12px_rgba(232,25,44,0.5)]"
                  : "border border-white/10 bg-white/5 text-white/40 hover:border-white/20 hover:bg-white/10 hover:text-white")
              }
            >
              {num}
            </button>
          );
        })}
      </div>

      <div className="flex justify-between font-['DM_Mono'] text-[9px] uppercase tracking-widest text-white/30">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}
