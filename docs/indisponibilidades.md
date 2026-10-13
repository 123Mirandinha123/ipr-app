# Indisponibilidades

## Objetivo

Membros podem marcar dias (quintas/domingos) em que não podem participar. A geração automática de escalas exclui pessoas indisponíveis na data.

## Decisões técnicas

- Indisponibilidades armazenadas dentro do **documento do usuário** (`usuarios/{uid}`), campo `indisponibilidades: { ministerio, data, motivo? }[]`
- Motivo salvo no array (não validado obrigatoriamente)
- Dias passados, dias que não são quinta/domingo e dias com menos de 7 dias de antecedência são bloqueados na seleção
- `refreshCurrentUser()` é chamado após toda alteração para atualizar a UI

## Arquivos alterados

| Arquivo | O que fez |
|---|---|
| `src/app/services/firestore.ts` | Removeu métodos da coleção `indisponibilidades`. Adicionou `addUserIndisponibilidade()` e `removeUserIndisponibilidade()` com read-modify-write |
| `src/app/services/auth.ts` | Adicionou `indisponibilidades` na interface `Usuario`; `loadUsuario`/`refreshCurrentUser` carregam o campo |
| `src/app/escalas/escalas.module.ts` | Importa e declara `IndisponibilidadeModalComponent` |
| `src/app/escalas/escalas.page.ts` | `indisponibilidades` do usuário filtrado por ministério; botão "Gerenciar Indisponibilidades"; geração de escalas filtra indisponíveis |
| `src/app/escalas/escalas.page.html` | Card de indisponibilidades com lista + remover + botão abrir modal |
| `src/app/escalas/indisponibilidade-modal.component.ts` | Modal com calendário em grid, seleção de dias, campo motivo, bloqueio < 7 dias |
| `src/app/escalas/indisponibilidade-modal.component.html` | Template do modal |
| `src/app/membros/membros.page.ts` | Filtro com normalização de nome de ministério |

## Problemas encontrados

- Coleção separada `indisponibilidades` causa erro "Missing or insufficient permissions" (Firebase Security Rules)
- `arrayUnion`/`arrayRemove` do Firestore falham com objetos que têm propriedades opcionais (`motivo?`); solução: read-modify-write (getDoc + filter + updateDoc)
- Firestore usa `ministerios` (plural) — se o documento tiver `ministerio` (singular), o código não encontra
- `refreshCurrentUser()` precisa ser chamado explicitamente após modificar indisponibilidades para refletir na UI
- `LeaderGuard` era síncrono e podia redirecionar antes do usuário carregar; corrigido para aguardar `loading$` via RxJS

---

# Admin e edição manual de escalas

## Objetivo

- **Admin** (`usuario.admin === true`): acesso total a todos os ministérios, todas as escalas e todos os membros. Pode editar/criar/excluir escalas de qualquer ministério.
- **Líder** (`ministerios[].lider === true`): também pode editar escalas manualmente (antes só criava/excluía).

## Decisões técnicas

- `admin` é um campo booleano no Firestore (`usuarios/{uid}.admin`). Não existe hierarquia — ou é admin ou não.
- A edição manual é feita via modal que mostra a estrutura atual da escala (líderes, membros, funções) e permite adicionar/remover pessoas.
- Ao adicionar pessoa a uma função, o modal só mostra candidatos que têm aquela função no perfil.
- Admin vê todos os ministérios na home e pode navegar para qualquer `/escalas/:ministerio`.
- Admin vê todos os usuários em `/membros` (sem filtro de ministério).
- Admin pode criar membros em qualquer ministério (dropdown mostra todos).
- Ao acessar "Membros" de dentro de `/escalas/:ministerio`, passa `?ministerio=` como query param para filtrar a lista.

## Arquivos alterados/criados

