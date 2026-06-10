import Link from "next/link";
import { ReactNode } from "react";

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  primary?: boolean;
  ariaLabel?: string;
};

export function ButtonLink({ href, children, primary, ariaLabel }: ButtonLinkProps) {
  return (
    <Link aria-label={ariaLabel} className={`btn ${primary ? "btn-primary" : ""}`} href={href}>
      {children}
    </Link>
  );
}
