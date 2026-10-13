// Backfill: grava o campo denormalizado `lider` (boolean) em cada documento
// de `usuarios`, derivado de `ministerios[].lider`.
//
// Necessario porque as Firestore Rules nao conseguem percorrer a lista
// `ministerios[].lider` para autorizar lideres.
//
// Uso (uma vez, ANTES de aplicar as Rules restritas):
//   npm run backfill:lider
// Requer no `.env`: ADMIN_EMAIL e ADMIN_PASSWORD de um usuario admin.

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

const cfg = {
  apiKey: process.env.NG_APP_FIREBASE_API_KEY,
  authDomain: process.env.NG_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NG_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NG_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NG_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NG_APP_FIREBASE_APP_ID
};

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!cfg.apiKey || !cfg.projectId) {
  console.error('\n[backfill-lider] Configure o Firebase no `.env` (rode com --env-file=.env).\n');
  process.exit(1);
}
if (!email || !password) {
  console.error('\n[backfill-lider] Defina ADMIN_EMAIL e ADMIN_PASSWORD no `.env` (usuario admin).\n');
  process.exit(1);
}

const app = initializeApp(cfg);
const auth = getAuth(app);
const db = getFirestore(app);

try {
  await signInWithEmailAndPassword(auth, email, password);
} catch (e) {
  console.error('[backfill-lider] Falha no login do admin:', e?.message || e);
  process.exit(1);
}

const snapshot = await getDocs(collection(db, 'usuarios'));
let atualizados = 0;

for (const d of snapshot.docs) {
  const data = d.data();
  const lider = (data.ministerios || []).some(m => m && m.lider === true);
  if (data.lider !== lider) {
    await updateDoc(doc(db, 'usuarios', d.id), { lider });
    atualizados++;
    console.log(`  ${data.nome || d.id}: lider = ${lider}`);
  }
}

console.log(`\n[backfill-lider] Concluido: ${atualizados} de ${snapshot.size} usuario(s) atualizado(s).`);
process.exit(0);
