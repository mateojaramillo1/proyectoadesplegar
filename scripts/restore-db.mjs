import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const MONGO_URI = process.env.DATABASE;
if (!MONGO_URI) {
  console.error('DATABASE no esta configurada.');
  process.exit(1);
}

const backupPath = process.argv[2];
if (!backupPath) {
  console.error('Uso: node scripts/restore-db.mjs <ruta_backup>');
  process.exit(1);
}

const absolute = path.resolve(process.cwd(), backupPath);
if (!fs.existsSync(absolute)) {
  console.error(`No existe la ruta: ${absolute}`);
  process.exit(1);
}

const args = ['--uri', MONGO_URI, '--drop', '--dir', absolute, '--gzip'];
const proc = spawn('mongorestore', args, { stdio: 'inherit', shell: true });

proc.on('close', (code) => {
  if (code !== 0) {
    console.error('Fallo la restauracion. Verifique que mongorestore este instalado.');
    process.exit(code || 1);
  }

  console.log('Restauracion completada.');
});
