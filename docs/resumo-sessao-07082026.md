# Resumo da sessão — 07/08/2026

Este arquivo documenta tudo o que foi feito nesta sessão, refletindo o **estado final** do código.

> **Atualização no mesmo dia:** após a seção 9 (remoção do modo local), o modo local foi **reativado** (JSON + `dados-simulacao.ts` + `localMode`) e depois foi criado o **seed para o Firebase real** (`semearDadosDeTeste()` + botão na Home). O app está com `useLocalData: false` (Firebase real) e os dados dos testes foram semeados e validados. **Após a validação, os botões e os métodos de seed/exclusão foram removidos** (código limpo). Veja `docs/simulacao-local-escalas.md`.

> **Atualização no mesmo dia (2):** com os dados reais, o Louvor só preenche 4 pessoas (vocal, back vocal x2, baterista) e a Mídia fica quase sempre só com a Lorena — porque **não há guitarrista/baixista/tecladista/vionolista cadastrados** (e Gabriel/Gabi estão no Louvor + indisponibilidade do Gabriel). Decidido com o usuário: **não alterar a regra de geração**, e sim **mostrar os cargos vagos** nas escalas para ele saber o que cadastrar (seção 11).

## 1. Ajuste do splash (imagem não estica mais)

Arquivo: `src/app/app.component.scss`

- Troca de `object-fit: fill` para `object-fit: contain` na splash: a imagem não é mais distorcida/esticada para preencher a tela.

## 2. Limpeza de código e assets mortos

- `src/app/services/firestore.ts`: removido método `getUsuarioByUid` (sem usos).
- Removidos `shapes.svg` e `favicon.png` (não referenciados).
- Verificado que a página e o componente de indisponibilidades continuam ambos em uso (não removidos).
- Os plugins nativos (`@capacitor/browser`, `@capacitor/app`, `@capacitor/push-notifications`) foram mantidos a pedido do usuário.

## 3. Modo de simulação local de escalas (adicionado e **depois removido**)

> Esta seção é **histórica**: o modo local foi criado para testar sem o Firebase e **removido** no final da sessão (ver seção 9). O código descrito aqui **não existe mais** no estado final.

O que foi o modo local (antes da remoção):

- `src/simulacao-usuarios.json` com 46 usuários fictícios cobrindo os 10 ministérios (Louvor, Mídia, RenoShow, Maternal, 4 à 6, 7 à 10, Juniores, Adolescentes, Sonoplastia, Diáconos). Foram **readicionados 6 diáconos dedicados** (`sim-041` a `sim-046`, só ministério Diáconos) para destravar os domingos de Diáconos no teste local.
- `src/app/services/dados-simulacao.ts`: importava o JSON (`import * as` com fallback `default`) e exportava `usuariosSimulados` e `familiasSimuladas`.
- `environment.ts` com flag `useLocalData: true` (dev): quando ligada, `firestore.ts` lia/gravava em `localStorage` (`sim_local_escalas`, `sim_local_usuarios`, `sim_local_familias`) em vez do Firebase.
- `auth.ts`: login simulado — qualquer email/senha entrava como o admin fictício **Gabriel Souza** (`sim-001`).
- `membros.page.ts`: `criarAuthUser` gerava `uid` local (`local-${Date.now()}`).
- `tsconfig.json`: `resolveJsonModule` e `allowSyntheticDefaultImports` para importar o JSON.
- `docs/simulacao-local-escalas.md`: documentação do modo de teste (agora marcada como **obsoleta**).

## 4. Correções na geração de escalas

Arquivo: `src/app/escalas/escalas.page.ts`

### 4.1 Recarregar lista após gerar/excluir

- Adicionado `carregarEscalas()` após gerar/excluir escalas para a lista atualizar de imediato.

### 4.2 Regra "mesmo dia" (obrigatória)

