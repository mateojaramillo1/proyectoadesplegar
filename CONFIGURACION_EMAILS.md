# Configuración de Envío de Correos

Este proyecto utiliza **NodeMailer** con Gmail para enviar correos de confirmación de reservas.

## Características

✅ **Correos automáticos al crear reserva:**
- Correo al usuario con detalles de su reserva
- Correos a TODOS los administradores registrados en el sistema

✅ **Correo de aprobación:**
- Cuando un admin aprueba una reserva, se notifica al usuario

✅ **Información del Sistema:**
- Los correos se envían a los usuarios registrados en la base de datos
- Los correos se envían a todos los administradores registrados en el sistema
- Si no hay administradores registrados, se muestra un aviso en los logs

## Requisitos

1. Una cuenta de Google (Gmail)
2. Autenticación de dos factores habilitada en tu cuenta de Google
3. Contraseña de aplicación generada

## Pasos para Configurar

### 1. Habilitar autenticación de dos factores (si no la tienes)

1. Ve a [myaccount.google.com](https://myaccount.google.com)
2. En el menú izquierdo, selecciona **"Seguridad"**
3. Busca **"Verificación en dos pasos"** y habilítala

### 2. Generar contraseña de aplicación

1. Ve a [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Selecciona **"Correo"** en el dropdown "Select app"
3. Selecciona tu dispositivo (Windows, Mac, etc.)
4. Google te generará una contraseña de 16 caracteres
5. Copia esta contraseña (sin espacios)

### 3. Configurar variables de entorno

Abre el archivo `.env` en la raíz del proyecto y configura:

```env
# Email Configuration
EMAIL_USER=tu_correo@gmail.com
EMAIL_PASSWORD=contraseña_generada_sin_espacios
EMAIL_FROM_NAME=Paradisus Cancún
```

**Ejemplo:**
```env
EMAIL_USER=hotelparadisus@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop
EMAIL_FROM_NAME=Paradisus Cancún
```

**Notas:**
- El correo del usuario se obtiene automáticamente del perfil registrado en la base de datos
- Los correos del admin se obtienen de TODOS los usuarios registrados con rol 'admin' en el sistema
- No es necesario configurar `EMAIL_ADMIN` en variables de entorno

### 4. Instalar dependencias

```bash
npm install
```

## Funcionalidades de Correos

### Correos al crear una reserva

Cuando un usuario crea una reserva se envían **2 correos**:

#### 1. Correo al Usuario
- Contiene detalles de la reserva
- Fechas de entrada y salida
- Total a pagar
- Instrucciones según método de pago
- Link para ver mis reservas

#### 2. Correo al Admin
- Notifica sobre nueva solicitud de reserva
- Datos del huésped
- Detalles de la reserva
- Link al panel de administración

### Correo de Aprobación

Cuando el admin aprueba una reserva desde el panel administrativo, se envía un correo al usuario confirmando que la reserva fue aprobada.

## Solución de Problemas

### "Error de autenticación" o "Invalid login credentials"

- Asegúrate de haber copiado correctamente la contraseña de aplicación (sin espacios)
- Verifica que el EMAIL_USER sea correcto
- Revisa que tengas habilitada la autenticación de dos factores

### No se envían correos

- Revisa la consola del servidor para ver los logs de error
- Verifica que las variables de entorno estén configuradas correctamente
- Algunos proveedores de hosting requieren permisos adicionales para enviar correos

### Usar un correo corporativo o diferente a Gmail

Para usar otro proveedor de correo, modifica `services/ServicioCorreo.js`:

```javascript
this.transporter = nodemailer.createTransport({
  service: 'nombre_del_servicio', // 'gmail', 'outlook', 'yahoo', etc.
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});
```

O usa configuración SMTP:

```javascript
this.transporter = nodemailer.createTransport({
  host: 'smtp.tuservidor.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});
```

## Seguridad

⚠️ **Nunca** cometas las credenciales en git. Mantén el `.env` en `.gitignore`

Uso recomendado con variables de entorno en el servidor:

```bash
# En tu hosting (Vercel, etc.)
EMAIL_USER=tu_correo@gmail.com
EMAIL_PASSWORD=contraseña_app
EMAIL_ADMIN=admin@hotelparadisus.com
EMAIL_FROM_NAME=Paradisus Cancún
```

## Referencias

- [Google App Passwords](https://support.google.com/accounts/answer/185833)
- [NodeMailer Documentation](https://nodemailer.com/)
- [Gmail SMTP Settings](https://support.google.com/a/answer/176600)
