"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/brand/logo";
import { adminLogoutAction } from "@/actions/admin";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Agenda" },
  { href: "/admin/servicios", label: "Servicios" },
  { href: "/admin/horarios", label: "Horarios" },
] as const;

export function AdminNav({
  subtitle,
}: {
  subtitle?: string;
}) {
  const pathname = usePathname();

  return (
    <header className="border-b border-border/70 pb-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BrandLogo size="sm" href="/" />
          <div>
            <h1 className="font-display text-2xl text-silver-bright md:text-3xl">
              Panel
            </h1>
            {subtitle ? (
              <p className="text-sm text-muted">{subtitle}</p>
            ) : null}
          </div>
        </div>
        <form action={adminLogoutAction}>
          <button
            type="submit"
            className="min-h-11 px-3 text-sm text-muted hover:text-silver"
          >
            Salir
          </button>
        </form>
      </div>

      <nav className="mt-4 flex gap-2 overflow-x-auto">
        {LINKS.map((link) => {
          const active =
            link.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "inline-flex min-h-11 shrink-0 items-center justify-center border px-4 text-sm",
                active
                  ? "border-silver/50 bg-surface text-silver-bright"
                  : "border-border bg-transparent text-muted hover:text-silver",
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