- A geração agora usa **todas** as escalas (`todasEscalas`) para montar `escaladosPorData`, não só as do ministério atual.
- A regra é **obrigatória**: ninguém pode ficar escalado **2x no mesmo dia** — nem em 2 ministérios diferentes, nem manhã + noite do mesmo ministério (ex.: Louvor de manhã e à noite). Quem já está no dia entra em `bloqueadosNoDia` e **nunca** é sorteado de novo naquele dia.
- Cada sorteado do dia entra em `bloqueadosNoDia` imediatamente, então nunca é sorteado de novo no mesmo dia.

### 4.3 Bug "minhas-escalas" (Louvor)

- O ramo do Louvor adicionava **todos** os membros não-líderes em `membros`, fazendo "minhas-escalas" retornar escalas aleatórias.
- Corrigido com um `Set` `desenhados` (nomes realmente sorteados em `funcoesFinais`); `membros` agora só contém os sorteados.

### 4.4 Bug "Louvor não retornando" (líderes)

- O ramo do Louvor listava **todos** os líderes do ministério como `lideres` em **todas** as escalas, mesmo sem serem sorteados.
- Corrigido: `lideres` e `membros` agora só incluem pessoas **sorteadas** (`desenhados.has(nome)`).
- Diagnóstico feito com scripts de repro em Node que reproduziram o `criarEscala()` (pool por função, sorteados por data).

## 5. Novo: escalas com professor/auxiliar por função

Arquivo: `src/app/escalas/escalas.page.ts`

Antes, os ministérios de ensino (Maternal, 4 à 6, 7 à 10, Juniores, Adolescentes) eram gerados sorteando **N pessoas aleatórias** e gravados só em `lideres`/`membros` (sem `funcoes`) — a exibição mostrava apenas os nomes.

Agora a geração passou por **função** (mesmo ramo do Louvor):

- **Maternal e 4 à 6**: sempre **1 professor + 1 auxiliar** por escala, gravando `funcoes: { professor: [...], auxiliar: [...] }`.
- **7 à 10, Juniores e Adolescentes**: **1 professor** por escala, com `funcoes: { professor: [...] }`.
- **Louvor**: mantém o comportamento (vocal, back vocal = 2, guitarrista, baixista, baterista, tecladista, vionolista).
- **Sonoplastia e Diáconos**: inalterados (ramo `qtd` — 1 e 4 por escala, sem `funcoes`).
- **Mídia e RenoShow**: inalterados (1 pessoa por dia).

A exibição em `escalas.page.html` e `escalas-do-dia.page.html` já renderiza `funcao: nomes`, então agora aparece **`professor: Fulano` / `auxiliar: Cicrano`** automaticamente. Bônus: o modal "Editar Escala" abre com as funções já preenchidas, e "minhas-escalas" mostra a função correta (professor/auxiliar) em vez de "Membro".

## 6. Famílias (adicionada, removida e **readicionada**)

Foi criada a página **Famílias** (`/familias`) com priorização no mesmo dia, mas **removida depois a pedido do usuário** ("volta para a versão sem a função família").

Depois o usuário pediu para **readicionar a função família**, agora priorizando colocar famílias para atuar **no mesmo dia e turno (inclusive entre ministérios)**. Ficaram recriados/ajustados:

| Item | Descrição |
|---|---|
| `src/app/familias/` | Página Famílias recriada (5 arquivos) com CRUD de famílias/membros |
| Rota `/familias` + item de menu "Famílias" | `app-routing.module.ts` (AuthGuard + LeaderGuard), `app.component.ts` / `.html` |
| `getFamilias`, `addFamilia`, `updateFamilia`, `deleteFamilia` | `firestore.ts` (somente API) |
| Priorização na geração | `escala.service.ts` — ver abaixo |

> Obs.: as famílias semeadas (Família Souza, Lima e Prado) existiam apenas no JSON do modo local, já **removido** (seção 9). No Firebase elas precisam ser cadastradas pela página Famílias.

### Como a priorização funciona (mesmo dia e turno)

