# Base de datos local con Docker (sin afectar remoto)

Esta configuración es solo para desarrollo local.

## Cómo funciona

- `index.js` carga primero `.env` y luego `.env.local` con `override: true`.
- En local, usa `.env.local` para apuntar a Mongo Docker.
- En remoto (Vercel/producción), `.env.local` no se usa y se mantienen las variables del entorno remoto.

## 1) Verifica `.env.local`

Usa este valor para trabajar en local:

```env
DATABASE=mongodb://127.0.0.1:27017/hotel_local
PORT=3003
FRONTEND_ORIGIN=http://localhost:4200
```

## 2) Levanta MongoDB local

Desde `proyectoadesplegar`:

```bash
npm run docker:db:up
```

## 3) Inicia tu backend

```bash
npm start
```

## Comandos útiles

```bash
npm run docker:db:logs
npm run docker:db:down
```

## Notas importantes

- El volumen `mongo_data` conserva datos entre reinicios.
- Si quieres borrar todo y empezar limpio:

```bash
docker compose down -v
```

- Esta integración no cambia el funcionamiento remoto mientras mantengas la URI remota en variables de producción.

## Backups y recuperacion (produccion)

Se agregaron scripts para backup y restauracion:

```bash
npm run backup:db
npm run restore:db -- ./backups/backup-AAAA-MM-DDTHH-mm-ss-sssZ
```

Requisitos para estos scripts:

- Tener instaladas MongoDB Database Tools (`mongodump`, `mongorestore`).
- Variable `DATABASE` configurada.

Variables opcionales:

```env
BACKUP_DIR=./backups
AUDIT_RETENTION_DAYS=180
DB_MAX_POOL_SIZE=15
```

Limpieza de logs de auditoria:

```bash
npm run cleanup:audit
```

## Recomendacion de automatizacion diaria

- Ejecutar `npm run backup:db` 1 vez al dia (madrugada).
- Copiar carpeta de backup a almacenamiento externo seguro.
- Probar restauracion al menos 1 vez por mes en ambiente de pruebas.

## Endpoints admin nuevos (dashboard y reportes)

Todos requieren `Bearer token` de administrador:

- `GET /admin/dashboard-reservas?desde=YYYY-MM-DD&hasta=YYYY-MM-DD`
- `GET /admin/disponibilidad-mensual?idHabitacion=<id>&anio=2026&mes=3`
- `GET /admin/exportar-reservas?estado=todos&pago=todos&desde=YYYY-MM-DD&hasta=YYYY-MM-DD`
- `POST /admin/generar-checkin-qr/:idreserva`
- `POST /admin/procesar-checkin` body `{ "token": "..." }`
- `POST /admin/procesar-checkout` body `{ "token": "..." }`
- `GET /admin/crm-clientes?limite=50`

Uso recomendado:

- Dashboard: actualizar cada vez que cambien filtros de fechas.
- Disponibilidad: consultar por habitacion y mes para evitar sobreventa.
- Exportacion: abrir CSV en Excel para reportes administrativos.