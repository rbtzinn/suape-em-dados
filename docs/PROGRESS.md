# Progresso

## Concluído nesta versão

- Leitura do Master Plan e mapeamento das sete fontes recebidas.
- Fundação Next.js 16, React 19 e TypeScript estrito.
- Design system institucional responsivo.
- Autenticação interna sem cadastro público e perfis `ADMIN`, `ANALYST`, `VIEWER`.
- Integração server-only com Google Sheets por conta de serviço.
- Banco geral privado no Google Sheets com 22 tabelas, camada bruta, qualidade, proveniência e trilha de auditoria.
- Painel executivo e módulos de contratos, fiscais, Remessa × LAI, terceirizados, folha, viagens, conformidade e importações.
- Normalizadores de moeda/texto, conciliação explicável, folha por blocos e motor de política de viagens.
- Carga inicial validada: 7.922 linhas brutas, 194 Remessa, 40 LAI, 2.938 terceirizados, 2.692 eventos de folha e 96 viagens.
- Importador administrativo idempotente de LAI/Remessa e portarias PDF, com preservação integral das células ou páginas recebidas.
- Conciliação Remessa × LAI versionada por execução, com score e razões.
- Quatro portarias CPL carregadas: 4 comissões, 21 membros efetivos, 8 pessoas correspondentes no Remessa e 54 resultados auditáveis.
- Cruzamento CPL × Remessa versionado: 13 resultados OK, 15 em atenção, 26 em revisão necessária e nenhum potencial conflito sem evidência específica.
- Carteira e conciliação com dados reais, busca, filtros e paginação.
- Testes unitários de domínio e ingestão.

## Próxima etapa funcional

- Revisar humanamente os 26 candidatos com nome parcial, campo genérico ou vigência insuficiente.
- Incluir vínculos explícitos de processos/contratos quando novas portarias trouxerem essa informação.
- Criar a conta de serviço, compartilhar a base, criar usuários reais e configurar os segredos na Vercel.
- Publicar a homologação e executar a revisão final de acesso e privacidade.

## Fora desta entrega

- Aprovação jurídica das regras de conformidade.
