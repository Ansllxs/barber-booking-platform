"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  saveAdminServiceAction,
  toggleServiceActiveAction,
} from "@/actions/admin-config";
import { AdminNav } from "@/features/admin/components/admin-nav";
import { formatCrc } from "@/utils/date";
import { formatDuration } from "@/features/booking/types";
import { cn } from "@/lib/utils";

export type AdminServiceRow = {
  id: string;
  name: string;
  description: string | null;
  includes: string[];
  priceCrc: number;
  durationMinutes: number;
  isActive: boolean;
  sortOrder: number;
};

type Draft = {
  id?: string;
  name: string;
  description: string;
  includesText: string;
  priceCrc: string;
  durationMinutes: string;
  isActive: boolean;
  sortOrder: string;
};

const fieldClass =
  "w-full min-h-11 border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-silver/50";

const emptyDraft = (sortOrder = 10): Draft => ({
  name: "",
  description: "",
  includesText: "",
  priceCrc: "10000",
  durationMinutes: "45",
  isActive: true,
  sortOrder: String(sortOrder),
});

export function AdminServicesPanel({
  services,
}: {
  services: AdminServiceRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<Draft | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const nextSort = useMemo(() => {
    if (services.length === 0) return 10;
    return Math.max(...services.map((s) => s.sortOrder)) + 10;
  }, [services]);

  function openCreate() {
    setError(null);
    setMessage(null);
    setEditing(emptyDraft(nextSort));
  }

  function openEdit(service: AdminServiceRow) {
    setError(null);
    setMessage(null);
    setEditing({
      id: service.id,
      name: service.name,
      description: service.description ?? "",
      includesText: service.includes.join("\n"),
      priceCrc: String(service.priceCrc),
      durationMinutes: String(service.durationMinutes),
      isActive: service.isActive,
      sortOrder: String(service.sortOrder),
    });
  }

  function save() {
    if (!editing) return;
    setError(null);
    setMessage(null);

    startTransition(() => {
      void saveAdminServiceAction({
        id: editing.id,
        name: editing.name,
        description: editing.description,
        includesText: editing.includesText,
        priceCrc: Number(editing.priceCrc),
        durationMinutes: Number(editing.durationMinutes),
        isActive: editing.isActive,
        sortOrder: Number(editing.sortOrder),
      }).then((result) => {
        if (!result.success) {
          setError(result.error);
          return;
        }
        setMessage(editing.id ? "Servicio actualizado" : "Servicio creado");
        setEditing(null);
        router.refresh();
      });
    });
  }

  function toggleActive(service: AdminServiceRow) {
    setError(null);
    startTransition(() => {
      void toggleServiceActiveAction({
        id: service.id,
        isActive: !service.isActive,
      }).then((result) => {
        if (!result.success) {
          setError(result.error);
          return;
        }
        router.refresh();
      });
    });
  }

  return (
    <div className="bg-luxury min-h-dvh">
      <div className="mx-auto w-full max-w-5xl px-5 py-5 md:px-8 md:py-6">
        <AdminNav subtitle="Precios, duración y qué incluye cada servicio" />

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">{services.length} servicios</p>
          <button
            type="button"
            onClick={openCreate}
            className="min-h-11 border border-border bg-surface px-4 text-sm text-silver-bright active:bg-surface-elevated"
          >
            + Nuevo servicio
          </button>
        </div>

        {message ? (
          <p className="mt-3 text-sm text-success">{message}</p>
        ) : null}
        {error && !editing ? (
          <p className="mt-3 text-sm text-danger">{error}</p>
        ) : null}

        <section className="mt-4 grid gap-3 md:grid-cols-2 md:gap-4">
          {services.map((service) => (
            <article
              key={service.id}
              className={cn(
                "border bg-surface p-4 md:p-5",
                service.isActive ? "border-border" : "border-border opacity-60",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg text-foreground">{service.name}</p>
                  <p className="mt-1 text-sm text-muted">
                    {formatCrc(service.priceCrc)} ·{" "}
                    {formatDuration(service.durationMinutes)}
                  </p>
                </div>
                <span
                  className={cn(
                    "border px-2 py-0.5 text-[10px] uppercase",
                    service.isActive
                      ? "border-success/35 text-success"
                      : "border-border text-muted",
                  )}
                >
                  {service.isActive ? "Activo" : "Oculto"}
                </span>
              </div>

              {service.description ? (
                <p className="mt-3 line-clamp-2 text-sm text-muted">
                  {service.description}
                </p>
              ) : null}

              {service.includes.length > 0 ? (
                <p className="mt-2 text-xs text-silver-dim">
                  Incluye {service.includes.length} ítems
                </p>
              ) : null}

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => openEdit(service)}
                  className="min-h-11 border border-border text-sm text-silver active:bg-surface-elevated disabled:opacity-40"
                >
                  Editar
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => toggleActive(service)}
                  className="min-h-11 border border-border text-sm text-muted active:bg-surface-elevated disabled:opacity-40"
                >
                  {service.isActive ? "Ocultar" : "Activar"}
                </button>
              </div>
            </article>
          ))}
        </section>

        {editing ? (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
            <div className="max-h-[90dvh] w-full max-w-lg overflow-y-auto border border-border bg-surface p-5">
              <h2 className="font-display text-2xl text-silver-bright">
                {editing.id ? "Editar servicio" : "Nuevo servicio"}
              </h2>

              <div className="mt-4 space-y-3">
                <Field label="Nombre">
                  <input
                    value={editing.name}
                    onChange={(e) =>
                      setEditing({ ...editing, name: e.target.value })
                    }
                    className={fieldClass}
                  />
                </Field>
                <Field label="Descripción">
                  <textarea
                    value={editing.description}
                    onChange={(e) =>
                      setEditing({ ...editing, description: e.target.value })
                    }
                    rows={3}
                    className={fieldClass}
                  />
                </Field>
                <Field label="Qué incluye (una línea por ítem)">
                  <textarea
                    value={editing.includesText}
                    onChange={(e) =>
                      setEditing({ ...editing, includesText: e.target.value })
                    }
                    rows={4}
                    className={fieldClass}
                    placeholder={"Corte\nBarba\nCejas"}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Precio (₡)">
                    <input
                      inputMode="numeric"
                      value={editing.priceCrc}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          priceCrc: e.target.value.replace(/\D/g, ""),
                        })
                      }
                      className={fieldClass}
                    />
                  </Field>
                  <Field label="Duración (min)">
                    <input
                      inputMode="numeric"
                      value={editing.durationMinutes}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          durationMinutes: e.target.value.replace(/\D/g, ""),
                        })
                      }
                      className={fieldClass}
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Orden">
                    <input
                      inputMode="numeric"
                      value={editing.sortOrder}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          sortOrder: e.target.value.replace(/\D/g, ""),
                        })
                      }
                      className={fieldClass}
                    />
                  </Field>
                  <label className="mt-6 flex min-h-11 items-center gap-2 text-sm text-silver">
                    <input
                      type="checkbox"
                      checked={editing.isActive}
                      onChange={(e) =>
                        setEditing({ ...editing, isActive: e.target.checked })
                      }
                    />
                    Visible en reservas
                  </label>
                </div>
              </div>

              {error ? (
                <p className="mt-3 text-sm text-danger">{error}</p>
              ) : null}

              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setEditing(null)}
                  className="min-h-12 border border-border text-sm text-muted"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={pending || !editing.name.trim()}
                  onClick={save}
                  className="min-h-12 bg-silver text-sm font-medium text-black disabled:opacity-40"
                >
                  {pending ? "Guardando…" : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs tracking-wide text-silver-dim uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}
