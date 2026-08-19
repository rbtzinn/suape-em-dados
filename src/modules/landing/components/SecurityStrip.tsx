const items = [["Acesso restrito", "Somente ambiente institucional"], ["Usuários autorizados", "Perfis e permissões controlados"], ["Rastreabilidade", "Origem preservada por registro"], ["Auditoria", "Ações relevantes registradas"]];

export function SecurityStrip() {
  return (
    <section className="border-y border-[var(--line)] bg-[var(--surface)]" aria-label="Princípios de segurança e controle"><div className="mx-auto grid max-w-[1440px] sm:grid-cols-2 lg:grid-cols-4">{items.map(([title, detail], index) => <div className="security-item" key={title}><span aria-hidden="true">0{index + 1}</span><div><p>{title}</p><small>{detail}</small></div></div>)}</div></section>
  );
}
