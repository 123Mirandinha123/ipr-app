# Resumo das alterações — sessão 05/08/2026

## 1. Login

### Objetivo

Mensagens de erro distintas no login e opção de ver/esconder a senha.

### O que foi feito

- **Senha errada** → exibe `Senha incorreta`
- **Email não cadastrado / formato inválido** → exibe `Login ou senha incorretos`
- Botão de olho no campo de senha alterna entre `password` e `text`
- Corrigido spinner que ficava travado após erro (botão desabilitado sem reset)

### Arquivos alterados

| Arquivo | O que fez |
|---|---|
| `src/app/login/login.page.ts` | Mapeia `e.code === 'auth/wrong-password'` → "Senha incorreta"; demais erros → "Login ou senha incorretos"; flag `mostrarSenha`; `finally` reseta `carregando` |
| `src/app/login/login.page.html` | `[type]` dinâmico na senha + `ion-button` com ícone olho/olho-cortado (`eye-outline`/`eye-off-outline`) |

### Configuração necessária no Firebase (Authentication)

A distinção entre "senha incorreta" e "login ou senha incorretos" **só funciona com a proteção contra enumeração de email desativada**:

- Firebase Console → **Authentication → Settings** → *User account management* → **User actions**
- Desmarcar **"Email enumeration protection"** e salvar

Com a proteção ativa, o Firebase retorna `auth/invalid-credential` (genérico) nos dois casos e o app mostra sempre "Login ou senha incorretos".

> Observação: tentativas anteriores usaram Firestore (`emailExists`) e o API deprecado `fetchSignInMethodsForEmail`. A solução final usa **apenas Firebase Authentication** (códigos de erro nativos).

---

## 2. Modais convertidos em páginas

### Objetivo

Os modais do menu (`Perfil`, `Escalas`, `Indisponibilidades`, `Mensagens`) viraram **páginas com rota**, no mesmo padrão de `membros`, funcionando pelo menu igual às demais.

### Novas páginas

| Página | Rota | Guard |
|---|---|---|
| `src/app/perfil/` | `/perfil` | `AuthGuard` |
| `src/app/minhas-escalas/` | `/minhas-escalas` | `AuthGuard` |
| `src/app/indisponibilidades/` | `/indisponibilidades` | `AuthGuard` |
| `src/app/mensagens/` | `/mensagens` | `AuthGuard` + `LeaderGuard` |

Cada página contém: `*.page.ts`, `*.page.html`, `*.page.scss`, `*.module.ts`, `*-routing.module.ts` (padrão `MembrosPageModule`).

### Arquivos alterados

| Arquivo | O que fez |
|---|---|
| `src/app/app-routing.module.ts` | Registrou as 4 rotas com lazy loading |
| `src/app/app.component.ts` | Removeu `ModalController` e os 4 componentes de modal; menu agora fecha e navega via `router.navigate` |
| `src/app/escalas/escalas.page.ts` | Removeu import órfão de `PerfilModalComponent` |
| `src/app/perfil-modal.component.ts` | **Excluído** |
| `src/app/mensagens-modal.component.ts` | **Excluído** |
| `src/app/minhas-escalas-modal.component.ts` | **Excluído** |
| `src/app/gerenciar-indisponibilidades-modal.component.ts` | **Excluído** |

### Detalhes

- Todas as páginas têm `ion-back-button defaultHref="/home"` + `ion-menu-button` no header.
- O modal `IndisponibilidadeModalComponent` (calendário de seleção) **permanece como modal**, aberto a partir da página `/indisponibilidades`.
- Botão "Sair" no Perfil agora navega pelo serviço de auth (sem `modalCtrl.dismiss`).

---

## 3. Correção do motivo em indisponibilidades

### Bug

Ao remover o motivo de uma indisponibilidade existente não era possível confirmar, e o motivo continuava salvo ao fechar.

### Causas

1. O botão **Confirmar** era ocultado/desabilitado quando `selectedCount === 0` — ao remover as seleções, não dava para confirmar.
2. O handler só gravava o `motivo` em itens **novos** (`if (!exists)`); itens já existentes nunca tinham o motivo atualizado.
3. `addUserIndisponibilidade` sempre gravava `motivo` mesmo vazio.

