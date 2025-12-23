# 🏆 GARKAWARDS - FIFA Event Manager

Sistema de gestión de eventos FIFA con seguimiento de "garkas" (ausencias/mala conducta) y podio de rankings.

## 🚀 Características

- ✅ Creación y gestión de eventos FIFA
- 🏆 Podio con top 3 jugadores por año
- 👥 Sistema de "garkas" con avatares
- 🔒 Protección con código de acceso
- ☁️ Sincronización en tiempo real con Firebase
- 📱 Diseño responsivo

## 📋 Configuración de Firebase

### 1. Crear Proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Haz clic en "Agregar proyecto" o "Add project"
3. Ingresa un nombre (ej: "garkawards-fifa")
4. Desactiva Google Analytics (opcional)
5. Haz clic en "Crear proyecto"

### 2. Configurar Firestore Database

1. En el menú lateral, ve a **Build > Firestore Database**
2. Haz clic en "Crear base de datos" o "Create database"
3. Selecciona **"Comenzar en modo de prueba"** (Start in test mode)
4. Elige una ubicación (ej: `us-central`, `southamerica-east1`)
5. Haz clic en "Habilitar"

⚠️ **IMPORTANTE**: Las reglas en modo de prueba permiten acceso público por 30 días. Después debes configurar reglas de seguridad.

### 3. Obtener Credenciales

1. En el menú lateral, ve a **⚙️ Configuración del proyecto** (Project Settings)
2. Desplázate hasta "Tus aplicaciones"
3. Haz clic en el ícono **</>** (Web)
4. Registra tu app con un nombre (ej: "garkawards-web")
5. **NO** marques "Firebase Hosting"
6. Copia las credenciales que aparecen

### 4. Configurar el Archivo

Abre el archivo `firebase-config.js` y reemplaza los valores:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

### 5. Configurar Reglas de Seguridad (Recomendado)

En Firebase Console, ve a **Firestore Database > Reglas** y reemplaza por:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /events/{eventId} {
      allow read: if true;  // Todos pueden leer
      allow write: if true; // Por ahora todos pueden escribir
      // TODO: Agregar autenticación para escribir
    }
  }
}
```

## 📦 Desplegar en Netlify

### Método 1: Drag & Drop (Manual)

1. Ve a [Netlify](https://app.netlify.com/)
2. Haz clic en "Add new site" > "Deploy manually"
3. **Arrastra toda la carpeta del proyecto** al área punteada
4. Espera que termine el despliegue
5. ¡Tu sitio estará en vivo!

### Método 2: Desde GitHub

1. Sube tu código a GitHub
2. En Netlify: "Add new site" > "Import from Git"
3. Conecta con GitHub y selecciona el repositorio
4. Configuración:
   - **Build command**: (dejar vacío)
   - **Publish directory**: `.`
5. Haz clic en "Deploy"

## 🔧 Estructura de Archivos

```
garkaward/
├── index.html              # Página principal
├── styles.css              # Estilos FIFA theme
├── script.js               # Lógica con Firebase
├── firebase-config.js      # Configuración Firebase ⚙️
├── config.json             # Código de acceso
├── persons.json            # Jugadores y avatares
├── netlify.toml            # Config despliegue
├── avatars/                # Imágenes de avatares
├── fondos/                 # Imagen de fondo
└── README.md               # Este archivo
```

## 🎮 Uso

1. **Crear Evento**: Completa el formulario en la parte inferior
2. **Agregar Garka**: Presiona "➕ Agregar Garka" en un evento
3. **Ver Podio**: El podio se actualiza automáticamente con el top 3
4. **Filtrar por Año**: Usa el selector de año en el podio
5. **Exportar/Importar**: Botones en la sección de eventos

## 🔒 Código de Acceso

El código está en `config.json`. Úsalo para:
- Crear eventos
- Agregar/eliminar garkas
- Eliminar eventos

**Código por defecto**: Revisa `config.json`

## 🌐 Sincronización

Con Firebase, todos los cambios se sincronizan **en tiempo real**:
- ✅ Los eventos se guardan en la nube
- ✅ Todos los dispositivos ven los mismos datos
- ✅ Actualizaciones instantáneas sin recargar

## 📱 Compatibilidad

- Chrome, Firefox, Safari, Edge
- Dispositivos móviles y tablets
- Requiere conexión a internet para Firebase

## 🛠️ Desarrollo Local

1. Asegúrate de configurar Firebase primero
2. Abre un servidor local:
   ```bash
   python -m http.server 8000
   ```
3. Ve a `http://localhost:8000`

## ⚠️ Notas Importantes

- Las reglas de Firebase en modo prueba expiran en 30 días
- Configura autenticación para producción
- Los avatares deben estar en la carpeta `avatars/`
- El código de acceso es solo una protección básica

## 📄 Licencia

Proyecto personal para gestión de eventos FIFA entre amigos.
