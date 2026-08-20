import type { Metadata } from "next";

export const metadata: Metadata = { title: "Acesso interno" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;
  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="brand">
          <span className="brand-mark">S</span>
          <span><strong>SUAPE</strong><small>em dados</small></span>
        </div>
        <span className="eyebrow">Ambiente interno</span>
        <h1>Entrar no portal</h1>
        <p>Use a credencial autorizada para consultar os dados institucionais.</p>
        {erro && <div className="login-error">E-mail ou senha inválidos.</div>}
        <form className="login-form" action="/api/auth/login" method="post">
          <div className="field">
            <label htmlFor="email">E-mail institucional</label>
            <input id="email" name="email" type="email" autoComplete="username" required />
          </div>
          <div className="field">
            <label htmlFor="password">Senha</label>
            <input id="password" name="password" type="password" autoComplete="current-password" required minLength={8} />
          </div>
          <button className="button button-primary" type="submit">Acessar ambiente</button>
        </form>
        <p className="login-note">Não existe cadastro público. Acesso e perfis são administrados internamente.</p>
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
