// Gera `src/environments/firebase-config.ts` a partir das variaveis do `.env`.
//
// Uso: node --env-file=.env scripts/gerar-firebase-config.mjs
// (os hooks "prestart"/"prebuild"/"pretest"/"prewatch" do package.json ja fazem isso)

import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const CHAVES = [
  ['apiKey', 'NG_APP_FIREBASE_API_KEY'],
  ['authDomain', 'NG_APP_FIREBASE_AUTH_DOMAIN'],
  ['projectId', 'NG_APP_FIREBASE_PROJECT_ID'],
  ['storageBucket', 'NG_APP_FIREBASE_STORAGE_BUCKET'],
  ['messagingSenderId', 'NG_APP_FIREBASE_MESSAGING_SENDER_ID'],
  ['appId', 'NG_APP_FIREBASE_APP_ID']
];

const faltando = CHAVES.filter(([, envVar]) => !process.env[envVar]).map(([, envVar]) => envVar);

if (faltando.length) {
  console.error('\n[firebase-config] Variaveis de ambiente ausentes:');
  faltando.forEach(nome => console.error(`  - ${nome}`));
  console.error('\nCopie `.env.example` para `.env` e preencha os valores do Firebase.');
  console.error('Exemplo: copy .env.example .env  (Windows)  |  cp .env.example .env  (Linux/macOS)\n');
  process.exit(1);
}

const linhas = CHAVES.map(([chave, envVar]) => `  ${chave}: "${process.env[envVar]}"`).join(',\n');

const conteudo = `// ARQUIVO GERADO automaticamente por scripts/gerar-firebase-config.mjs
// NAO edite manualmente: rode "npm run build" / "npm start" para regerar a partir do .env
export const firebaseConfig = {
${linhas}
};
`;

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const destino = resolve(raiz, 'src/environments/firebase-config.ts');

writeFileSync(destino, conteudo, 'utf8');
console.log(`[firebase-config] Gerado: ${destino}`);