| Arquivo | O que fez |
|---|---|
| `src/app/services/auth.ts` | `admin?: boolean` na interface `Usuario`; `get isAdmin()`; carregado em `loadUsuario`/`refreshCurrentUser` |
| `src/app/services/firestore.ts` | Adicionou `updateEscala(id, data)` |
| `src/app/guards/leader.guard.ts` | Agora aguarda `loading$` e permite admin |
| `src/app/home/home.page.html` | Admin vê todos os ministérios + badge "Admin" + botão "Gerenciar Membros" |
| `src/app/escalas/escalas.page.ts` | `isAdmin`, `editarEscala()`, `getParticipantesDoMinisterio()`, `temPresencaNaEscala` liberado para admin |
| `src/app/escalas/escalas.page.html` | Botão "Editar" em cada escala; admin vê Membros/Criar/Excluir |
| `src/app/escalas/editar-escala-modal.component.ts` | **Novo** — Modal de edição manual: lista líderes/membros/funções, adiciona/remove pessoas |
| `src/app/escalas/editar-escala-modal.component.html` | **Novo** — Template do modal |
| `src/app/escalas/escalas.module.ts` | Registra `EditarEscalaModalComponent` |
| `src/app/membros/membros.page.ts` | Admin vê todos os usuários e todos os ministérios no formulário; filtro por `?ministerio=` query param |
| `src/app/membros/membros.page.html` | Título dinâmico conforme filtro |

---

# Novos ministérios (Maternal, 4à6, 7à10, Juniores, Adolescentes, Sonoplastia, Diáconos)

## Ministérios adicionados

| Ministério | Rota | Pessoas por escala | Funções |
|---|---|---|---|
| Louvor | `/escalas/louvor` | por função (1 vocal, 2 back, 2 instrumentos) | vocalista, guitarrista, baixista, baterista, tecladista, percussionista |
| Mídia | `/escalas/midia` | 1 | sonoplasta, projetor, video, transmissao |
| RenoShow | `/escalas/renoshow` | por função | iluminacao, cenografia, logistica |
| **Maternal** | `/escalas/maternal` | **2** | professor, auxiliar |
| **4 à 6** | `/escalas/4a6` | **2** | professor, auxiliar |
| **7 à 10** | `/escalas/7a10` | **1** | professor |
| **Juniores** | `/escalas/juniores` | **1** | professor |
| **Adolescentes** | `/escalas/adolescentes` | **1** | professor |
| **Sonoplastia** | `/escalas/sonoplastia` | **1** | sonoplasta |
| **Diáconos** | `/escalas/diaconos` | **4** | diacono |

## Geração de escala

- Ministérios com `qtdPorMinisterio` (Maternal, 4à6, etc.): sortear N pessoas aleatórias como `membros`. Líderes são detectados pelo perfil (`lider: true`).
- Ministérios sem quota (Louvor, RenoShow): distribuição por função (comportamento anterior).
- Mídia: 1 pessoa, funções agrupadas (comportamento anterior).

## Arquivos alterados

| Arquivo | O que fez |
|---|---|
| `src/app/membros/membros.page.ts` | Adicionou `maternal`, `4a6`, `7a10`, `juniores`, `adolescentes`, `sonoplastia`, `diaconos` a `ministeriosDisponiveis` e `funcoesDisponiveis` |
| `src/app/home/home.page.html` | Links de navegação para todos os novos ministérios |
| `src/app/escalas/escalas.page.ts` | `qtdPorMinisterio` map; `formatarNomeMinisterio()` para exibir nomes formatados; lógica de geração simplificada para ministérios com quota |

## Como usar

1. No Firestore, definir `admin: true` no documento do usuário desejado
2. Admin faz login e vê todos os ministérios na home
3. Dentro de uma escala, clica "Editar" para abrir o modal
4. No modal: cada seção (líderes, membros, funções) mostra os atuais com botão "Remover" e um dropdown "Adicionar" com pessoas disponíveis
5. "Salvar" persiste as alterações via `updateEscala`

1. No Firestore, definir `admin: true` no documento do usuário desejado
2. Admin faz login e vê todos os ministérios na home
3. Dentro de uma escala, clica "Editar" para abrir o modal
4. No modal: cada seção (líderes, membros, funções) mostra os atuais com botão "Remover" e um dropdown "Adicionar" com pessoas disponíveis
5. "Salvar" persiste as alterações via `updateEscala`