### Arquivos alterados

| Arquivo | O que fez |
|---|---|
| `src/app/escalas/indisponibilidade-modal.component.html` | **Confirmar** sempre visível e habilitado; bloco de "selecionado(s)"/motivo condicionado a `selectedCount > 0` |
| `src/app/indisponibilidades/indisponibilidades.page.ts` | `addUserIndisponibilidade` chamado para **todos** os itens selecionados (substitui pela chave e atualiza o motivo) |
| `src/app/services/firestore.ts` | `addUserIndisponibilidade` omite o campo `motivo` quando vazio |

---

## 4. Capacitor / Android

### Objetivo

Habilitar o app em Android (webview) com os plugins de notificação, splash e browser.

### Dependências instaladas

| Pacote | Versão |
|---|---|
| `@capacitor/cli` | **8.5.0** (atualizado de 7.6.1 para casar com o core v8) |
| `@capacitor/core` | 8.5.0 |
| `@capacitor/android` | 8.5.0 |
| `@capacitor/splash-screen` | 8.0.2 |
| `@capacitor/app` | 8.1.1 |
| `@capacitor/push-notifications` | 8.1.2 |
| `@capacitor/local-notifications` | 8.2.1 |
| `@capacitor/browser` | 8.0.4 |

### Passos executados

```
npm install -D @capacitor/cli@^8.3.0
npm install @capacitor/splash-screen && npx cap sync
npm install @capacitor/app && npx cap sync
npm install @capacitor/push-notifications && npx cap sync
npm install @capacitor/local-notifications && npx cap sync
npm install @capacitor/browser && npx cap sync
npm install @capacitor/android
npx cap add android
```

### Permissões Android

