# Mis Cuentas

App sencilla para registrar tus ingresos y gastos, y ver tu saldo actualizarse al instante. Todo se guarda en el navegador (localStorage) — no necesita base de datos ni backend.

## Cómo probarla en tu computador

```bash
npm install
npm run dev
```

Abre http://localhost:3000

## Cómo subirla a Vercel (gratis)

**Opción A — sin usar la terminal:**
1. Crea un repositorio en GitHub y sube esta carpeta (puedes arrastrar los archivos desde github.com/new si no usas git).
2. Entra a https://vercel.com, inicia sesión con tu cuenta de GitHub.
3. Click en "Add New Project", elige el repositorio que subiste.
4. Vercel detecta que es un proyecto Next.js automáticamente — dale a "Deploy" y listo.

**Opción B — con la terminal:**
```bash
npm install -g vercel
vercel
```
Sigue las instrucciones en pantalla (te pedirá iniciar sesión la primera vez).

## Instalarla como app en el celular

Una vez esté desplegada en Vercel (ver arriba), abre el link en el navegador del celular:

**iPhone (Safari):**
1. Abre el link.
2. Toca el botón de compartir (el cuadrito con la flecha hacia arriba).
3. Elige "Agregar a inicio".

**Android (Chrome):**
1. Abre el link.
2. Toca el menú de tres puntos, arriba a la derecha.
3. Elige "Instalar app" o "Agregar a pantalla de inicio".

Te queda un ícono como cualquier otra app, abre en pantalla completa (sin la barra del navegador) y hasta funciona sin internet una vez la hayas abierto por lo menos una vez.

## Notas importantes

- Los datos se guardan **solo en el navegador donde los ingreses**. Si entras desde el celular y desde el computador, verás listas distintas. Si borras el caché del navegador, se pierden los datos.
- Si en algún momento quieres que tus datos estén disponibles en todos tus dispositivos, el siguiente paso sería conectar una base de datos (por ejemplo Vercel Postgres o Supabase) — puedo ayudarte a hacer ese cambio cuando quieras.
