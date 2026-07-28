"use client";

import { STEP_LABELS, WIZARD_STEPS, type WizardStep } from "@/features/booking/types";
import { cn } from "@/lib/utils";

export function BookingProgress({ step }: { step: WizardStep }) {
  const index = WIZARD_STEPS.indexOf(step);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        {WIZARD_STEPS.map((s, i) => (
          <div
            key={s}
            className={cn(
              "h-1 flex-1 rounded-full transition",
              i <= index ? "bg-silver" : "bg-white/10",
            )}
          />
        ))}
      </div>
      <p className="text-xs tracking-[0.2em] text-silver-dim uppercase">
        Paso {index + 1} de {WIZARD_STEPS.length} · {STEP_LABELS[step]}
      </p>
    </div>
  );
}