Adicionadas em `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

- `INTERNET` já vinha no template; `ACCESS_NETWORK_STATE` foi adicionado manualmente.
- `POST_NOTIFICATIONS` (Android 13+) é injetado automaticamente pelos plugins de notificação no merge do Gradle.

> `npx cap add android` exigiu `@capacitor/android`. A pasta `android/` foi gerada com os 5 plugins registrados.

---

## 5. Notificação local de escala

### Objetivo

Notificar o usuário quando ele estiver escalado para o culto do dia: **"Você está escalado para o culto hoje às 19h30."**

### Implementação

- Novo serviço `src/app/services/notificacoes.ts` (`NotificacoesService`):
  - Ao carregar o usuário logado, busca as escalas (`getEscalas`) e verifica se o nome do usuário aparece em `funcoes`, `lideres` ou `membros` de alguma escala **de hoje** (`data` no formato `YYYY-MM-DD`).
  - Se estiver escalado e ainda não passou das 19h30, pede permissão (`LocalNotifications.requestPermissions`) e agenda a notificação para hoje às **19h30**.
  - Usa **ID fixo (1)** — reabrir o app substitui a notificação, sem duplicar.
  - Erros (ex.: rodar no navegador, onde o plugin não existe) são capturados e silenciados.
- `src/app/app.component.ts` chama `verificarEscalasDeHoje()` quando `currentUser$` emite um usuário.

### Arquivos alterados

| Arquivo | O que fez |
|---|---|
| `src/app/services/notificacoes.ts` | **Novo** — serviço de agendamento de notificação local |
| `src/app/app.component.ts` | Injeta o serviço e chama a verificação no login |

### Observações

- Foi usada **local notification** (`@capacitor/local-notifications`), pois não há backend para push.
- O plugin `@capacitor/push-notifications` instalado só terá uso futuro se houver um servidor com **Firebase Cloud Messaging** (envio de tokens + mensagens).
- Em Android 13+, o app pede permissão de notificação na primeira execução.

---

## 6. Editar escala funcionando em todos os ministérios

### Bug

O modal "Editar Escala" só mostrava as seções de **funções** (vocalista, professor, etc.) quando a escala já tinha `funcoes` salvas. Ministérios como Maternal, 4 à 6 e Diáconos são gerados com `lideres`/`membros` e sem `funcoes`, então o editor não exibia as funções — era possível editar apenas a Mídia (que sempre salva `funcoes`).

### O que foi feito

- `editar-escala-modal.component.ts` ganhou o input `@Input() funcoesDisponiveis: string[]`
  - No `ngOnInit`, inicializa **todas** as funções do ministério como seções vazias quando a escala não tem `funcoes`
  - `getFuncoesKeys()` agora sempre retorna as funções disponíveis do ministério (não só as já salvas)
  - `removePessoa` de uma função move o nome de volta para `membros` (não some da escala)
  - `addPessoa` remove o nome das demais seções antes de adicionar (sem duplicar)
  - `save()` filtra funções vazias
- `escalas.page.ts` agora tem o mapa `funcoesDisponiveis` (mesmo de `membros.page.ts`) e passa a lista correta via `componentProps` ao abrir o modal

### Arquivos alterados

| Arquivo | O que fez |
|---|---|
| `src/app/escalas/editar-escala-modal.component.ts` | Input `funcoesDisponiveis`, inicialização das funções do ministério, movimentação líderes/membros/funções consistente |
| `src/app/escalas/escalas.page.ts` | Adicionou `funcoesDisponiveis` e passa ao modal em `editarEscala()` |

---

## 7. Modal Editar Escala do Louvor + rotatividade na criação

### Objetivo

Melhorar o modal "Editar Escala" para o Louvor (só seções de funções, nomes em maiúsculas, Vocal e Back Vocal), adicionar regras de rotatividade na geração automática e o botão "Excluir todas as escalas".

### Modal Editar Escala (Louvor)

- Louvor mostra **apenas** seções de funções (Líderes/Membros ocultos); nomes sempre `| uppercase`
- Funções unificadas por **chave canônica** — evita seções duplicadas (`vocalista` vs `vocal`, `back vocal` vs `backvocal`)
- A lista "Adicionar" só sugere pessoas cuja função cadastrada no Firestore corresponde à função da seção (`funcaoCanonica` igual)
- `addPessoa` remove a pessoa de todas as outras seções antes de adicionar; `removePessoa` no Louvor não devolve para Membros
- `funcoesDisponiveis` de midia/renoshow corrigidas (`['']` → `['mídia']`/`['renoshow']`) para não renderizar seção vazia

### Rotatividade na criação (`criarEscala`)

- Helper `escolher(pool, qtd)`: prioriza **não escalados** → escalados em **outros dias**. **Nunca** reutiliza quem já serviu no mesmo dia — quem ficou de manhã **não** pode cair na noite do mesmo domingo (regra estrita; se faltarem pessoas, a função/escala fica com menos gente)
- Louvor gera **todas as categorias** de `funcoesDisponiveis` (mesmo sem ninguém cadastrado na função) ordenadas por `ordemFuncoes` canônica (Vocal → Back Vocal → Guitarrista → Tecladista → Baixista → Baterista → Vionolista); **Back Vocal = 2**
- Funções agrupadas por `funcaoCanonica2` (novo método em `escalas.page.ts`, espelhando a `funcaoCanonica` do modal)
- Louvor/RenoShow voltaram a listar **todos** os membros disponíveis em `lideres`/`membros` (não só os escolhidos)

### Excluir todas as escalas

- `firestore.ts`: `deleteAllEscalas()`
- Botão na página de escalas visível para **líderes e admins** com `confirm()`

### Arquivos alterados

| Arquivo | O que fez |
|---|---|
| `src/app/escalas/escalas.page.ts` | `funcaoCanonica2`, `ordemFuncoes` canônica, rotatividade em `escolher`, geração por categorias do Louvor, `funcoesDisponiveis` corrigida, `excluirTodasEscalas` |
| `src/app/escalas/editar-escala-modal.component.ts` | `funcaoCanonica` para agrupar/validar funções, comportamento específico do Louvor |
| `src/app/escalas/editar-escala-modal.component.html` | `| uppercase`, seções de funções (Louvor sem líderes/membros) |
| `src/app/escalas/escalas.page.html` | Botão "Excluir todas as escalas" |
| `src/app/services/firestore.ts` | `deleteAllEscalas()` |

## Comandos úteis

```
npm start              # dev no navegador
npx ng build           # gera o www
npx cap sync android   # copia www + plugins para o projeto nativo
npx cap open android   # abre o projeto no Android Studio
```
