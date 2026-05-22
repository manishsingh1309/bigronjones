type Variant = "mixed" | "upper";

interface Props {
  variant?: Variant;
  className?: string;
}

export default function BrandName({ variant = "mixed", className }: Props) {
  const text = variant === "upper" ? "BIGRONJONES" : "BigRonJones";
  return (
    <span className={className}>
      {text}
      <sup
        style={{
          fontSize: "0.45em",
          verticalAlign: "super",
          lineHeight: 0,
          fontWeight: "inherit",
          letterSpacing: 0,
          marginLeft: "0.05em",
        }}
      >
        ®
      </sup>
    </span>
  );
}
