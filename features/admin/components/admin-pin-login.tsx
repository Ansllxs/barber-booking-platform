"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Delete } from "lucide-react";
import { adminLoginAction } from "@/actions/admin";
import { BrandLogo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

export function AdminPinLogin() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const submitting = useRef(false);

  function attemptLogin(value: string) {
    if (submitting.current || value.length !== 4) return;
    submitting.current = true;
    setError(null);
    startTransition(() => {
      void adminLoginAction(value).then((result) => {
        submitting.current = false;
        if (!result.success) {
          setError(result.error);
          setPin("");
          return;
        }
        router.replace("/admin");
        router.refresh();
      });
    });
  }

  function pressDigit(digit: string) {
    if (pending) return;
    setPin((current) => {
      if (current.length >= 4) return current;
      return current + digit;
    });
  }

  function backspace() {
    if (pending) return;
    setError(null);
    setPin((current) => current.slice(0, -1));
  }

  useEffect(() => {
    if (pin.length === 4) attemptLogin(pin);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  return (
    <main className="bg-luxury relative flex min-h-dvh items-center justify-center px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_45%_at_50%_20%,rgba(184,155,76,0.2),transparent)]" />

      <div className="relative w-full max-w-sm space-y-8">
        <div className="space-y-4 text-center">
          <BrandLogo size="lg" href={null} className="mx-auto" />
          <div>
            <p className="text-[11px] tracking-[0.3em] text-gold uppercase">
              COELI BARBER CLUB
            </p>
            <h1 className="font-display mt-2 text-3xl text-silver-bright">
              Agenda
            </h1>
            <p className="mt-2 text-sm text-muted">Ingresá el PIN</p>
          </div>
        </div>

        <div className="flex justify-center gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-3.5 w-3.5 rounded-full border transition",
                i < pin.length
                  ? "border-gold bg-gold shadow-[0_0_12px_rgba(184,155,76,0.55)]"
                  : "border-silver/30 bg-transparent",
              )}
            />
          ))}
        </div>

        {error ? (
          <p className="text-center text-sm text-danger">{error}</p>
        ) : pending ? (
          <p className="text-center text-sm text-gold">Entrando…</p>
        ) : (
          <p className="h-5" />
        )}

        <div className="grid grid-cols-3 gap-3">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"].map(
            (key, index) => {
              if (key === "") {
                return <span key={`empty-${index}`} />;
              }
              if (key === "del") {
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={backspace}
                    className="flex h-16 items-center justify-center rounded-2xl border border-border/80 bg-surface/70 text-muted active:scale-95 active:bg-surface-elevated"
                    aria-label="Borrar"
                  >
                    <Delete className="h-5 w-5" />
                  </button>
                );
              }
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => pressDigit(key)}
                  className="flex h-16 items-center justify-center rounded-2xl border border-border/80 bg-surface/70 text-2xl text-silver-bright active:scale-95 active:border-gold/40 active:bg-gold/10"
                >
                  {key}
                </button>
              );
            },
          )}
        </div>
      </div>
    </main>
  );
}