- `familiaPorUid`: mapa uid → id da família, montado a partir de `getFamilias()`.
- `escaladosPorTurno`: mapa `data_turno` → uids escalados **em qualquer ministério** naquele culto.
- Durante a geração de cada ministério, `familiasNoDia` guarda, por `data_turno`, os ids das famílias escaladas (existentes **e** sorteadas durante a geração):
  - é semeado com todas as escalas **já existentes** naquele `data_turno` (qualquer ministério) — priorização **entre ministérios** (ex.: membro da família Souza escalado no Louvor domingo de manhã ⇒ ao gerar Diáconos domingo de manhã, o outro membro é priorizado para o mesmo culto);
  - **ao sortear um participante, a família dele entra no set do turno atual**, então os demais membros da família passam a ser priorizados nos próximos sorteios do mesmo turno (família atua junta no mesmo culto);
  - **regra de bloqueio:** membro de uma família já escalada em um turno do dia fica **bloqueado no outro turno do mesmo dia** (não pode a família ser dividida entre manhã e noite — ex.: Gabriel manhã e Lorena noite); **porém** (decisão do usuário) se o bloqueio deixar o turno **sem nenhum candidato**, o gerador usa o membro da família mesmo assim (**último recurso** — a escala nunca fica vazia).
- Em `escolher()`, o pool é ordenado colocando **primeiro** quem pertence a uma família já presente no set do turno atual; ao escolher, a família do escolhido entra no set.
- A regra obrigatória **"ninguém escalado 2x no mesmo dia"** continua valendo (nem entre ministérios, nem manhã + noite). A priorização é apenas reordenação — nunca fura o bloqueio.

A geração de escalas continua com a regra de bloqueio do dia (seção 4.2), agora **com** priorização de família (mesmo dia e turno, entre ministérios).

## 7. Novo: botão "Criar todas as escalas do mês"

Arquivos: `src/app/services/escala.service.ts` (**novo**), `src/app/escalas/escalas.page.ts`/`.html`, `src/app/home/home.page.ts`/`.html`

- A lógica de geração foi extraída para um **serviço Angular** (`EscalaService`, `providedIn: 'root'`), compartilhado entre a página de escalas e a Home:
  - `gerarEscalasMinisterio(ministerio, usuarios, todasEscalas)` → retorna `{ criadas, mensagem }` (recebe usuários/escalas por parâmetro em vez de depender do estado da página).
  - `criarTodasEscalas()` → carrega usuários, percorre os 10 ministérios **recarregando as escalas entre um e outro**, garantindo que a regra "ninguém 2x no mesmo dia" vale também entre ministérios gerados na mesma leva; retorna `{ total, detalhes }`.
  - Helpers compartilhados: `funcoesDisponiveis`, `normalizar`, `funcaoCanonica2`, `getDatasDoMes`, `formatarNomeMinisterioDe`.
- Botão verde **"Criar todas as escalas do mês"** (visível só para **admin**):
  - Na **Home**, **acima de "Escalas do Dia"** (`home.page.html`).
  - Na página de escalas, ao lado de "Criar escala" e "Excluir todas as escalas".
- Ao final mostra um resumo com o total e quantas escalas cada ministério criou (ou avisa que já estavam todas criadas).
- `escalas.page.ts` ficou mais enxuto: delegou a geração ao serviço e manteve apenas exibição/edição/exclusão.

## 8. Novo: remover membro de um ministério

Arquivos: `src/app/membros/membros.page.ts` / `.html`

- Nova opção **"Remover"** (deslizar o membro para a esquerda) na lista de membros de um ministério.
- Ela **apenas remove o vínculo** do usuário com aquele ministério (retira a entrada do array `ministerios` via `updateUsuario`) — **não apaga o usuário**.
- Comportamento igual ao "Remover" da página Famílias; a página já é restrita a admin/líder (AuthGuard + LeaderGuard), então não precisa de gate adicional.
- Se o membro ficar sem nenhum ministério, ele simplesmente deixa de aparecer nas listas de ministério (o cadastro permanece).

## 9. Fim do modo de simulação local — voltou a usar a API real (Firebase)

