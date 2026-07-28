"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  createBookingAction,
  getAvailabilityAction,
  getBookableDatesAction,
} from "@/actions/appointments";
import { BookingProgress } from "@/features/booking/components/booking-progress";
import { ServiceStep } from "@/features/booking/components/service-step";
import { DateStep } from "@/features/booking/components/date-step";
import { TimeStep } from "@/features/booking/components/time-step";
import { DetailsStep } from "@/features/booking/components/details-step";
import { ConfirmStep } from "@/features/booking/components/confirm-step";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand/logo";
import type {
  BookingBarber,
  BookingService,
  WizardStep,
} from "@/features/booking/types";
import type { TimeSlot } from "@/types/booking";
import type { BookingCustomerInput } from "@/schemas/booking";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Props = {
  services: BookingService[];
  barber: BookingBarber;
};

export function BookingWizard({ services, barber }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>("service");
  const [service, setService] = useState<BookingService | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [slot, setSlot] = useState<TimeSlot | null>(null);
  const [customer, setCustomer] = useState<BookingCustomerInput>({
    customerName: "",
    customerPhone: "",
  });
  const [dates, setDates] = useState<string[]>([]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingDates, setLoadingDates] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!service) return;

    let cancelled = false;
    setLoadingDates(true);
    setDates([]);
    setDate(null);
    setSlot(null);
    setSlots([]);

    void getBookableDatesAction({
      serviceId: service.id,
      barberId: barber.id,
    }).then((result) => {
      if (cancelled) return;
      setLoadingDates(false);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setDates(result.data);
      setError(null);
    });

    return () => {
      cancelled = true;
    };
  }, [service, barber.id]);

  useEffect(() => {
    if (!service || !date) return;

    let cancelled = false;
    setLoadingSlots(true);
    setSlots([]);
    setSlot(null);

    void getAvailabilityAction({
      serviceId: service.id,
      barberId: barber.id,
      date,
    }).then((result) => {
      if (cancelled) return;
      setLoadingSlots(false);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setSlots(result.data);
      setError(null);
    });

    return () => {
      cancelled = true;
    };
  }, [service, date, barber.id]);

  function goBack() {
    setError(null);
    if (step === "date") setStep("service");
    else if (step === "time") setStep("date");
    else if (step === "details") setStep("time");
    else if (step === "confirm") setStep("details");
  }

  function confirmBooking() {
    if (!service || !slot) return;
    setError(null);

    startTransition(() => {
      void createBookingAction({
        serviceId: service.id,
        barberId: barber.id,
        startAt: slot.startAt,
        customerName: customer.customerName,
        customerPhone: customer.customerPhone,
      }).then((result) => {
        if (!result.success) {
          setError(result.error);
          return;
        }
        router.push(`/reservar/exito/${result.data.id}`);
      });
    });
  }

  const canContinueService = Boolean(service);
  const canContinueDate = Boolean(date);
  const canContinueTime = Boolean(slot);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-4 sm:max-w-xl sm:px-6 md:max-w-2xl">
      <div className="mb-6 flex items-center justify-between gap-3">
        <BrandLogo size="lg" priority />
        {step !== "service" ? (
          <button
            type="button"
            onClick={goBack}
            className="text-sm text-muted hover:text-silver-bright"
          >
            Atrás
          </button>
        ) : (
          <Link href="/" className="text-sm text-muted hover:text-silver-bright">
            Salir
          </Link>
        )}
      </div>

      <BookingProgress step={step} />

      <div className="mt-8 flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {step === "service" ? (
              <ServiceStep
                services={services}
                selectedId={service?.id ?? null}
                onSelect={(selected) => {
                  setService(selected);
                  setError(null);
                }}
              />
            ) : null}

            {step === "date" ? (
              <DateStep
                dates={dates}
                selectedDate={date}
                loading={loadingDates}
                onSelect={(selected) => {
                  setDate(selected);
                  setError(null);
                }}
              />
            ) : null}

            {step === "time" ? (
              <TimeStep
                slots={slots}
                selectedStartAt={slot?.startAt ?? null}
                loading={loadingSlots}
                onSelect={(selected) => {
                  setSlot(selected);
                  setError(null);
                }}
              />
            ) : null}

            {step === "details" ? (
              <DetailsStep
                defaultValues={customer}
                onSubmit={(values) => {
                  setCustomer(values);
                  setStep("confirm");
                }}
              />
            ) : null}

            {step === "confirm" && service && slot ? (
              <ConfirmStep
                service={service}
                barberName={barber.name}
                startAt={slot.startAt}
                endAt={slot.endAt}
                customerName={customer.customerName}
                customerPhone={customer.customerPhone}
                submitting={isPending}
                error={error}
                onConfirm={confirmBooking}
              />
            ) : null}
          </motion.div>
        </AnimatePresence>

        {error && step !== "confirm" ? (
          <p className="mt-4 text-sm text-danger">{error}</p>
        ) : null}
      </div>

      {step === "service" || step === "date" || step === "time" ? (
        <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:px-6">
          <div className="mx-auto max-w-lg">
            {step === "service" ? (
              <Button
                disabled={!canContinueService}
                onClick={() => setStep("date")}
              >
                Continuar
              </Button>
            ) : null}
            {step === "date" ? (
              <Button
                disabled={!canContinueDate || loadingDates}
                onClick={() => setStep("time")}
              >
                Continuar
              </Button>
            ) : null}
            {step === "time" ? (
              <Button
                disabled={!canContinueTime || loadingSlots}
                onClick={() => setStep("details")}
              >
                Continuar
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
