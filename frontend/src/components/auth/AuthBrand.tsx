import { Link } from "react-router-dom";

// Brand lockup for the auth screens — circular Ron headshot + the wordmark
// logo. Putting Ron's face + the real logo on sign-in / sign-up (and the
// Google redirect callback) makes the flow unmistakably BigRonJones, which
// builds trust for non-technical users before they hand off to Google.
export default function AuthBrand({
  className = "",
  asLink = true,
}: {
  className?: string;
  asLink?: boolean;
}) {
  const inner = (
    <>
      <img
        src="/images/ron/bigronjones.jpg"
        alt="Big Ron Jones"
        className="h-9 w-9 select-none rounded-full border border-[#E8192C]/60 object-cover object-center"
        draggable={false}
      />
      <img
        src="/assets/bigronjones-logo.png"
        alt="BIGRONJONES®"
        className="h-7 w-auto select-none mix-blend-screen"
        draggable={false}
      />
    </>
  );

  if (!asLink) {
    return (
      <span className={`inline-flex items-center gap-2.5 ${className}`}>
        {inner}
      </span>
    );
  }

  return (
    <Link
      to="/"
      aria-label="BigRonJones home"
      className={`inline-flex items-center gap-2.5 ${className}`}
    >
      {inner}
    </Link>
  );
}
