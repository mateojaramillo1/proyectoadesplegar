import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const MONGO_URI = process.env.DATABASE;
if (!MONGO_URI) {
  console.error('DATABASE no esta configurada.');
  process.exit(1);
}

const baseDir = process.env.BACKUP_DIR || path.resolve(process.cwd(), 'backups');
if (!fs.existsSync(baseDir)) {
  fs.mkdirSync(baseDir, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[.:]/g, '-');
const outputDir = path.join(baseDir, `backup-${timestamp}`);

const args = ['--uri', MONGO_URI, '--out', outputDir, '--gzip'];
const proc = spawn('mongodump', args, { stdio: 'inherit', shell: true });

proc.on('close', (code) => {
  if (code !== 0) {
    console.error('Fallo el backup. Verifique que mongodump este instalado.');
    process.exit(code || 1);
  }

  console.log(`Backup completado: ${outputDir}`);
});
