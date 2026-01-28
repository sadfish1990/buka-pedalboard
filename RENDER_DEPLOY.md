# 🚀 Desplegar en Render.com - Guía Rápida

## ✅ Paso 1: Código en GitHub (COMPLETADO)
- Repositorio: https://github.com/sadfish1990/buka-pedalboard
- El código se está subiendo ahora...

## 📝 Paso 2: Crear cuenta en Render

1. Ve a: **https://render.com**
2. Click en "Get Started for Free"
3. Regístrate con GitHub (recomendado) - te conectará automáticamente

## 🔗 Paso 3: Conectar el repositorio

1. En Render, click en **"New +"** (arriba derecha)
2. Selecciona **"Web Service"**
3. Click en **"Connect GitHub"** si no lo hiciste
4. Busca y selecciona: **`sadfish1990/buka-pedalboard`**

## ⚙️ Paso 4: Configurar el servicio

Render debería detectar automáticamente el `render.yaml`, pero si no:

- **Name**: `buka-pedalboard` (o el que quieras)
- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: **Free** ⬅️ IMPORTANTE

## 🎉 Paso 5: Deploy!

1. Click en **"Create Web Service"**
2. Espera 3-5 minutos mientras se despliega
3. Tu URL será algo como: **`https://buka-pedalboard.onrender.com`**

## 📱 Compartir con amigos

Una vez desplegado, solo comparte la URL:
- **`https://buka-pedalboard.onrender.com`**
- Funciona en cualquier dispositivo
- HTTPS automático
- No depende de tu PC

## ⚠️ Notas importantes

- **Primera carga**: Puede tardar 30 segundos si el servicio estaba dormido
- **Inactividad**: Se duerme después de 15 minutos sin uso (plan gratuito)
- **Actualizaciones**: Cada vez que hagas `git push`, Render se actualiza automáticamente

## 🔄 Para actualizar la pedalera en el futuro

```bash
cd /home/buka/Documentos/wam2
git add .
git commit -m "Descripción de cambios"
./push_to_github.sh
```

Render detectará el cambio y se actualizará solo.
