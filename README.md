# Marketing CRM Automation con IA

Sistema completo de automatización de marketing que combina IA (via AI SDK de Vercel) con workflows de n8n para procesar leads automáticamente.

## Características

- **Clasificación inteligente de leads**: La IA analiza el perfil y determina si es hot, warm o cold
- **Integración con CRM**: Crea contactos automáticamente via webhooks de n8n
- **Emails personalizados**: Envía mensajes de bienvenida según la campaña asignada
- **Seguimiento automático**: Agenda tareas de seguimiento en el CRM

## Arquitectura

\`\`\`
Usuario → Chat IA → Herramientas MCP → Webhooks n8n → CRM/Email
\`\`\`

### Herramientas MCP disponibles:

1. **clasificar_lead**: Analiza y clasifica el lead
2. **crear_contacto_crm**: Crea el contacto en el CRM
3. **enviar_email_bienvenida**: Envía email personalizado
4. **agendar_seguimiento**: Crea tarea de seguimiento

## Configuración

### 1. Variables de entorno

Copia `.env.example` a `.env.local` y configura:

\`\`\`bash
N8N_WEBHOOK_CREAR_CONTACTO=https://tu-n8n.com/webhook/crear-contacto
N8N_WEBHOOK_ENVIAR_EMAIL=https://tu-n8n.com/webhook/enviar-email
N8N_WEBHOOK_AGENDAR_SEGUIMIENTO=https://tu-n8n.com/webhook/agendar-seguimiento
N8N_API_KEY=tu-clave-secreta
\`\`\`

### 2. Configurar n8n

Necesitas crear 3 workflows en n8n (ver documentación completa en `/docs/n8n-setup.md`):

#### Workflow 1: Crear Contacto
- Webhook trigger en `/webhook/crear-contacto`
- Nodo para tu CRM (HubSpot, Pipedrive, Airtable, etc.)
- Respond to Webhook con `contacto_id`

#### Workflow 2: Enviar Email
- Webhook trigger en `/webhook/enviar-email`
- Nodo Switch para seleccionar template según campaña
- Nodo Send Email (Gmail, SendGrid, etc.)
- Respond to Webhook con `mensaje_id`

#### Workflow 3: Agendar Seguimiento
- Webhook trigger en `/webhook/agendar-seguimiento`
- Nodo para crear tarea en CRM
- Respond to Webhook con `tarea_id`

### 3. Instalar y ejecutar

\`\`\`bash
npm install
npm run dev
\`\`\`

Abre [http://localhost:3000](http://localhost:3000)

## Uso

Simplemente chatea con el asistente:

<img width="1301" height="788" alt="image" src="https://github.com/user-attachments/assets/9909bd1e-4df7-4c42-972d-a920bec4de69" />
<img width="1268" height="145" alt="image" src="https://github.com/user-attachments/assets/8a34e8d5-797d-45d9-a967-6cadfb8d073a" />

\`\`\`
"Tengo un nuevo contacto: María García de InnovateTech, 
interesada en automatización de marketing, presupuesto alto, 
email: maria@innovatetech.com"
\`\`\`

El sistema automáticamente:
1. Clasificará el lead (probablemente "hot")
2. Creará el contacto en tu CRM
3. Enviará email de bienvenida personalizado
4. Agendará seguimiento apropiado

## Próximos pasos

- [ ] Agregar dashboard para ver leads procesados
- [ ] Integrar con más CRMs nativamente
- [ ] Agregar análisis de sentimiento en la clasificación
- [ ] Implementar A/B testing de emails
- [ ] Agregar notificaciones en tiempo real

## Tecnologías

- **Next.js 15** con App Router
- **Vercel AI SDK** para tool calling
- **n8n** para automatización de workflows
- **TypeScript** para type safety
- **Tailwind CSS** para estilos
- **shadcn/ui** para componentes