A pedido do usuário ("retirar esse arquivo json, e retornar como estava puxando da api, mantendo tudo o que atualizamos, para testarmos com a api funcionando"), o modo local de teste foi **removido**:

- **Excluídos**: `src/simulacao-usuarios.json` e `src/app/services/dados-simulacao.ts` (que importava o JSON e exportava `usuariosSimulados` / `familiasSimuladas`).
- `src/environments/environment.ts` e `.prod.ts`: removida a flag `useLocalData` (dev voltou a usar o Firebase real, igual à prod).
- `src/app/services/firestore.ts`: reescrito **somente API** — removidos `lerLocais`/`salvarLocais`, `STORAGE_*`, `usuariosLocais`/`familiasLocais` e todos os ramos `localMode`. Mantidos os métodos novos (CRUD de famílias) e o `deleteAllEscalas`.
- `src/app/services/auth.ts`: removido o login simulado (qualquer email entrava como Gabriel Souza); voltou a autenticar de verdade no Firebase Auth (`signInWithEmailAndPassword` / `onAuthStateChanged` / `signOut`). Removida a importação de `usuariosSimulados`.
- `src/app/membros/membros.page.ts`: `criarAuthUser` voltou a criar o usuário no Firebase Auth via API (removido o uid fake `local-*`).
- `docs/simulacao-local-escalas.md`: marcada como **obsoleta** (histórico).

**Mantido** tudo o que atualizamos: página Famílias (CRUD), priorização de família (mesmo dia e turno, entre ministérios) em `escala.service.ts` e a opção "Remover" da página de Membros (seção 8) — tudo lendo/gravando no Firebase.

Observações para o teste com a API:
- Os **usuários** agora vêm do Firebase (os 46 fictícios do JSON não existem mais).
- Os **6 diáconos dedicados** (`sim-041`..`sim-046`) e as **famílias semeadas** (Souza/Lima/Prado) só existiam no JSON/localStorage — não existem no Firebase. Cadastre-os pela interface (página Famílias / Membros) se quiser testar a priorização.
- As **escalas/famílias antigas no localStorage** não são mais lidas; para testar com dados reais, crie famílias e gere as escalas pela interface (botão "Criar todas as escalas do mês", admin).

## 10. Tema automático: escuro = app como foi feito; claro = tema claro novo

O app segue o tema do aparelho (`@media (prefers-color-scheme)`), sem `body.dark` manual (que existia mas nunca era ativado):

- **Celular em tema escuro** → o app mantém **exatamente o visual original** (fundo escuro `#0b0b0b`/`#151515`, textos brancos etc.). Nada foi alterado nesse modo.
- **Celular em tema claro** → entra um **tema claro novo** e distinto: fundo `#f3f5f9`, cards/items `#ffffff`, textos `#111827`, bordas azuis suaves e sombras claras. Na Home, a imagem de fundo `FundoIpr.png` permanece com um escurecimento mais leve (`.35` em vez de `.6`).

Como foi implementado: as cores escuras atuais ficaram como base (tema escuro = intacto) e cada página ganhou um bloco `@media (prefers-color-scheme: light)` com os ajustes claros. O `login.page.scss` passou a ativar o design escuro que já existia (bloco `body.dark` convertido para `@media (prefers-color-scheme: dark)`). A página Famílias usa apenas variáveis do Ionic e já se adapta sozinha pela paleta (`dark.system.css` no `global.scss`).

Arquivos alterados:

| Arquivo | Ação |
|---|---|
| `src/app/home/home.page.scss` | **Editado** — tema claro (item branco, fundo da imagem com overlay mais leve) |
| `src/app/escalas/escalas.page.scss` | **Editado** — tema claro |
| `src/app/escalas-do-dia/escalas-do-dia.page.scss` | **Editado** — tema claro |
| `src/app/minhas-escalas/minhas-escalas.page.scss` | **Editado** — tema claro |
| `src/app/indisponibilidades/indisponibilidades.page.scss` | **Editado** — tema claro |
| `src/app/membros/membros.page.scss` | **Editado** — tema claro (inclui o modal) |
| `src/app/mensagens/mensagens.page.scss` | **Editado** — tema claro |
| `src/app/perfil/perfil.page.scss` | **Editado** — tema claro |
| `src/app/login/login.page.scss` | **Editado** — `body.dark` convertido para `@media (prefers-color-scheme: dark)` |
| `src/app/app.component.scss` | **Editado** — tema claro no menu/toolbar global |

