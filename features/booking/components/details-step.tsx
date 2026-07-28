"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  bookingCustomerSchema,
  type BookingCustomerInput,
} from "@/schemas/booking";
import { Button } from "@/components/ui/button";

export function DetailsStep({
  defaultValues,
  onSubmit,
}: {
  defaultValues: BookingCustomerInput;
  onSubmit: (values: BookingCustomerInput) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BookingCustomerInput>({
    resolver: zodResolver(bookingCustomerSchema),
    defaultValues: {
      customerName: defaultValues.customerName,
      customerPhone: defaultValues.customerPhone?.replace(/\D/g, "").slice(-8) ?? "",
    },
  });

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
      <header className="space-y-2">
        <h2 className="font-display text-3xl text-silver-bright sm:text-4xl">
          Tus datos
        </h2>
        <p className="text-sm text-muted">
          Al confirmar, COELI te enviará la confirmación por WhatsApp a este
          número.
        </p>
      </header>

      <div className="space-y-2">
        <label
          htmlFor="customerName"
          className="text-xs tracking-wide text-silver-dim uppercase"
        >
          Nombre
        </label>
        <input
          id="customerName"
          autoComplete="name"
          className="min-h-12 w-full border border-border bg-surface px-4 text-base text-foreground outline-none placeholder:text-muted/60 focus:border-silver/50"
          placeholder="Tu nombre"
          {...register("customerName")}
        />
        {errors.customerName ? (
          <p className="text-sm text-danger">{errors.customerName.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="customerPhone"
          className="text-xs tracking-wide text-silver-dim uppercase"
        >
          WhatsApp
        </label>
        <div className="flex min-h-12 border border-border bg-surface focus-within:border-silver/50">
          <span className="flex items-center border-r border-border px-3 text-sm text-silver-dim">
            +506
          </span>
          <input
            id="customerPhone"
            autoComplete="tel-national"
            inputMode="numeric"
            maxLength={8}
            className="w-full bg-transparent px-4 text-base text-foreground outline-none placeholder:text-muted/60"
            placeholder="88887777"
            {...register("customerPhone", {
              onChange: (event) => {
                event.target.value = event.target.value.replace(/\D/g, "").slice(0, 8);
              },
            })}
          />
        </div>
        {errors.customerPhone ? (
          <p className="text-sm text-danger">{errors.customerPhone.message}</p>
        ) : null}
        <p className="text-xs text-muted">Solo los 8 dígitos de tu celular.</p>
      </div>

      <Button type="submit">Continuar</Button>
    </form>
  );
}
