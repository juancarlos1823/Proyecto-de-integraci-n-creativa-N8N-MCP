# Configuración de n8n

Guía detallada para configurar los workflows de n8n que se integran con el sistema de IA.

## Instalación de n8n

### Opción 1: Docker (recomendado)

\`\`\`bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
\`\`\`

### Opción 2: npm

\`\`\`bash
npm install n8n -g
n8n start
\`\`\`

Accede a n8n en: http://localhost:5678

## Workflow 1: Crear Contacto en CRM

### Configuración paso a paso:

1. **Crear nuevo workflow** llamado "Crear Contacto CRM"

2. **Agregar nodo Webhook**
   - Method: POST
   - Path: `crear-contacto`
   - Authentication: Header Auth
     - Name: `x-api-key`
     - Value: `tu-clave-secreta`

3. **Agregar nodo Set** (formatear datos)
   \`\`\`javascript
   // Configuración del nodo Set
   {
     "nombre": "={{$json.nombre}}",
     "email": "={{$json.email}}",
     "empresa": "={{$json.empresa}}",
     "tipo_lead": "={{$json.tipo_lead}}",
     "campana": "={{$json.campana}}",
     "fecha_creacion": "={{$json.fecha_creacion}}"
   }
   \`\`\`

4. **Agregar nodo de tu CRM**
   
   **Opción A: HubSpot**
   - Operation: Create
   - Resource: Contact
   - Properties:
     - Email: `{{$json.email}}`
     - First Name: `{{$json.nombre.split(' ')[0]}}`
     - Last Name: `{{$json.nombre.split(' ').slice(1).join(' ')}}`
     - Company: `{{$json.empresa}}`
     - Lead Type: `{{$json.tipo_lead}}`
     - Campaign: `{{$json.campana}}`

   **Opción B: Airtable** (más simple para empezar)
   - Operation: Create
   - Base: Tu base de datos
   - Table: Contactos
   - Fields: mapear todos los campos

   **Opción C: Google Sheets** (para testing)
   - Operation: Append
   - Spreadsheet: Tu hoja de cálculo
   - Sheet: Contactos
   - Columns: A=nombre, B=email, C=empresa, etc.

5. **Agregar nodo Respond to Webhook**
   \`\`\`javascript
   {
     "contacto_id": "={{$json.id}}",
     "status": "created",
     "mensaje": "Contacto creado exitosamente"
   }
   \`\`\`

6. **Activar workflow** (toggle en la esquina superior derecha)

7. **Copiar URL del webhook** y agregarla a tu `.env.local`:
   \`\`\`
   N8N_WEBHOOK_CREAR_CONTACTO=https://tu-n8n.com/webhook/crear-contacto
   \`\`\`

## Workflow 2: Enviar Email de Bienvenida

### Configuración paso a paso:

1. **Crear nuevo workflow** llamado "Enviar Email Bienvenida"

2. **Agregar nodo Webhook**
   - Method: POST
   - Path: `enviar-email`
   - Authentication: Header Auth (misma clave)

3. **Agregar nodo Switch** (seleccionar template)
   - Mode: Rules
   - Rules:
     - Rule 1: `{{$json.campana}} = contacto_inmediato` → Output 1
     - Rule 2: `{{$json.campana}} = automation_mid_tier` → Output 2
     - Rule 3: `{{$json.campana}} = nurturing_basico` → Output 3

4. **Agregar 3 nodos Function** (uno por cada output del Switch)

   **Function 1: Template Contacto Inmediato**
   \`\`\`javascript
   const nombre = $input.item.json.nombre;
   const empresa = $input.item.json.personalizacion?.empresa || 'tu empresa';
   const interes = $input.item.json.personalizacion?.interes || 'nuestros servicios';

   return {
     subject: `¡Hola ${nombre}! Hablemos hoy mismo`,
     body: `
   Hola ${nombre},

   Vi que estás interesado en ${interes}.

   Como empresa ${empresa}, creo que podemos ayudarte de inmediato.

   ¿Tienes 15 minutos hoy o mañana para una llamada rápida?

   Saludos,
   Equipo de Ventas
     `.trim(),
     to: $input.item.json.email
   };
   \`\`\`

   **Function 2: Template Mid-Tier**
   \`\`\`javascript
   const nombre = $input.item.json.nombre;
   const empresa = $input.item.json.personalizacion?.empresa || 'tu empresa';
   const interes = $input.item.json.personalizacion?.interes || 'nuestros servicios';

   return {
     subject: `Bienvenido ${nombre} - Recursos sobre ${interes}`,
     body: `
   Hola ${nombre},

   Gracias por tu interés en ${interes}.

   Te he preparado algunos recursos que pueden ayudarte:
   - Guía completa de automatización
   - Case study de empresas similares a ${empresa}
   - Video demo de 5 minutos

   ¿Te gustaría agendar una demo personalizada?

   Saludos,
   Equipo de Marketing
     `.trim(),
     to: $input.item.json.email
   };
   \`\`\`

   **Function 3: Template Nurturing**
   \`\`\`javascript
   const nombre = $input.item.json.nombre;
   const interes = $input.item.json.personalizacion?.interes || 'nuestros servicios';

   return {
     subject: `Gracias por tu interés, ${nombre}`,
     body: `
   Hola ${nombre},

   Gracias por contactarnos sobre ${interes}.

   Te mantendremos informado con contenido útil y novedades.

   Mientras tanto, aquí tienes acceso a nuestro blog y recursos gratuitos.

   Saludos,
   Equipo
     `.trim(),
     to: $input.item.json.email
   };
   \`\`\`

5. **Agregar nodo Send Email** (conectar los 3 Functions aquí)
   
   **Opción A: Gmail**
   - From: tu-email@gmail.com
   - To: `{{$json.to}}`
   - Subject: `{{$json.subject}}`
   - Text: `{{$json.body}}`

   **Opción B: SendGrid**
   - API Key: tu clave de SendGrid
   - From: tu-email@tudominio.com
   - To: `{{$json.to}}`
   - Subject: `{{$json.subject}}`
   - Content: `{{$json.body}}`

6. **Agregar nodo Respond to Webhook**
   \`\`\`javascript
   {
     "email_enviado": true,
     "mensaje_id": "MSG-{{$now.format('YYYYMMDDHHmmss')}}",
     "mensaje": "Email enviado exitosamente"
   }
   \`\`\`

## Workflow 3: Agendar Seguimiento

### Configuración paso a paso:

1. **Crear nuevo workflow** llamado "Agendar Seguimiento"

2. **Agregar nodo Webhook**
   - Method: POST
   - Path: `agendar-seguimiento`
   - Authentication: Header Auth (misma clave)

3. **Agregar nodo Function** (calcular detalles)
   \`\`\`javascript
   const { contacto_id, dias_espera, tipo_seguimiento, notas, fecha_programada } = $input.item.json;

   let prioridad = 'medium';
   let duracion = 30;

   if (tipo_seguimiento === 'llamada') {
     prioridad = 'high';
     duracion = 15;
   } else if (tipo_seguimiento === 'demo') {
     prioridad = 'high';
     duracion = 45;
   }

   return {
     contacto_id,
     titulo: `${tipo_seguimiento.toUpperCase()}: Seguimiento contacto`,
     descripcion: notas || 'Seguimiento automático generado por IA',
     fecha_programada,
     prioridad,
     duracion_minutos: duracion
   };
   \`\`\`

4. **Agregar nodo de tu CRM** (crear tarea)
   
   **HubSpot:**
   - Resource: Task
   - Operation: Create
   - Subject: `{{$json.titulo}}`
   - Body: `{{$json.descripcion}}`
   - Due Date: `{{$json.fecha_programada}}`
   - Priority: `{{$json.prioridad}}`

   **Airtable:**
   - Table: Tareas
   - Fields:
     - Contacto ID: `{{$json.contacto_id}}`
     - Título: `{{$json.titulo}}`
     - Descripción: `{{$json.descripcion}}`
     - Fecha: `{{$json.fecha_programada}}`
     - Prioridad: `{{$json.prioridad}}`

5. **Agregar nodo Respond to Webhook**
   \`\`\`javascript
   {
     "tarea_id": "={{$json.id}}",
     "fecha_programada": "={{$json.fecha_programada}}",
     "mensaje": "Seguimiento agendado exitosamente"
   }
   \`\`\`

## Testing de Workflows

Usa estos comandos curl para probar cada workflow:

\`\`\`bash
# Test Crear Contacto
curl -X POST http://localhost:5678/webhook/crear-contacto \
  -H "Content-Type: application/json" \
  -H "x-api-key: tu-clave-secreta" \
  -d '{
    "nombre": "Test User",
    "email": "test@example.com",
    "empresa": "Test Corp",
    "tipo_lead": "warm",
    "campana": "automation_mid_tier",
    "fecha_creacion": "2025-10-19T00:00:00Z"
  }'

# Test Enviar Email
curl -X POST http://localhost:5678/webhook/enviar-email \
  -H "Content-Type: application/json" \
  -H "x-api-key: tu-clave-secreta" \
  -d '{
    "contacto_id": "CRM-123",
    "email": "test@example.com",
    "nombre": "Test User",
    "campana": "automation_mid_tier",
    "personalizacion": {
      "empresa": "Test Corp",
      "interes": "automatización"
    }
  }'

# Test Agendar Seguimiento
curl -X POST http://localhost:5678/webhook/agendar-seguimiento \
  -H "Content-Type: application/json" \
  -H "x-api-key: tu-clave-secreta" \
  -d '{
    "contacto_id": "CRM-123",
    "dias_espera": 7,
    "tipo_seguimiento": "llamada",
    "notas": "Seguimiento de prueba",
    "fecha_programada": "2025-10-26T10:00:00Z"
  }'
\`\`\`

## Seguridad

1. **Siempre usa autenticación** en los webhooks
2. **Genera una API key segura**:
   \`\`\`bash
   openssl rand -hex 32
   \`\`\`
3. **Usa HTTPS en producción** (n8n cloud o reverse proxy con SSL)
4. **Limita las IPs** que pueden acceder a tus webhooks si es posible

## Troubleshooting

### Error: "Webhook not found"
- Verifica que el workflow esté activado
- Revisa que la URL del webhook sea correcta

### Error: "Authentication failed"
- Verifica que la API key en `.env.local` coincida con n8n
- Revisa que el header sea `x-api-key` (minúsculas)

### Email no se envía
- Verifica las credenciales de tu proveedor de email
- Revisa los logs del nodo Send Email en n8n
- Prueba con un email de prueba primero

### CRM no crea el contacto
- Verifica las credenciales del CRM
- Revisa que los campos requeridos estén mapeados
- Usa Google Sheets primero para testing
