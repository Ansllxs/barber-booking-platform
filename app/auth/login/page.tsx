export default function LoginPlaceholderPage() {
  return (
    <main className="bg-luxury flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm border border-border bg-surface p-8">
        <h1 className="font-display text-3xl text-silver-bright">Iniciar sesión</h1>
        <p className="mt-3 text-sm text-muted">
          Supabase Auth se conecta en la Fase 4. Configura las variables
          NEXT_PUBLIC_SUPABASE_* cuando tengas el proyecto listo.
        </p>
      </div>
    </main>
  );
}
