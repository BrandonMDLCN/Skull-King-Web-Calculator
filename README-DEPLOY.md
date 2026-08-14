# Guía de Despliegue Local y Exposición a la Web

Este documento describe cómo ejecutar el proyecto localmente usando Podman y cómo exponerlo a internet usando ngrok.

## 1. Ejecutar localmente con Podman

El proyecto utiliza un archivo `docker-compose.yml` que orquesta 3 servicios:
- Base de datos (PostgreSQL)
- Backend (Node.js + Socket.io) en el puerto 4000
- Frontend (React) en el puerto 3000

### Prerrequisitos
Debes tener instalado **Podman** y **podman-compose** (o `docker-compose`).
*(Nota: Actualmente tienes Podman instalado, pero falta instalar `podman-compose` en tu sistema).*

Para instalar `podman-compose` (si tienes Python/pip):
```bash
pip install podman-compose
```

### Comandos para levantar el proyecto
Abre tu terminal en la raíz del proyecto y ejecuta:
```bash
podman-compose up --build
```
*(Solución de errores: Si te aparece un error indicando que `podman-compose` no se reconoce o no está en el PATH de Windows, puedes ejecutarlo a través del módulo de Python usando el siguiente comando alternativo:)*
```bash
python -m podman_compose up --build
```

Una vez levantado, podrás acceder al juego en: **http://localhost:3000**

### Cómo detener el proyecto
Cuando ya no quieras tener el proyecto ejecutándose, puedes detener y eliminar los contenedores generados.
En la misma terminal donde levantaste el proyecto, presiona `Ctrl + C` para detener la ejecución, y luego ejecuta:
```bash
podman-compose down
```
*(O si usaste el comando alternativo de Python: `python -m podman_compose down`)*

Esto detendrá de forma segura la base de datos, el backend y el frontend.

---

## 2. Exponer el proyecto a internet con ngrok

Para que tus amigos puedan jugar, debes exponer **tanto el Backend como el Frontend**, ya que el navegador del cliente (Frontend) necesita comunicarse con la API/WebSockets (Backend).

### Paso 1: Exponer el Backend
Abre una terminal y ejecuta:
```bash
ngrok http 4000
```
Copia la URL segura que genera ngrok (ejemplo: `https://abcd-1234.ngrok-free.app`).

### Paso 2: Configurar el Frontend
Abre el archivo `docker-compose.yml` y actualiza la variable de entorno del frontend con la URL del backend que obtuviste en el paso anterior:
```yaml
  frontend:
    # ...
    environment:
      - REACT_APP_BACKEND_URL=https://abcd-1234.ngrok-free.app 
```

### Paso 3: Exponer el Frontend
Abre una **segunda terminal** (no cierres la primera) y ejecuta:
```bash
ngrok http 3000
```
**Esta nueva URL es la que le compartirás a tus amigos** para que entren a jugar.

### Paso 4: Reiniciar los contenedores
Con el `docker-compose.yml` modificado, vuelve a levantar los contenedores para que el frontend tome la nueva configuración:
```bash
podman-compose up --build
```
*(Recuerda que si el comando anterior falla, puedes usar `python -m podman_compose up --build`)*


# ¿Cómo correr tu aplicación ahora?
Para tener la mejor y más rápida experiencia de desarrollo, debes correr los servicios divididos en dos terminales:

## Terminal 1 (Para Backend y BD):

Ejecuta: python -m podman_compose up --build
Verás que la base de datos se levanta primero y una vez esté lista (healthy), el backend se iniciará inmediatamente y de manera exitosa.

## Terminal 2 (Para el Frontend):

Entra a la carpeta del frontend: cd skull-king-module
Instala las dependencias (si no lo has hecho en tu PC): npm install
Inicia la app: npm start



---
# Terminal 1 (Para el Frontend):

Entra a la carpeta del frontend: cd skull-king-module
Instala las dependencias (si no lo has hecho en tu PC): npm install
Inicia la app: npm start

# Terminal 2 (Para el Backend):

Entra a la carpeta del backend: cd backend
Instala las dependencias (si no lo has hecho en tu PC): npm install
Inicia la app: npm start

# Terminal 3 (para la BD)
 podman start skull-king-web_db_1
 podman stop skull-king-web_db_1