
import { motion } from "framer-motion";

interface GoldButtonProps {
  children: React.ReactNode;
  variant?: "solid" | "outline";
  size?: "sm" | "md" | "lg";
  href?: string;
  onClick?: () => void;
  className?: string;
  fullWidth?: boolean;
}

export default function GoldButton({
  children,
  variant = "solid",
  size = "md",
  href,
  onClick,
  className = "",
  fullWidth = false,
}: GoldButtonProps) {
  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  const variantClasses = {
    solid:
      "bg-brand-red text-white font-semibold shadow-lg shadow-brand-red/20 hover:bg-brand-red-light hover:shadow-brand-red/30",
    outline:
      "border-2 border-brand-blue text-white hover:bg-brand-blue/10 hover:border-brand-blue-light",
  };

  const base = `inline-flex items-center justify-center rounded-full font-body tracking-wide transition-all duration-200 hover:scale-105 active:scale-95 ${sizeClasses[size]} ${variantClasses[variant]} ${fullWidth ? "w-full" : ""} ${className}`;

  if (href) {
    return (
      <motion.a
        href={href}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
        className={base}
        whileTap={{ scale: 0.95 }}
      >
        {children}
      </motion.a>
    );
  }

  return (
    <motion.button
      onClick={onClick}
      className={base}
      whileTap={{ scale: 0.95 }}
    >
      {children}
    </motion.button>
  );
}
