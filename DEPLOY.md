# BUKA PEDALBOARD - Despliegue en Render.com

## Pasos para desplegar:

### 1. Crear cuenta en Render.com
- Ve a https://render.com
- Regístrate con GitHub (recomendado) o email

### 2. Subir el código a GitHub
```bash
cd /home/buka/Documentos/wam2

# Crear repositorio en GitHub primero (https://github.com/new)
# Nombre sugerido: buka-pedalboard

# Luego ejecutar:
git add .
git commit -m "Preparar para deployment en Render"
git remote add origin https://github.com/TU_USUARIO/buka-pedalboard.git
git push -u origin main
```

### 3. Conectar Render con GitHub
- En Render.com, click en "New +" → "Web Service"
- Conecta tu cuenta de GitHub
- Selecciona el repositorio `buka-pedalboard`
- Render detectará automáticamente el `render.yaml`

### 4. Configurar (si no detecta render.yaml)
- **Name**: buka-pedalboard
- **Environment**: Node
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: Free

### 5. Deploy
- Click "Create Web Service"
- Espera 3-5 minutos mientras se despliega
- Tu URL será: `https://buka-pedalboard.onrender.com`

## Notas importantes:
- El plan gratuito se duerme después de 15 minutos sin uso
- La primera carga después de dormir tarda ~30 segundos
- HTTPS está incluido automáticamente
- Puedes usar un dominio personalizado si quieres

## Actualizar la pedalera:
```bash
git add .
git commit -m "Actualización"
git push
```
Render se actualizará automáticamente.
