import { db, saveSettings } from '../db';

const APP = 'cap-cadets';
const ITERATIONS = 250_000;

const toB64 = (buf: Uint8Array) => {
  let s = '';
  for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return btoa(s);
};
const fromB64 = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

async function deriveKey(password: string, salt: Uint8Array<ArrayBuffer>) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/** Exporte toutes les données. Avec mot de passe : chiffrement AES-256-GCM (clé dérivée par PBKDF2). */
export async function exportData(password?: string): Promise<string> {
  const payload = JSON.stringify({
    app: APP,
    schema: 1,
    exportedAt: new Date().toISOString(),
    results: await db.results.toArray(),
    levels: await db.levels.toArray(),
    kv: await db.kv.toArray(),
  });
  if (!password) return payload;
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const data = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(payload)));
  return JSON.stringify({ app: APP, encrypted: true, salt: toB64(salt), iv: toB64(iv), data: toB64(data) });
}

/** Restaure une sauvegarde : REMPLACE les données actuelles. Renvoie le nombre de résultats restaurés. */
export async function importData(text: string, password?: string): Promise<number> {
  let obj = JSON.parse(text);
  if (obj?.app !== APP) throw new Error('Ce fichier n’est pas une sauvegarde Cap Cadets.');
  if (obj.encrypted) {
    if (!password) throw new Error('Sauvegarde chiffrée : saisissez le mot de passe.');
    try {
      const key = await deriveKey(password, fromB64(obj.salt));
      const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(obj.iv) }, key, fromB64(obj.data));
      obj = JSON.parse(new TextDecoder().decode(plain));
    } catch {
      throw new Error('Mot de passe incorrect ou fichier endommagé.');
    }
  }
  if (!Array.isArray(obj.results) || !Array.isArray(obj.levels) || !Array.isArray(obj.kv)) {
    throw new Error('Sauvegarde incomplète.');
  }
  await db.transaction('rw', db.results, db.levels, db.kv, async () => {
    await Promise.all([db.results.clear(), db.levels.clear(), db.kv.clear()]);
    await db.results.bulkAdd(obj.results);
    await db.levels.bulkAdd(obj.levels);
    await db.kv.bulkAdd(obj.kv);
  });
  return obj.results.length;
}

/** Remet le fichier à l'utilisateur : feuille de partage (iOS) ou téléchargement. */
export async function deliverFile(content: string, name: string): Promise<void> {
  const file = new File([content], name, { type: 'application/json' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name });
      await saveSettings({ lastBackupAt: new Date().toISOString() });
      return;
    } catch (e) {
      if ((e as Error).name === 'AbortError') return; // partage annulé : rien n'est enregistré comme sauvegardé
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  await saveSettings({ lastBackupAt: new Date().toISOString() });
}
