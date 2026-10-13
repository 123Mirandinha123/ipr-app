# Simulação Local de Escalas (Teste)

> **Status:** **MODO API ATIVO** — desde 07/08/2026 o app usa o **Firebase real** (`useLocalData: false` em dev e prod). Os dados dos testes foram semeados no Firebase uma única vez (46 usuários + famílias, contas com senha `escala123`) e, após a validação, **os botões e os métodos de seed/exclusão foram removidos** do código. O modo local (`simulacao-usuarios.json`, `dados-simulacao.ts` e os ramos `localMode` do `firestore.ts`/`auth.ts`) continua no código e pode ser reativado trocando `useLocalData` para `true` no `environment.ts`.

## Objetivo

Testar a geração e exibição das escalas (Louvor, Mídia, RenoShow, Maternal, 4 à 6, 7 à 10, Juniores, Adolescentes, Sonoplastia, Diáconos) com **pessoas aleatórias**, sem depender do banco real do Firebase.

## Como funciona

O app tem um **modo local** ativado só em desenvolvimento (`environment.ts`):

```ts
// src/environments/environment.ts
export const environment = {
  production: false,
  useLocalData: true   // <-- true = dados locais; false = Firebase real
};
```

- Com `useLocalData: true`, o `FirestoreService` **não chama o Firebase**: os membros vêm de `src/simulacao-usuarios.json`, e as escalas geradas são salvas no `localStorage` do navegador (`sim_local_escalas`, `sim_local_usuarios`).
- Com `useLocalData: false` (ou em build de produção), volta a usar o Firebase normalmente.
- `environment.prod.ts` já está com `useLocalData: false`.

## Arquivos

| Arquivo | Descrição |
|---|---|
| `src/simulacao-usuarios.json` | 46 usuários fictícios no formato da coleção `usuarios` (10 ministérios; admin `sim-001` Gabriel Souza; 6 diáconos dedicados `sim-041`..`sim-046`; famílias Souza/Lima/Prado; 1 indisponibilidade de exemplo) |
| `src/app/services/dados-simulacao.ts` | Importa o JSON e exporta a lista para o serviço |
| `src/app/services/firestore.ts` | `FirestoreService` com o modo local (localStorage) |
| `src/environments/environment.ts` | Flag `useLocalData` que liga/desliga o modo local |
| `docs/simulacao-local-escalas.md` | Este documento |

## Sobre os dados

- **46 usuários** com `uid`, email, nome, `ministerios[]` e `indisponibilidades`.
- **1 usuário admin** (`sim-001` — Gabriel Souza) para acessar "Escalas do Dia", gerenciar membros e gerar escalas de todos os ministérios.
- Ministérios com **pessoas suficientes** para gerar as escalas do mês:
  - **Louvor**: vocal, back vocal (2 por escala), guitarrista, baixista, baterista, tecladista, vionolista
  - **Mídia**: mídia
  - **RenoShow**: renoshow
  - **Maternal / 4 à 6**: professor + auxiliar
  - **7 à 10 / Juniores / Adolescentes**: professor
  - **Sonoplastia**: sonoplasta
  - **Diáconos**: 4 diáconos por escala (6 diáconos dedicados `sim-041`..`sim-046` só em Diáconos)
- Líderes por ministério para priorização na escala.
- 1 indisponibilidade de exemplo (Juliana Ribeiro `sim-016` — maternal, 09/08 noite).
- **Famílias semeadas** (`familiasSimuladas`): Família Souza (`sim-001`, `sim-002`), Família Lima (`sim-003`, `sim-034`), Família Prado (`sim-021`, `sim-013`) — usadas na priorização de escalas (mesmo dia e turno, entre ministérios).

> ℹ️ A regra "ninguém pode ficar escalado 2x no mesmo dia" é **obrigatória**: quem já está escalado no dia — seja em **outro** ministério, seja em **manhã + noite do mesmo** ministério — é bloqueado (nunca usado). O bloqueio vale tanto para escalas já existentes quanto para cada nova escolha do dia. Consequência com os dados simulados: **Diáconos** fica com menos gente aos domingos (ex.: 3/4 de manhã e 0 à noite) porque há poucos diáconos livres nesse dia — isso é esperado (falta de gente livre), não bug. **Louvor** continua sempre 8/8, pois o pool é maior.

## Como testar

1. Rodar o app em desenvolvimento:
   ```bash
   npm run dev   # ou: ionic serve
   ```
2. Fazer login com **qualquer email/senha** — no modo local o login é simulado e entra como o usuário **admin** (`sim-001` — Gabriel Souza), que pode gerar escalas de todos os ministérios.
3. Abrir um ministério (ex: **Louvor**) e gerar as escalas.
4. Para gerar **todos os ministérios de uma vez**, usar o botão verde **"Criar todas as escalas do mês"** — disponível na **Home** (acima de "Escalas do Dia") ou na página de qualquer ministério (admin). Ele recarrega as escalas entre ministérios, mantendo a regra de não repetir ninguém no mesmo dia entre ministérios.
5. As escalas geradas ficam no `localStorage` e persistem entre recarregamentos.

> ⚠️ O `localStorage` é por navegador/dispositivo. Para "zerar" os dados de teste, use o DevTools → Application → Local Storage → apague as chaves `sim_local_escalas`, `sim_local_usuarios` e `sim_local_familias` (ou chame `resetarDadosLocais()` no console).

## Seed no Firebase (modo API) — histórico

Com `useLocalData: false` (padrão atual), o app lê/grava no Firebase real. Os dados dos testes foram enviados ao Firebase **uma única vez** pelo botão "Enviar dados de teste para o Firebase" (admin, Home), que chamava `FirestoreService.semearDadosDeTeste()`:

- Criava/recuperava a conta no Firebase Auth de cada um dos 46 usuários simulados (senha `escala123`) via REST identitytoolkit;
- Gravava cada usuário em `usuarios/{uidReal}` (o `uid` real do Auth, para o login funcionar);
- Gravava as 3 famílias semeadas (Souza, Lima, Prado) em `familias/` com os `uid` reais, mantendo a priorização de família funcionando na API.

Após a validação, **os botões e os métodos de seed/exclusão foram removidos** (o código não tem mais `semearDadosDeTeste`, `excluirDadosDeTeste`, `obterOuCriarAuthUid`, `fetchAuth` nem `excluirAuthConta`). O seed **não apagava** nada existente no Firebase: apenas adicionava/atualizava usuários e famílias simuladas.

Para repetir o seed no futuro (caso o Firebase seja limpo), é preciso recuperar os métodos removidos do histórico, pois a UI não os expõe mais.

## Observações

- No modo local, o **login é simulado** (qualquer email/senha entra como o admin fictício `Gabriel Souza`). Criar/editar membros também não cria contas reais no Firebase Auth (gera um `uid` local).
- A geração das escalas usa os **membros simulados** (`getUsuarios()`), então os nomes sorteados serão os fictícios.
- Nenhum dado real foi criado/alterado no Firebase de produção.
- O arquivo JSON e o modo local podem ser removidos quando terminar os testes (basta desligar `useLocalData` e apagar os arquivos de simulação).
