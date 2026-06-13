import { Link } from "react-router-dom";
import type { ReactNode } from "react";

/**
 * Renders a real <a> for external/absolute URLs (http/https/mailto) and a
 * react-router <Link> for in-app paths. react-router's <Link to="https://...">
 * treats the URL as a relative path and breaks, so any CTA that may point to an
 * external funnel (e.g. thebigronjones.com/fitnessalliance) should use this.
 */
export default function SmartLink({
  to,
  className,
  children,
  onClick,
  target,
}: {
  to: string;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
  target?: string;
}) {
  const external = /^(https?:|mailto:|tel:)/i.test(to);
  if (external) {
    return (
      <a
        href={to}
        className={className}
        onClick={onClick}
        // Open new tab only when explicitly asked; default is a same-tab
        // redirect so it behaves like a real navigation.
        target={target}
        rel={target === "_blank" ? "noopener noreferrer" : undefined}
      >
        {children}
      </a>
    );
  }
  return (
    <Link to={to} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}
