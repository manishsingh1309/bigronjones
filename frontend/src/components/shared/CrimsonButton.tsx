
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

type Variant = "solid" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

interface BaseProps {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  className?: string;
}

interface LinkProps extends BaseProps {
  href: string;
  external?: boolean;
  onClick?: never;
  type?: never;
  disabled?: never;
}

interface ButtonProps extends BaseProps {
  href?: never;
  external?: never;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

type Props = LinkProps | ButtonProps;

const sizeStyles: Record<Size, string> = {
  sm: "px-4 py-2 text-[10px]",
  md: "px-6 py-3.5 text-[11px]",
  lg: "px-8 py-4 text-[13px]",
};

const variantStyles: Record<Variant, string> = {
  solid:
    "bg-[#E8192C] text-white hover:bg-[#b50f1f] border border-transparent",
  outline:
    "border border-[#1a1a1a] text-white hover:border-[#E8192C] hover:bg-[#E8192C]",
  ghost:
    "border border-transparent text-[#E8192C] hover:text-white underline underline-offset-4",
};

export default function CrimsonButton(props: Props) {
  const {
    children,
    variant = "solid",
    size = "md",
    fullWidth,
    className,
  } = props;

  const classes = cn(
    "inline-flex items-center justify-center gap-2 font-['DM_Mono'] uppercase tracking-[0.18em] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed",
    sizeStyles[size],
    variantStyles[variant],
    fullWidth && "w-full",
    className
  );

  if ("href" in props && props.href) {
    if (props.external) {
      return (
        <motion.a
          href={props.href}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={classes}
        >
          {children}
        </motion.a>
      );
    }
    return (
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Link to={props.href} className={classes}>
          {children}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.button
      type={props.type ?? "button"}
      onClick={props.onClick}
      disabled={props.disabled}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={classes}
    >
      {children}
    </motion.button>
  );
}
