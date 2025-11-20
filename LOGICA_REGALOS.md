# 🎁 Lógica de Regalos Bloqueados

## Cómo Funciona

### Escenario Completo

```
PASO 1: Juan crea lista de regalos
├─ "Auriculares" (50€)
├─ "Smartwatch" (200€)
└─ "Libro" (25€)

PASO 2: María ve regalos de Juan
├─ "Auriculares" → Botón "Quiero regalarlo"
├─ "Smartwatch" → Botón "Quiero regalarlo"
└─ "Libro" → Botón "Quiero regalarlo"

PASO 3: María bloquea "Auriculares"
├─ Base de datos: Auriculares.locked_by = María
├─ María VE: "Auriculares" con "✓ Tú estás regalando esto"
├─ Juan VE: "Auriculares" completamente normal (SIN cambios)
└─ Otros VEN: "Auriculares" con "🔒 Regalo bloqueado"

PASO 4: Alguien intenta bloquear "Auriculares"
└─ ERROR: "Este regalo ya fue asignado a otro usuario"
```

---

## Vista del Propietario (Juan)

### Mis Regalos
```
Mi lista de regalos (siempre igual):
├─ Auriculares - 50€
│  Dónde encontrarlo: amazon.es
│  [Eliminar]
│
├─ Smartwatch - 200€
│  Dónde encontrarlo: apple.com
│  [Eliminar]
│
└─ Libro - 25€
│  Dónde encontrarlo: fnac.es
│  [Eliminar]

+ Añadir Regalo
```

**Juan NUNCA sabe que sus regalos están bloqueados.**
**Para Juan, su lista es siempre igual, pase lo que pase.**

---

## Vista de Otros Usuarios (María, Pedro, etc)

### Regalos de Juan

#### Sin bloquear:
```
👤 Juan
├─ Auriculares - 50€
│  Dónde encontrarlo: amazon.es
│  [Quiero regalarlo]
│
└─ Smartwatch - 200€
   Dónde encontrarlo: apple.com
   [Quiero regalarlo]
```

#### Después de que María bloquea "Auriculares":
```
👤 Juan
├─ Auriculares - 50€
│  Dónde encontrarlo: amazon.es
│  🔒 Regalo bloqueado
│
└─ Smartwatch - 200€
   Dónde encontrarlo: apple.com
   [Quiero regalarlo]
```

**Los otros ven que está bloqueado, pero NO saben quién lo bloqueó.**

---

## Vista de Quien Bloqueó (María)

### Regalos de Juan (en sección "Regalos de tus amigos")
```
👤 Juan
├─ Auriculares - 50€
│  Dónde encontrarlo: amazon.es
│  ✓ Tú estás regalando esto
│  [Desbloquear]
│
└─ Smartwatch - 200€
   Dónde encontrarlo: apple.com
   [Quiero regalarlo]
```

**María VE claramente que ella está regalando los Auriculares.**
**Maria PUEDE desbloquear si cambia de opinión.**

---

## Lógica de Base de Datos

### Campo `locked_by`

```sql
gifts:
├─ id: "regalo1"
├─ user_id: "juan"     ← Propietario del regalo
├─ name: "Auriculares"
└─ locked_by: "maria"  ← Quién lo bloqueó (NULL si no está bloqueado)
```

### Estados Posibles

| Estado | locked_by | Quién ve qué |
|--------|-----------|--------------|
| **Desbloqueado** | NULL | Todos ven normal + botón "Quiero regalarlo" |
| **Bloqueado por María** | "maria" | Juan: normal \| María: "✓ Tú estás regalando" \| Otros: "🔒 Bloqueado" |

---

## Flujo de Código

### Cuando María hace clic "Quiero regalarlo"

```javascript
async lockGift(giftId) {
  // 1. Enviar solicitud al servidor con:
  //    - giftId: ID del regalo
  //    - lockedBy: ID de María

  // 2. Servidor verifica:
  //    - ¿El regalo existe?
  //    - ¿Ya está bloqueado?
  //    - ¿Por quién?

  // 3. Si todo OK:
  //    - Actualiza: locked_by = María
  //    - Respuesta: success

  // 4. Frontend:
  //    - Recarga datos
  //    - Re-renderiza
  //    - Muestra "✓ Tú estás regalando esto"
}
```

### Renderizado en Frontend

#### Mi lista (propietario):
```javascript
// Muestra TODOS los regalos sin filtrar
${this.state.myGifts.map(gift => `
  <div class="gift-card">
    <span>${gift.name}</span>
    <span>${gift.price}</span>
    <!-- SIN mostrar información de locked_by -->
  </div>
`)}
```

#### Regalos de otros:
```javascript
${gifts.map(gift => `
  <div class="gift-card">
    ${gift.locked_by ? `
      ${gift.locked_by === this.state.userId ? `
        ✓ Tú estás regalando esto
        [Desbloquear]
      ` : `
        🔒 Regalo bloqueado
      `}
    ` : `
      [Quiero regalarlo]
    `}
  </div>
`)}
```

---

## Protecciones en el Servidor

### Al Bloquear
```javascript
// 1. Verificar que el regalo existe
// 2. Verificar que NO está bloqueado por otro
// 3. Bloquear SOLO si sigue libre (SQL: WHERE locked_by IS NULL)
// 4. Si falla: error "Regalo ya asignado"
```

### Al Desbloquear
```javascript
// 1. Verificar que el regalo existe
// 2. Verificar que quien lo debloquea es quien lo bloqueó
// 3. Desbloquear
// 4. Si falla: error "Solo quien lo bloqueó puede desbloquearlo"
```

---

## Resumen Visual

```
JUAN (propietario):
┌─────────────────────┐
│ Mis Regalos        │
│ ─────────────────  │
│ • Auriculares 50€  │  ← Ve normal, sin saber
│ • Smartwatch 200€  │     que María lo bloqueó
│ • Libro 25€        │
└─────────────────────┘

MARÍA (la que bloquea):
┌──────────────────────────────────┐
│ Regalos de Juan                 │
│ ──────────────────────────────── │
│ • Auriculares 50€              │
│   ✓ Tú estás regalando esto    │ ← Lo ve claro
│   [Desbloquear]                │
│ • Smartwatch 200€              │
│   [Quiero regalarlo]           │
└──────────────────────────────────┘

PEDRO (otro usuario):
┌──────────────────────────────────┐
│ Regalos de Juan                 │
│ ──────────────────────────────── │
│ • Auriculares 50€              │
│   🔒 Regalo bloqueado          │ ← Ve que alguien
│ • Smartwatch 200€              │   lo bloqueó pero
│   [Quiero regalarlo]           │   no sabe quién
└──────────────────────────────────┘
```

---

## Beneficios

✅ **Sorpresa garantizada para Juan** - No sabe qué regalos le harán
✅ **Secreto garantizado para María** - Solo ella sabe qué va a comprar
✅ **Regalos visibles** - Juan ve su lista completa siempre
✅ **Control** - María puede desbloquear si cambia de opinión
✅ **Integridad** - No se puede bloquear el mismo regalo dos veces

---

**Status: ✅ LÓGICA CORRECTA IMPLEMENTADA**
