# App Igreja - Gerenciador de Escalas

App Ionic/Angular para líderes de igreja gerenciarem membros e gerarem escalas automáticas para os ministérios (Louvor, Mídia, Renoshow).

## Stack

- **Frontend**: Ionic 7 + Angular 19
- **Backend**: Firebase (Auth + Firestore)
- **Autenticação**: Email/senha (Firebase Auth)

## Funcionalidades

### Login
- Login com email/senha
- Redireciona para /home após autenticação
- Protege rotas com guards (AuthGuard, LeaderGuard)

### Homepage (Escalas)
- Exibe escalas filtradas por visibilidade do usuário
- **Líder**: vê TODAS as escalas dos ministérios que lidera
- **Membro comum**: vê apenas escalas onde seu nome aparece
- Data formatada em português (ex: "Quinta, 24/07")

### Geração de Escalas (por ministério)
- 3 botões independentes: Louvor, Mídia, Renoshow
- Cada botão gera escalas para TODOS os ministérios e datas restantes do mês (Quinta + Domingo)
- Apenas UM ministério por data (primeiro a gerar "ocupa" a data)
- Pessoas são alocadas em apenas UM ministério por escala
- Líderes têm prioridade no próprio ministério
- Membros comuns são alocados no primeiro ministério disponível com funções
- Quantidades: Back Vocal = 2 pessoas, Vocal = 1 pessoa, demais = 1 pessoa
- Sorteio aleatório a cada data

### Exibição
- Card por escala: data + nome do ministério
- Funções ordenadas (Vocal primeiro, Back Vocal segundo)
- Se não há funções definidas, mostra os nomes dos participantes direto
- Badge "Líder" ao lado do nome do ministério
- Botão de excluir para líderes

### Membros (CRUD)
- Apenas líderes podem acessar (via LeaderGuard)
- Lista filtrada: só membros dos ministérios que o líder lidera
- Modal de criação/edição com:
  - Nome, email, senha
  - Múltiplos ministérios
  - Checkboxes "Ministra" e "Líder"
  - Funções disponíveis por ministério
- Cria conta no Firebase Auth via REST API
- Salva documento no Firestore (`usuarios/{uid}`)

## Estrutura do Projeto

```
src/
├── app/
│   ├── app.module.ts              # Firebase config + providers
│   ├── app-routing.module.ts       # Rotas + guards
│   ├── app.component.ts/html       # Root
│   ├── login/
│   │   └── login.page.ts/html      # Tela de login
│   ├── home/
│   │   └── home.page.ts/html        # Escalas (geração + exibição)
│   ├── membros/
│   │   └── membros.page.ts/html     # CRUD de membros
│   ├── services/
│   │   ├── auth.ts                 # AuthService + Usuario interface
│   │   └── firestore.ts            # FirestoreService (CRUD)
│   └── guards/
│       ├── auth.guard.ts           # Redireciona p/ /login
│       └── leader.guard.ts         # Redireciona p/ /home
└── environments/
    └── firebase-config.ts          # Chaves Firebase
```

## Modelo de Dados (Firestore)

### Coleção `usuarios`

Document ID = uid do Firebase Auth

```json
{
  "uid": "FirebaseAuthUID",
  "email": "usuario@email.com",
  "nome": "Gabriel",
  "ministerios": [
    {
      "nome": "louvor",
      "ministra": true,
      "lider": false,
      "funcoes": ["vocalista", "guitarrista"]
    },
    {
      "nome": "midia",
      "ministra": false,
      "lider": true,
      "funcoes": []
    }
  ]
}
```

### Coleção `escalas`

Document ID = auto do Firestore

```json
{
  "data": "2026-07-30",
  "ministerio": "midia",
  "lideres": ["Gabi", "Gabriel"],
  "membros": ["Valéria"],
  "funcoes": {
    "Sonoplasta": ["Gabriel"],
    "Projetor": ["Gabi"]
  }
}
```

## Funcionalidades Implementadas

- [x] Autenticação Firebase (email/senha)
- [x] Guards de rota (autenticado + líder)
- [x] Login com validação e loading
- [x] CRUD de membros (criação, edição, exclusão)
- [x] Criação de conta Firebase Auth via REST
- [x] Filtro de membros por ministério do líder
- [x] Normalização de nomes de ministérios (lowercase, sem acentos)
- [x] Geração automática de escalas (por ministério)
- [x] Sorteio aleatório de pessoas por função
- [x] Quantidades por função (Louvor: 2 BV, 1 Vocal)
- [x] Ordenação de funções (Vocal > Back Vocal)
- [x] Visibilidade baseada em papel (líder vs membro)
- [x] Formatação de data em português
- [x] Exclusão de escalas
- [x] Participação: líder SEMPRE participa, funções mesmo sem `ministra: true`
- [x] Cada pessoa em APENAS UM ministério por escala
- [x] Uma escala por data (primeiro ministério a gerar ocupa)
- [x] Tratamento de dados inconsistentes (Firestore com acentos, trailing spaces)

## Para Configurar no Firebase

1. **Authentication** → Sign-in method → Habilitar "Email/Password"
2. **Firestore Database** → Criar banco (modo produção ou teste)
3. **Security Rules** (modo teste para desenvolvimento):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Comandos

```bash
# Desenvolvimento
npm run dev
# ou
ionic serve

# Build
ng build

# Build produção
ionic build --prod
```

## Histórico de Bugs Corrigidos

- API key truncada no app.module.ts (estava "AIzaSy..." sem o resto)
- Nomes de ministérios inconsistentes no Firestore ("Louvor" vs "louvor", "Mídia" vs "midia")
- `funcoes` armazenadas como objetos `{nome: "Back Vocal"}` em vez de strings
- `ministra: false` como default impedia participação mesmo com funcoes
- TS4111: acesso com dot notation em documentos do Firestore
- Trailing spaces em nomes de função ("Back Vocal ")
- Líderes sem funcoes não apareciam na escala
- Pessoas sendo alocadas em múltiplos ministérios na mesma escala
- `m.nome` undefined causando crash no `normalizar`
- Escala unificada (todos ministérios) → migrado para escala por ministério
