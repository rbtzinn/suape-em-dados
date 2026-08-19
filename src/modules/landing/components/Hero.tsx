import Link from "next/link";
import { ProductPreview } from "./ProductPreview";

export function Hero() {
  return (
    <section className="relative border-b border-[var(--line)]" aria-labelledby="hero-title">
      <div className="hero-grid absolute inset-0 -z-10" aria-hidden="true" />
      <div className="mx-auto grid max-w-[1440px] gap-12 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[0.78fr_1.22fr] lg:items-center lg:gap-14 lg:px-12 lg:py-24">
        <div className="max-w-[640px]">
          <p className="eyebrow">Inteligência institucional para Compliance</p>
          <h1 id="hero-title" className="mt-5 max-w-[9ch] text-[clamp(3rem,6vw,4.9rem)] font-semibold leading-[0.98] tracking-[-0.055em]">SUAPE em Dados</h1>
          <p className="mt-7 max-w-[610px] text-xl font-medium leading-snug tracking-[-0.02em] text-[var(--ink-soft)] sm:text-2xl">Inteligência, integração e rastreabilidade para o Compliance.</p>
          <p className="mt-4 max-w-[560px] text-[15px] leading-7 text-[var(--muted)] sm:text-base">Fontes consolidadas, evidências rastreáveis e cruzamentos que qualificam a análise.</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link className="focus-ring primary-button" href="/login">Acessar plataforma<span aria-hidden="true">→</span></Link>
            <a className="focus-ring secondary-button" href="#rastreabilidade">Ver rastreabilidade</a>
          </div>
          <div className="mt-9 flex flex-wrap gap-x-5 gap-y-2 border-t border-[var(--line)] pt-5 text-xs text-[var(--muted)]"><span>Usuários autorizados</span><span>Rastreabilidade por evidência</span><span>Auditoria institucional</span></div>
        </div>
        <ProductPreview />
      </div>
    </section>
  );
}