## 11. Cargos vagos visíveis nas escalas (Louvor/Mídia curtas)

**Problema relatado:** no Louvor só aparecem Rita/Gabriel/Valéria (e outros nomes "não aparecem"); na Mídia fica só uma pessoa por escala.

**Diagnóstico (com os dados reais do Firebase):** não é bug da geração — as escalas ficam curtas porque **não há gente cadastrada** para vários cargos:
- **Louvor:** só existem **Vocal** (Valéria, Rita), **Back Vocal** (Gabriel, Gabi, Marcia, Aline) e **Baterista** (Eduardo, Nicolas). Faltam **guitarrista, baixista, tecladista e vionolista** — por isso cada escala tem só 4 (manhã) ou 3 (noite) nomes.
- **Mídia:** só Gabriel, Gabi e Lorena. Gabriel fica no Louvor aos domingos (regra "ninguém 2x no mesmo dia") e está com **indisponibilidade** no Mídia em 13, 20 e 27/08; Gabi também é do Louvor. Resultado: quase sempre sobra só a **Lorena**.
- A regra "ninguém 2x no mesmo dia" **está funcionando corretamente** — a simulação com os dados reais reproduziu exatamente o observado.

**Decisão do usuário:** mostrar os **cargos vagos** (em vez de mudar a regra de sorteio).

### O que foi feito

| Arquivo | Mudança |
|---|---|
| `src/app/services/escala.service.ts` | `gerarEscalasMinisterio()` agora retorna também **`funcoesVazias`** (cargos esperados do ministério sem ninguém cadastrado, por equivalência canônica) e anexa à `mensagem` o aviso *"Funções sem ninguém cadastrado: ..."*. `criarTodasEscalas()` inclui **"— faltam: ..."** na linha de resumo do ministério. |
| `src/app/escalas/escalas.page.ts` | Novo helper **`getFuncoesVagas(escala)`**: cargos esperados do ministério (`funcoesDisponiveis`) que estão **vazios naquela escala**, comparando por equivalência canônica. |
| `src/app/escalas/escalas.page.html` | Abaixo das funções, exibe **`cargo: —`** para cada vaga (classe `.funcao-vaga`), só quando a escala tem `funcoes` (Sonoplastia/Diáconos continuam mostrando só os nomes). |
| `src/app/escalas-do-dia/escalas-do-dia.page.ts` | Injetado `EscalaService` + mesmo helper `getFuncoesVagas`. |
| `src/app/escalas-do-dia/escalas-do-dia.page.html` | Mesma exibição de vagas nas escalas do dia. |
| `src/app/escalas/escalas.page.scss` e `escalas-do-dia.page.scss` | Classe **`.funcao-vaga`** (cor apagada, itálico, sem borda azul) nos temas escuro e claro. |

### Como fica na prática

Ex.: escala do Louvor passa a mostrar:

```
vocal: Valéria
back vocal: Gabriel, Gabi
baterista: Eduardo
guitarrista: —
baixista: —
tecladista: —
vionolista: —
```

E ao gerar as escalas, o alerta avisa: *"Funções sem ninguém cadastrado: guitarrista, baixista, tecladista, vionolista"*.

### O que falta cadastrar (ação do usuário)

- **Louvor:** guitarrista, baixista, tecladista, vionolista (e mais vocal/back vocal/baterista se quiser escalas mais cheias).
- **Mídia:** mais membros dedicados ao Mídia (Gabriel fica no Louvor aos domingos e tem indisponibilidade às quintas; Gabi também é do Louvor).



