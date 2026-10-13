# Progresso - App de Escalas

## Estrutura do Menu (app.component)

- `ion-menu` com `side="end"` (abre pela direita)
- Avatar com inicial do usuário
- Nome, email, badges (Admin/Líder)
- **Escalas** — modal `MinhasEscalasModalComponent`: lista as escalas que o usuário logado participa, buscando em `lideres`, `membros` e `funcoes` de cada escala. Cada ministério exibido dentro de uma "pílula" colorida (cor específica por ministério). Mostra: ministério (pílula), data formatada, nome do usuário.
- **Mensagens** — modal `MensagensModalComponent` (visível apenas para admin/líder): lista todas as `indisponibilidades` dos membros dos ministérios que o usuário lidera.
- **Indisponibilidades** — modal `GerenciarIndisponibilidadesModalComponent`: gerencia indisponibilidades do próprio usuário, organizado por ministério. Substituiu o card de indisponibilidades que ficava dentro de cada página de ministério.
- **Perfil** — modal `PerfilModalComponent`: dados do usuário, lista de ministérios com funções, botão Sair.
- **Sair** — logout

## Novos arquivos criados

| Arquivo | Descrição |
|---|---|
| `mensagens-modal.component.ts` | Modal standalone que lista indisponibilidades dos membros (admin/líder) |
| `minhas-escalas-modal.component.ts` | Modal standalone que mostra as escalas do usuário logado |
| `perfil-modal.component.ts` | Modal standalone com dados do usuário e logout |
| `gerenciar-indisponibilidades-modal.component.ts` | Modal standalone que gerencia indisponibilidades do próprio usuário por ministério |
| `docs/progresso.md` | Este arquivo |

## Serviços

### `services/auth.ts`
- `Usuario.admin` — campo boolean para admin
- `isAdmin` / `isLeader` — getters
- `refreshCurrentUser()` — recarrega documento do Firestore
- `currentUser$` — BehaviorSubject com o usuário logado

### `services/firestore.ts`
- `addUserIndisponibilidade(uid, ministerio, data, motivo)` — read-modify-write (evita `arrayUnion`)
- `removeUserIndisponibilidade(uid, ministerio, data)` — filtra e atualiza
- `updateEscala(id, data)` — atualiza campos da escala
- Demais CRUD: `getEscalas`, `getUsuarios`, `addEscala`, `deleteEscala`, `addUsuario`, `updateUsuario`, `deleteUsuario`, `getUsuarioByUid`

## Guards

### `guards/leader.guard.ts`
- Aguarda `loading$` do AuthService antes de decidir
- Permite admin e líder do ministério

## Páginas

### Home (`home/`)
- Lista todos os ministérios (visíveis se participa ou é admin)
- Badges: nome, Líder, Admin
- Botão "Gerenciar Membros" (admin)
- Botão de menu (canto direito) abre o menu lateral

### Escalas (`escalas/`)

- Botões Editar/Excluir visíveis para líder do ministério ou admin
- Botão "Membros" com `queryParams` para filtrar
- Geração automática de escalas com quotas por ministério
- `EditarEscalaModalComponent` — modal de edição manual
- Indisponibilidades removidas da página (agora acessível pelo menu)

### Membros (`membros/`)
- Admin vê todos os usuários e todos os ministérios
- Líder vê apenas membros dos seus ministérios
- Filtro por `?ministerio=` query param
- CRUD completo (criar/editar/excluir membros)

## Indisponibilidades

- Armazenadas dentro do documento do usuário (`usuarios/{uid}`)
- Cada entrada: `{ ministerio, data, turno?, motivo }`
- Apenas quintas e domingos selecionáveis
- Dias passados e <7 dias bloqueados
- `refreshCurrentUser()` necessário após modificar
- Domingos têm seleção de turno (Manhã/Noite/Ambos) via ActionSheet

## Ministérios disponíveis

| Chave | Nome | Quota | Cores (pílula) |
|---|---|---|---|
| `louvor` | Louvor | — | Vermelho `#e74c3c` |
| `midia` | Mídia | — | Azul `#3498db` |
| `renoshow` | RenoShow | — | Laranja `#f39c12` |
| `maternal` | Maternal | 2 | Rosa `#e91e63` |
| `4a6` | 4 à 6 | 2 | Roxo `#9b59b6` |
| `7a10` | 7 à 10 | 1 | Verde-água `#1abc9c` |
| `juniores` | Juniores | 1 | Verde `#2ecc71` |
| `adolescentes` | Adolescentes | 1 | Laranja escuro `#ff9800` |
| `sonoplastia` | Sonoplastia | 1 | Cinza `#607d8b` |
| `diaconos` | Diáconos | 4 | Marrom `#795548` |

## Turno (Manhã/Noite)

- Domingos geram **duas** escalas: uma para Manhã e uma para Noite
- Quintas geram apenas **uma** escala (sem turno)
- Cada escala no Firestore tem campo opcional `turno: "manha" | "noite"`
- Indisponibilidade em domingo permite marcar Manhã, Noite, ou Ambos via ActionSheet
- `turno` é exibido nas páginas: escalas, editar escala, minhas escalas, mensagens
- Geração automática respeita turno na filtragem de datas existentes e indisponibilidades

## Observações

- `arrayUnion`/`arrayRemove` do Firestore falham com objetos com propriedades opcionais → usar read-modify-write
- Firestore usa `ministerios` (plural); se documento tiver `ministerio` (singular) o código não encontra
- `refreshCurrentUser()` precisa ser chamado explicitamente após modificar indisponibilidades
- `PerfilModalComponent`, `MensagensModalComponent`, `MinhasEscalasModalComponent`, `GerenciarIndisponibilidadesModalComponent` e `IndisponibilidadeModalComponent` são **standalone**
- Páginas (Home, Escalas, Membros) usam `standalone: false`
- Campo `ministra` removido de `Usuario.ministerios` e formulário de membros — não será mais usado
