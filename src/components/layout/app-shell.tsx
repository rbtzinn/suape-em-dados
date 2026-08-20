"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import type { SessionUser } from "@/auth/session";
import type { SystemSnapshot } from "@/domain/types";
import { Icon, type IconName } from "@/components/ui/icon";

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
}

const groups: Array<{ label: string; items: NavItem[] }> = [
  { label: "Visão geral", items: [{ href: "/", label: "Painel executivo", icon: "overview" }] },
  {
    label: "Contratos",
    items: [
      { href: "/contratos", label: "Carteira", icon: "contract" },
      { href: "/contratos/fiscais-comissoes", label: "Fiscais e comissões", icon: "people" },
      { href: "/contratos/remessa-lai", label: "Remessa × LAI", icon: "shield" },
    ],
  },
  {
    label: "Pessoas",
    items: [
      { href: "/terceirizados", label: "Terceirizados", icon: "people" },
      { href: "/folha", label: "Folha de pagamento", icon: "payroll" },
    ],
  },
  {
    label: "Viagens",
    items: [
      { href: "/viagens", label: "Mapa de viagens", icon: "travel" },
      { href: "/viagens/conformidade", label: "Conformidade", icon: "shield" },
    ],
  },
  {
    label: "Governança",
    items: [{ href: "/admin/importacoes", label: "Importações", icon: "upload" }],
  },
];

const pageNames: Record<string, string> = {
  contratos: "Contratos",
  "fiscais-comissoes": "Fiscais e comissões",
  "remessa-lai": "Remessa × LAI",
  terceirizados: "Terceirizados",
  folha: "Folha de pagamento",
  viagens: "Viagens e diárias",
  conformidade: "Conformidade",
  admin: "Administração",
  importacoes: "Importações",
};

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/contratos") return pathname === href || /^\/contratos\/[^/]+$/.test(pathname);
  return pathname.startsWith(href);
}

export function AppShell({
  session,
  meta,
  children,
}: {
  session: SessionUser;
  meta: SystemSnapshot["meta"];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const breadcrumbs = pathname.split("/").filter(Boolean).map((part) => pageNames[part] ?? part);

  return (
    <div className="app-shell">
      <button
        className={`sidebar-scrim ${menuOpen ? "is-open" : ""}`}
        aria-label="Fechar menu"
        onClick={() => setMenuOpen(false)}
      />
      <aside className={`sidebar ${menuOpen ? "is-open" : ""}`}>
        <div className="brand-row">
          <Link href="/" className="brand" onClick={() => setMenuOpen(false)}>
            <span className="brand-mark">S</span>
            <span><strong>SUAPE</strong><small>em dados</small></span>
          </Link>
          <button className="icon-button sidebar-close" aria-label="Fechar menu" onClick={() => setMenuOpen(false)}><Icon name="close" /></button>
        </div>

        <nav aria-label="Navegação principal">
          {groups.map((group) => (
            <div className="nav-group" key={group.label}>
              <span className="nav-label">{group.label}</span>
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-item ${isActive(pathname, item.href) ? "active" : ""}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <Icon name={item.icon} />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-avatar">{session.name.slice(0, 1).toUpperCase()}</div>
          <div className="user-copy"><strong>{session.name}</strong><span>{session.role}</span></div>
          {!session.demo && (
            <form action="/api/auth/logout" method="post">
              <button className="icon-button" aria-label="Sair"><Icon name="logout" /></button>
            </form>
          )}
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <button className="icon-button menu-button" aria-label="Abrir menu" onClick={() => setMenuOpen(true)}><Icon name="menu" /></button>
          <div className="breadcrumbs">
            <Link href="/">SUAPE em Dados</Link>
            {breadcrumbs.map((part, index) => <span key={`${part}-${index}`}><Icon name="arrow" />{part}</span>)}
          </div>
          <div className="topbar-actions">
            <div className="quick-search"><Icon name="search" /><span>Buscar no portal</span><kbd>⌘ K</kbd></div>
            <span className={`mode-pill mode-${meta.mode}`}><i />{meta.mode === "sheets" ? "Sheets" : meta.mode === "demo" ? "Demo" : "Atenção"}</span>
          </div>
        </header>
        <main className="main-content">{children}</main>
        <footer className="app-footer">
          <span>SUAPE em Dados · Uso interno</span>
          <span>Rastreabilidade preservada por fonte e competência</span>
        </footer>
      </div>
    </div>
  );
}
