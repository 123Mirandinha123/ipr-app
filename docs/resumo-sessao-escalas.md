# Resumo da sessão — Escalas (05/08/2026)

Este arquivo documenta tudo o que foi feito nesta sessão, refletindo o **estado final** do código.

## 1. Modal "Editar Escala" — comportamento por ministério

Arquivos: `src/app/escalas/editar-escala-modal.component.ts`, `.html`

- Novo input `funcoesDisponiveis` (lista de funções do ministério).
- **Louvor**: mostra apenas as seções de **funções** (Líderes/Membros ficam ocultos); nomes sempre em **maiúsculas** (`| uppercase`).
- **Função canônica** (`funcaoCanonica`): agrupa grafias diferentes para não duplicar seções — `vocalista`→`vocal`, `back vocal/backvocalista/back`→`backvocal`, `violonista`→`vionolista`, `bateria`→`baterista`, `teclado`→`tecladista`, `guitarra`→`guitarrista`, `baixo`→`baixista`.
- `addPessoa` remove a pessoa de todas as outras seções antes de adicionar (sem repetir).
- `getDisponiveis` no Louvor só sugere pessoas cuja **função cadastrada no Firestore** corresponde à função da seção.
- `removePessoa` no Louvor **não** devolve a pessoa para Membros.
- `funcoesDisponiveis` de `midia`/`renoshow` corrigidas (`['']` → `['mídia']`/`['renoshow']`) para não renderizar seção vazia no modal.

## 2. Geração automática de escalas — `criarEscala`

Arquivo: `src/app/escalas/escalas.page.ts`

### Rotatividade (`escolher`)
- Prioridade: **não escalados** → escalados em **outros dias** → escalados **no mesmo dia** (apenas último recurso).
- **Domingo manhã × noite**: quem fica de manhã **não** é escalado à noite, salvo último recurso (não há mais ninguém).
- **Bug corrigido**: o estado de rotatividade começava vazio a cada chamada. Agora é **semeado a partir das escalas existentes** (`escaladosPorData` + `jaEscalados` por nome→UID), então se a escala de manhã já existe e só a noite é gerada depois, o mesmo nome não cai nos dois turnos (ex.: Nicolas no 23/08).

### Louvor
- Funções agrupadas por **chave canônica** (`funcaoCanonica2`).
- As categorias vêm de `funcoesDisponiveis[ministerio]` (Vocal, Back Vocal, Guitarrista, Baixista, Baterista, Tecladista, Vionolista), ordenadas por `ordemFuncoes` canônica.
- **Back Vocal = 2 pessoas**.
- Categorias que ficam **vazias são puladas** (não gravam `funcoes: { x: [] }`), mantendo o fallback de exibir `lideres`/`membros` quando não há função preenchida.

### Renoshow
- Agora tratado como a **Mídia**: **1 pessoa por dia**, com rotatividade e indisponibilidades.

### Outros ministérios
- `maternal`, `4a6`, `7a10`, `juniores`, `adolescentes`, `sonoplastia`, `diaconos`: quantidade fixa por escala (`qtdPorMinisterio`), preenchida via `escolher`.

## 3. Excluir todas as escalas

Arquivos: `src/app/services/firestore.ts`, `src/app/escalas/escalas.page.ts`, `escalas.page.html`

- Novo método `deleteAllEscalas()` no `FirestoreService`.
- Botão "Excluir todas as escalas" na página de escalas, visível para **líderes e admins**, com `confirm()` antes de excluir.

## 4. Escalas do Dia (somente admin)

Novos arquivos: `src/app/escalas-do-dia/` (page, html, scss, module, routing), `src/app/guards/admin.guard.ts`

- Página `/escalas-do-dia` mostra as escalas de **hoje** de **todos os ministérios**, ordenadas por turno (Manhã/Noite) e ministério, com as cores de cada um e as pessoas por função (ou a lista de participantes).
- **`AdminGuard`**: apenas `isAdmin` acessa; líder comum é redirecionado para `/home`.
- Rotas registradas em `src/app/app-routing.module.ts` com `AuthGuard + AdminGuard`.
- Acesso por **menu lateral** (item "Escalas do Dia", admin) e **botão na home** acima de "Gerenciar Membros" (`home.page.html`, `app.component.ts/html`).

## 5. Ícone e splash do app

- Ícone: `src/assets/icon/LogoIprapp.png` (1254×1254).
- Splash: `src/assets/icon/splashscreenIPr.png` (1254×1254).
- Via `@capacitor/assets` foram gerados todos os recursos Android:
  - Ícones em `android/app/src/main/res/mipmap-*` (`ic_launcher`, `ic_launcher_round`, adaptativo foreground/background).
  - Splash em `android/app/src/main/res/drawable-*` (portrait/landscape e variantes noturnas).
- Favicon web atualizado em `src/index.html` → `assets/icon/LogoIprapp.png`.
- `npx ng build` + `npx cap sync android` executados.

> Observação: a splash é quadrada e foi esticada para as proporções de tela; para melhor resultado, recomenda-se uma imagem 2732×2732 com o logo centralizado.

## Arquivos alterados/criados

| Arquivo | Ação |
|---|---|
| `src/app/escalas/escalas.page.ts` | `funcaoCanonica2`, `ordemFuncoes` canônica, `escolher` com seeding de escalas existentes, Louvor por categorias, Renoshow 1/dia, `excluirTodasEscalas` |
| `src/app/escalas/escalas.page.html` | Botão "Excluir todas as escalas" |
| `src/app/escalas/editar-escala-modal.component.ts` | `funcaoCanonica`, comportamento Louvor |
| `src/app/escalas/editar-escala-modal.component.html` | `\| uppercase`, Louvor sem líderes/membros |
| `src/app/services/firestore.ts` | `deleteAllEscalas()` |
| `src/app/escalas-do-dia/**` | **Novo** — página Escalas do Dia |
| `src/app/guards/admin.guard.ts` | **Novo** — guard de admin |
| `src/app/app-routing.module.ts` | Rota `/escalas-do-dia` + AdminGuard |
| `src/app/app.component.ts/html` | Item de menu "Escalas do Dia" (admin) |
| `src/app/home/home.page.html` | Botão "Escalas do Dia" (admin) |
| `src/index.html` | Favicon → `LogoIprapp.png` |
| `assets/icon.png`, `assets/splash.png` | Fontes para `@capacitor/assets` |
| `android/app/src/main/res/**` | Ícones e splashes gerados |

## Comandos úteis

```
npm start                 # dev no navegador
npx ng build              # gera o www
npx cap sync android      # copia www + plugins para o Android
npx cap open android      # abre no Android Studio
npx @capacitor/assets generate --android   # regenera ícones/splash a partir de assets/icon.png e assets/splash.png
```
