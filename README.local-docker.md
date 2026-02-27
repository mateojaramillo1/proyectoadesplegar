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