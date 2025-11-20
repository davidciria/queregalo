# 📱 Mejoras para Móviles

## Cambios Implementados

### 1. **Sin Zoom en Móviles**
- Añadida meta etiqueta `user-scalable=no` para evitar zoom automático
- Configurado `viewport-fit=cover` para mejor aprovechamiento de pantalla
- Eliminado el comportamiento de doble-click para zoom

### 2. **Mejor Legibilidad**
- Reducidos tamaños de fuente apropiadamente para cada dispositivo
- Headers más compactos (padding reducido de 30px a 20px)
- Mejor espaciado entre elementos
- Font-size base de inputs aumentada a 16px (evita zoom automático en iOS)

### 3. **Interfaz Optimizada para Dedos**
- Botones con altura mínima de 44px (estándar iOS)
- Mejor espaciado entre botones (8px en móviles)
- Inputs con padding más generoso (14px)
- Eliminados estilos de navegador por defecto (`-webkit-appearance: none`)

### 4. **Diseño Responsivo Mejorado**
- Container sin márgenes en móviles (usa toda la anchura)
- Header sticky para fácil navegación
- Tarjetas de regalo optimizadas para pantallas pequeñas
- Mejor disposición de botones en móviles (apilados verticalmente)

### 5. **Acceso Rápido con URL + Usuario**
- La URL ahora incluye el nombre del usuario cuando accedes
- Formato: `http://localhost:3000/?group=GROUP_ID&user=NOMBRE`
- Ejemplo: `http://localhost:3000/?group=b28f5740&user=Juan`
- Al abrir el enlace, se carga automáticamente como ese usuario

### 6. **Optimizaciones iOS/Android**
- `-webkit-touch-callout: none` para mejor comportamiento en iOS
- `-webkit-user-select: none` para evitar selecciones accidentales
- `-webkit-font-smoothing: antialiased` para mejor renderización de fuentes
- `-webkit-tap-highlight-color: transparent` para quitar resaltado de taps

### 7. **Compatibilidad PWA**
- Añadidas meta etiquetas para hacer la app instalable en móviles
- `apple-mobile-web-app-capable: yes`
- `apple-mobile-web-app-status-bar-style: black-translucent`

## Breakpoints

- **768px y menos**: Se activan todas las mejoras móviles
- Container sin bordes redondeados
- Máximo de 1 columna para listas de usuarios
- Botones apilados verticalmente
- Mejor aprovechamiento del espacio

## Cómo Compartir URLs Rápidas

1. Una vez que entras como usuario, la URL se actualiza automáticamente
2. Aparece en la barra de direcciones como: `/?group=XXXXX&user=NOMBRE`
3. Puedes copiar y compartir directamente
4. Al abrir, carga automáticamente el grupo y el usuario

## Antes y Después

### Antes
- Zoom automático en inputs de 16px o menores
- Márgenes y padding grandes sin ajuste móvil
- Difícil de navegar en pantalla pequeña
- Sin acceso directo al usuario

### Después
- Sin zoom automático
- Interfaz limpia y compacta en móviles
- Fácil de navegar con dedos
- Acceso directo guardado en URL con usuario
- Mejor rendimiento en dispositivos antiguos

## Testing en Móvil

Para probar en tu móvil:
1. Abre `http://IP_DEL_SERVIDOR:3000` en tu móvil
2. Crea un grupo y un usuario
3. Copia la URL con el usuario (aparecerá automáticamente)
4. Comparte con alguien más
5. Abre el enlace desde otro dispositivo - cargará directo

## Notas

- Compatible con iOS 10+
- Compatible con Android 5+
- Funciona sin necesidad de PWA installer
- Responsive incluso en tablets
