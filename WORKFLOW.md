# Flujo de trabajo con Git — a partir de ahora

Reemplaza la entrega por ZIP completo. Objetivo: que cada actualización solo toque lo que realmente cambió, y que `.env.local` (o cualquier otro archivo local tuyo) nunca vuelva a estar en riesgo.

---

## 0. Configuración única (hacela una sola vez)

Recibís, junto a este documento, `admin-baseline.zip` — es el **último ZIP completo** que vas a recibir. A diferencia de los anteriores, este ya incluye una carpeta `.git/` con un commit inicial (`Baseline: Beta 0.1 + Rediseño de identidad visual completo`).

1. Borrá tu carpeta `admin` actual por completo (la de los ZIPs anteriores, que no tiene Git).
2. Descomprimí `admin-baseline.zip` en su lugar.
3. Entrá a la carpeta y confirmá que Git la reconoce:
   ```bash
   cd admin
   git log --oneline
   ```
   Deberías ver una sola línea: `Baseline: Beta 0.1 + Rediseño de identidad visual completo (Etapas 1-3)`.
4. Volvé a crear tu `.env.local` (no viene en el commit — sigue en `.gitignore`, a propósito):
   ```bash
   cp .env.example .env.local
   # completá VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY como siempre
   ```

Con esto, tu carpeta local queda exactamente en el mismo estado que mi copia de referencia. De acá en adelante, todo lo que te entregue va a ser un **parche** contra este punto de partida.

---

## 1. Cómo van a llegar los próximos cambios

Cada vez que termine un Sprint o una corrección, te voy a dar un archivo `.patch` (formato `git diff`) — mucho más chico que un ZIP, y mucho más fácil de revisar antes de aplicarlo, porque muestra línea por línea exactamente qué cambió.

**`docs/` nunca forma parte del parche funcional.** Si un Sprint agrega o cambia documentación (decisiones de arquitectura, documentos de diseño), llega en un segundo parche separado, opcional — nunca mezclado con el código. Así un conflicto de documentación (que no afecta en nada al funcionamiento) nunca bloquea ni ensucia la aplicación de un cambio de código real.

### Para aplicarlo:

```bash
cd admin
git apply nombre-del-parche.patch
```

Si el parche incluye migraciones nuevas de Supabase, el mensaje que te acompañe te va a decir explícitamente que corras `supabase db push` después — igual que hasta ahora, aplicar el parche no corre nada contra tu base de datos solo.

### Si algo no aplica limpio

Puede pasar si modificaste algo a mano en el medio. Antes de forzar nada, corré:
```bash
git apply --check nombre-del-parche.patch
```
Si devuelve un error, avisame con el mensaje exacto — es más fácil de resolver así que adivinando.

---

## 2. Confirmar un cambio (opcional, pero recomendado)

Después de aplicar un parche y probarlo, si te sirve dejar tu propio historial prolijo:
```bash
git add -A
git commit -m "Sprint X: descripción corta"
```
No es obligatorio para que la app funcione — es solo para que tengas un registro local de cuándo aplicaste cada cambio, con la posibilidad de volver atrás (`git log`, `git diff HEAD~1`) si algo sale mal.

---

## 3. Si en algún momento querés conectarlo a tu propio GitHub

Yo no tengo (ni voy a pedir) tus credenciales de GitHub — esa parte la hacés vos, es un paso de una sola vez:

```bash
# 1. Creá un repositorio vacío en github.com (sin README, sin .gitignore —
#    ya los tenés en el proyecto)
# 2. Conectalo:
git remote add origin https://github.com/TU-USUARIO/admin.git
git push -u origin main
```

A partir de ahí, cada vez que apliques un parche y hagas tu propio commit, podés subirlo con `git push` cuando quieras — completamente en tus manos, sin que yo intervenga en esa parte.

---

## 4. Qué cambia realmente para vos

| Antes | Ahora |
|---|---|
| ZIP completo cada entrega (~200+ archivos) | Parche con solo los archivos que cambiaron |
| Riesgo de que el extractor no sobrescriba algo | `git apply` siempre aplica exactamente lo que dice el parche |
| Riesgo de perder `.env.local` | Estructuralmente imposible — ni figura en el parche |
| Difícil ver qué cambió sin comparar carpetas | El parche mismo es la lista de cambios, línea por línea |
