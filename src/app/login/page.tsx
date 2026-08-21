import type { Metadata } from "next";

import { FirebaseLoginForm } from "@/components/auth/firebase-login-form";

export const metadata: Metadata = { title: "Acesso interno" };

export default function LoginPage() {
  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="brand">
          <span className="brand-mark">S</span>
          <span><strong>SUAPE</strong><small>em dados</small></span>
        </div>
        <span className="eyebrow">Ambiente interno</span>
        <h1>Entrar no portal</h1>
        <p>Use uma conta cadastrada no Firebase e autorizada para consultar o portal.</p>
        <FirebaseLoginForm />
        <p className="login-note">Não existe cadastro público no portal. Usuários e papéis são liberados pelo administrador.</p>
      </section>
      <section className="login-visual" aria-label="Resumo do portal">
        <div className="visual-card">
          <span>Inteligência institucional</span>
          <h2>Dados rastreáveis para decisões mais seguras.</h2>
          <p>Contratos, pessoas, folha e viagens em uma leitura integrada, com origem preservada e regras de conformidade explícitas.</p>
          <div className="visual-stats">
            <div><strong>194</strong><small>instrumentos indexados</small></div>
            <div><strong>6</strong><small>fontes mapeadas</small></div>
            <div><strong>100%</strong><small>histórico por competência</small></div>
          </div>
        </div>
      </section>
    </main>
  );
}
