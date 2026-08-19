import Link from "next/link";

export function LandingHeader() {
  return (
    <header className="relative z-20 border-b border-[var(--line)] bg-[color:rgba(246,248,246,0.92)] backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-[7px] border border-[var(--accent)] bg-[var(--accent-soft)] text-[11px] font-bold tracking-[0.12em] text-[var(--accent)]">SD</span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-[-0.01em]">SUAPE em Dados</p>
            <p className="hidden text-[11px] text-[var(--muted)] sm:block">Inteligência institucional • Compliance</p>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="hidden items-center gap-2 text-xs text-[var(--muted)] md:flex"><span className="size-1.5 rounded-full bg-[var(--accent)]" aria-hidden="true" />Acesso restrito</span>
          <Link className="focus-ring action-link" href="/login">Acessar plataforma<span aria-hidden="true">↗</span></Link>
        </div>
      </div>
    </header>
  );
}
