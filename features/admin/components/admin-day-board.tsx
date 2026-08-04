"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addDays, format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { formatInTimeZone } from "date-fns-tz";
import {
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Check,
  X,
  UserX,
  Phone,
  Undo2,
  StickyNote,
} from "lucide-react";
import {
  setAppointmentNotesAction,
  setAppointmentStatusAction,
} from "@/actions/admin";
import { AdminNav } from "@/features/admin/components/admin-nav";
import { BUSINESS } from "@/lib/constants";
import { formatCrc, formatPhoneDisplay } from "@/utils/date";
import {
  buildReminderToCustomerMessage,
  buildWhatsAppUrl,
} from "@/utils/whatsapp";
import { formatDuration } from "@/features/booking/types";
import { cn } from "@/lib/utils";

type AppointmentRow = {
  id: string;
  customerName: string;
  customerPhone: string;
  startAt: string;
  endAt: string;
  status: string;
  notes: string | null;
  service: {
    name: string;
    priceCrc: number;
    durationMinutes: number;
  };
  barber: { name: string };
};

type Props = {
  date: string;
  total: number;
  upcoming: number;
  completed: number;
  revenueCrc: number;
  appointments: AppointmentRow[];
};

export function AdminDayBoard({
  date,
  total,
  upcoming,
  completed,
  revenueCrc,
  appointments,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [notesById, setNotesById] = useState<Record<string, string | null>>(
    () => Object.fromEntries(appointments.map((a) => [a.id, a.notes])),
  );
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [draftNote, setDraftNote] = useState("");
  const [noteError, setNoteError] = useState<string | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    setNotesById(
      Object.fromEntries(appointments.map((a) => [a.id, a.notes])),
    );
  }, [appointments]);

  const todayYmd = formatInTimeZone(now, BUSINESS.timezone, "yyyy-MM-dd");
  const isToday = date === todayYmd;
  const clock = formatInTimeZone(now, BUSINESS.timezone, "h:mm a");

  const dateLabel = useMemo(() => {
    const label = format(parseISO(date), "EEEE d 'de' MMMM", { locale: es });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }, [date]);

  const active = appointments.filter((a) => a.status !== "CANCELLED");
  const cancelled = appointments.filter((a) => a.status === "CANCELLED");

  const nextUp = active.find(
    (a) => a.status === "PENDING" || a.status === "CONFIRMED",
  );

  function goTo(nextDate: string) {
    router.push(`/admin?date=${nextDate}`);
  }

  function shift(days: number) {
    goTo(format(addDays(parseISO(date), days), "yyyy-MM-dd"));
  }

  function updateStatus(
    id: string,
    status: "COMPLETED" | "CANCELLED" | "NO_SHOW" | "CONFIRMED",
  ) {
    if (status === "CANCELLED") {
      const ok = window.confirm(
        "¿Cancelar esta cita? El horario quedará libre otra vez.",
      );
      if (!ok) return;
    }

    setBusyId(id);
    startTransition(() => {
      void setAppointmentStatusAction({ id, status }).then(() => {
        setBusyId(null);
        router.refresh();
      });
    });
  }

  function openNoteEditor(id: string) {
    setEditingNoteId(id);
    setDraftNote(notesById[id] ?? "");
    setNoteError(null);
  }

  function closeNoteEditor() {
    setEditingNoteId(null);
    setDraftNote("");
    setNoteError(null);
  }

  function saveNote(id: string) {
    setNoteError(null);
    setBusyId(id);
    startTransition(() => {
      void setAppointmentNotesAction({ id, notes: draftNote }).then(
        (result) => {
          setBusyId(null);
          if (!result.success) {
            setNoteError(result.error);
            return;
          }
          setNotesById((current) => ({
            ...current,
            [id]: result.data.notes,
          }));
          closeNoteEditor();
          router.refresh();
        },
      );
    });
  }

  return (
    <div className="bg-luxury min-h-dvh">
      <div className="mx-auto w-full max-w-5xl px-5 py-5 md:px-8 md:py-6">
        <AdminNav subtitle={`${isToday ? "Hoy" : dateLabel} · ${clock}`} />

        <div className="mt-5 flex items-stretch gap-2 md:gap-3">
          <button
            type="button"
            onClick={() => shift(-1)}
            className="flex h-14 w-14 shrink-0 items-center justify-center border border-border bg-surface text-silver active:bg-surface-elevated md:h-16 md:w-16"
            aria-label="Día anterior"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <div className="flex min-w-0 flex-1 flex-col items-center justify-center border border-border bg-surface px-4 py-2 text-center">
            <p className="text-base font-medium text-foreground md:text-lg">
              {isToday ? "Hoy" : dateLabel}
            </p>
            {isToday ? (
              <p className="text-xs text-muted md:text-sm">{dateLabel}</p>
            ) : (
              <button
                type="button"
                onClick={() => goTo(todayYmd)}
                className="mt-0.5 text-xs text-silver hover:underline md:text-sm"
              >
                Ir a hoy
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => shift(1)}
            className="flex h-14 w-14 shrink-0 items-center justify-center border border-border bg-surface text-silver active:bg-surface-elevated md:h-16 md:w-16"
            aria-label="Día siguiente"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 border border-border bg-surface text-center md:gap-0 md:divide-x md:divide-border">
          <Stat value={String(upcoming)} label="Por atender" />
          <Stat value={String(completed)} label="Listas" />
          <Stat
            value={String(total)}
            label={revenueCrc > 0 ? `Total · ${formatCrc(revenueCrc)}` : "Total"}
          />
        </div>

        <section className="mt-5 grid gap-3 md:grid-cols-2 md:gap-4">
          {active.length === 0 && cancelled.length === 0 ? (
            <div className="border border-dashed border-border px-4 py-16 text-center md:col-span-2">
              <p className="text-lg text-silver-dim">Sin citas este día</p>
            </div>
          ) : null}

          {active.map((appt) => {
            const busy = pending && busyId === appt.id;
            const isNext = nextUp?.id === appt.id;
            const done =
              appt.status === "COMPLETED" || appt.status === "NO_SHOW";
            const note = notesById[appt.id] ?? null;
            const hasNote = Boolean(note?.trim());
            const editing = editingNoteId === appt.id;
            const phoneDigits = appt.customerPhone.replace(/\D/g, "");
            const endLabel = formatInTimeZone(
              appt.endAt,
              BUSINESS.timezone,
              "h:mm a",
            );
            const fechaLabel = formatInTimeZone(
              appt.startAt,
              BUSINESS.timezone,
              "EEEE d 'de' MMMM",
              { locale: es },
            );
            const horaLabel = formatInTimeZone(
              appt.startAt,
              BUSINESS.timezone,
              "h:mm a",
            );
            const reminderHref = buildWhatsAppUrl(
              appt.customerPhone,
              buildReminderToCustomerMessage({
                customerName: appt.customerName,
                serviceName: appt.service.name,
                fecha: fechaLabel,
                hora: horaLabel,
              }),
            );

            return (
              <article
                key={appt.id}
                className={cn(
                  "flex flex-col border bg-surface p-4 md:p-5",
                  isNext ? "border-silver/45" : "border-border",
                )}
              >
                {isNext ? (
                  <p className="mb-2 text-[10px] tracking-[0.18em] text-silver-dim uppercase">
                    Siguiente
                  </p>
                ) : null}

                <div
                  className={cn(
                    "flex items-start justify-between gap-3",
                    done && "opacity-55",
                  )}
                >
                  <div>
                    <p className="font-display text-3xl leading-none text-silver-bright md:text-4xl">
                      {formatInTimeZone(
                        appt.startAt,
                        BUSINESS.timezone,
                        "h:mm a",
                      )}
                    </p>
                    <p className="mt-1 text-xs text-muted">hasta {endLabel}</p>
                  </div>
                  <StatusChip status={appt.status} />
                </div>

                <div className={cn("mt-4 flex-1", done && "opacity-55")}>
                  <p className="text-lg text-foreground md:text-xl">
                    {appt.customerName}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {appt.service.name} ·{" "}
                    {formatDuration(appt.service.durationMinutes)} ·{" "}
                    {formatCrc(appt.service.priceCrc)}
                  </p>
                  <p className="mt-1 text-sm text-silver">
                    {appt.barber.name.split(" ")[0] ?? appt.barber.name}
                  </p>
                  <a
                    href={`tel:+${phoneDigits}`}
                    className="mt-2 inline-flex min-h-10 items-center gap-1.5 text-sm text-silver hover:underline"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {formatPhoneDisplay(appt.customerPhone)}
                  </a>
                </div>

                <div className="mt-4 space-y-2">
                  {editing ? (
                    <div className="space-y-2 border border-border bg-background p-3">
                      <label className="block space-y-1.5">
                        <span className="text-xs text-muted">Nota</span>
                        <textarea
                          value={draftNote}
                          onChange={(e) => setDraftNote(e.target.value)}
                          rows={3}
                          maxLength={500}
                          placeholder="Ej: se llevó cera, cambió a corte + barba…"
                          className="min-h-20 w-full resize-y border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted focus:border-silver/50"
                          autoFocus
                        />
                      </label>
                      {noteError ? (
                        <p className="text-sm text-danger">{noteError}</p>
                      ) : null}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={closeNoteEditor}
                          className="inline-flex min-h-11 items-center justify-center border border-border text-sm text-muted active:bg-surface-elevated disabled:opacity-40"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => saveNote(appt.id)}
                          className="inline-flex min-h-11 items-center justify-center bg-silver text-sm font-medium text-black active:bg-silver-bright disabled:opacity-40"
                        >
                          {busy ? "Guardando…" : "Guardar"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => openNoteEditor(appt.id)}
                      className="inline-flex min-h-11 w-full items-center justify-center gap-2 border border-border bg-background text-sm text-silver active:bg-surface-elevated disabled:opacity-40 md:min-h-12"
                    >
                      <StickyNote className="h-4 w-4" />
                      {hasNote ? "Ver notas" : "Agregar nota"}
                    </button>
                  )}

                  {!done ? (
                    <>
                      <a
                        href={reminderHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-11 w-full items-center justify-center gap-2 border border-border bg-background text-sm text-silver active:bg-surface-elevated md:min-h-12"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Enviar recordatorio
                      </a>

                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => updateStatus(appt.id, "COMPLETED")}
                        className="inline-flex min-h-12 w-full items-center justify-center gap-2 bg-silver text-sm font-medium text-black active:bg-silver-bright disabled:opacity-40 md:min-h-14 md:text-base"
                      >
                        <Check className="h-4 w-4" />
                        {busy ? "Guardando…" : "Ya atendí"}
                      </button>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => updateStatus(appt.id, "NO_SHOW")}
                          className="inline-flex min-h-11 items-center justify-center gap-1.5 border border-border text-sm text-muted active:bg-surface-elevated disabled:opacity-40 md:min-h-12"
                        >
                          <UserX className="h-4 w-4" />
                          No vino
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => updateStatus(appt.id, "CANCELLED")}
                          className="inline-flex min-h-11 items-center justify-center gap-1.5 border border-border text-sm text-danger active:bg-surface-elevated disabled:opacity-40 md:min-h-12"
                        >
                          <X className="h-4 w-4" />
                          Cancelar
                        </button>
                      </div>
                    </>
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => updateStatus(appt.id, "CONFIRMED")}
                      className="inline-flex min-h-10 w-full items-center justify-center gap-1.5 text-sm text-muted hover:text-silver active:text-silver-bright disabled:opacity-40"
                    >
                      <Undo2 className="h-3.5 w-3.5" />
                      {busy ? "Guardando…" : "Deshacer"}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </section>

        {cancelled.length > 0 ? (
          <details className="mt-4 border border-border bg-surface">
            <summary className="cursor-pointer px-4 py-3 text-sm text-muted">
              Canceladas ({cancelled.length})
            </summary>
            <ul className="space-y-1.5 border-t border-border px-4 py-3 md:columns-2">
              {cancelled.map((appt) => (
                <li
                  key={appt.id}
                  className="break-inside-avoid text-sm text-muted"
                >
                  <span className="text-silver">
                    {formatInTimeZone(
                      appt.startAt,
                      BUSINESS.timezone,
                      "h:mm a",
                    )}
                  </span>
                  {" · "}
                  {appt.customerName} · {appt.service.name}
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-2 py-3">
      <p className="text-xl text-silver-bright md:text-2xl">{value}</p>
      <p className="mt-0.5 text-[11px] text-muted md:text-xs">{label}</p>
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    PENDING: {
      label: "Por atender",
      className: "border-silver/30 text-silver",
    },
    CONFIRMED: {
      label: "Por atender",
      className: "border-silver/30 text-silver",
    },
    COMPLETED: {
      label: "Listo",
      className: "border-success/35 text-success",
    },
    NO_SHOW: {
      label: "No vino",
      className: "border-border text-muted",
    },
    CANCELLED: {
      label: "Cancelada",
      className: "border-danger/30 text-danger",
    },
  };

  const chip = map[status] ?? {
    label: status,
    className: "border-border text-muted",
  };

  return (
    <span
      className={cn(
        "border px-2 py-0.5 text-[10px] tracking-wide uppercase",
        chip.className,
      )}
    >
      {chip.label}
    </span>
  );
}