| Arquivo | Ação |
|---|---|
| `src/app/services/firestore.ts` | **Editado** — removidos após a validação: `semearDadosDeTeste()`, `excluirDadosDeTeste()`, `obterOuCriarAuthUid`, `fetchAuth`, `excluirAuthConta` e o import de `firebaseConfig` |
| `src/app/home/home.page.ts` / `.html` | **Editados** — removidos após a validação: botões "Enviar/Excluir dados de teste para o Firebase" e métodos `semearFirebase()` / `excluirDadosDeTeste()` (+ `AlertController` órfão); mantidos os contadores "X membro(s)" e o botão "Criar todas as escalas do mês" |
| `src/environments/environment.ts` | `useLocalData: false` (dev voltou a usar o Firebase real) |
| `src/app/services/escala.service.ts` | **Novo** — geração de escalas compartilhada (Home + página de escalas); com priorização de família (mesmo dia e turno, entre ministérios) |
| `src/app/familias/` | **Recriado** — página Famílias (5 arquivos) |
| `src/app/membros/membros.page.ts` / `.html` | **Editados** — opção "Remover" (tira o membro de um ministério sem apagar o cadastro); `criarAuthUser` só via Firebase Auth |
| `src/app/services/firestore.ts` | **Editado** — **somente API**: CRUD de famílias, `deleteAllEscalas`, indisponibilidades; removido todo o modo local |
| `src/app/services/auth.ts` | **Editado** — login/logout/refresh de volta ao Firebase Auth real |
| `src/app/escalas/escalas.page.ts` / `.html` | **Editados** — delegou geração ao `EscalaService`; regra "mesmo dia"; ramo por função (professor/auxiliar) |
| `src/app/services/escala.service.ts` | **Editado** — retorna `funcoesVazias` + aviso na `mensagem`; `criarTodasEscalas()` mostra "— faltam: ..." (seção 11) |
| `src/app/escalas/escalas.page.ts` / `.html` / `.scss` | **Editados** — helper `getFuncoesVagas` + exibição dos cargos vagos com `—` (classe `.funcao-vaga`) |
| `src/app/escalas-do-dia/escalas-do-dia.page.ts` / `.html` / `.scss` | **Editados** — mesma exibição de cargos vagos nas escalas do dia |
| `src/app/home/home.page.ts` / `.html` | **Editados** — botão "Criar todas as escalas do mês" acima de "Escalas do Dia" (admin) |
| `src/app/app-routing.module.ts`, `src/app/app.component.ts` / `.html` | **Editados** — rota `/familias` + item de menu "Famílias" |
| `src/app/app.component.scss` | **Editado** — `object-fit: contain` no splash |
| `src/environments/environment.ts` / `.prod.ts` | **Editados** — removida a flag `useLocalData` (dev = Firebase real) |
| `src/simulacao-usuarios.json` | **Removido** — fim do modo simulado local |
| `src/app/services/dados-simulacao.ts` | **Removido** — importava o JSON simulado |
| `docs/simulacao-local-escalas.md` | **Editado** — marcado como obsoleto (histórico) |
| `docs/resumo-sessao-07082026.md` | **Novo** — este documento |
| `tsconfig.json` | `resolveJsonModule`, `allowSyntheticDefaultImports` (mantidos; sem uso, mas inofensivos) |

## Comandos úteis

```
npm start                              # dev no navegador (usa Firebase real)
npx ng build --configuration development   # build de desenvolvimento
npx ng build                           # build de produção (usa Firebase real)
npx cap sync android                   # copia www + plugins para o Android
```

Obs.: os dados agora vêm do Firebase. Os dados dos testes (46 usuários + famílias, contas com senha `escala123`) foram semeados uma única vez; **os botões e os métodos de seed/exclusão foram removidos** após a validação. Faça login como `sim-001@exemplo.com` / `escala123` e use "Criar todas as escalas do mês". As escalas curtas de Louvor/Mídia são por **falta de membros em certos cargos** — as vagas agora aparecem na tela (seção 11); cadastre guitarrista/baixista/tecladista/vionolista no Louvor e mais gente no Mídia para destravar.
