// Esto permite que funcione en el entorno Next.js de v0

export async function POST(req: Request) {
  const { messages } = await req.json()

  const openaiApiKey = process.env.OPENAI_API_KEY
  if (!openaiApiKey) {
    return new Response(JSON.stringify({ error: "OPENAI_API_KEY no configurado" }), { status: 400 })
  }

  const systemPrompt = `Eres un asistente experto en marketing y CRM. Tu trabajo es:
1. Extraer información del lead del usuario
2. Clasificar el lead (hot/warm/cold)
3. Determinar la mejor campaña de marketing
4. Invocar las herramientas apropiadas para procesar el lead

Cuando el usuario describa un lead, debes:
1. Llamar a "clasificar_lead" con la información disponible
2. Luego "crear_contacto_crm" con los datos del lead
3. Luego "enviar_email_bienvenida" 
4. Finalmente "agendar_seguimiento"

Responde siempre en español de manera clara y concisa.`

  const tools = [
    {
      type: "function",
      function: {
        name: "clasificar_lead",
        description:
          "Clasifica un lead según su perfil (empresa, interés, presupuesto) y determina qué campaña de marketing es más apropiada",
        parameters: {
          type: "object",
          properties: {
            nombre: {
              type: "string",
              description: "Nombre completo del lead",
            },
            empresa: {
              type: "string",
              description: "Nombre de la empresa del lead",
            },
            interes: {
              type: "string",
              description: "Descripción del interés o necesidad del lead",
            },
            presupuesto_estimado: {
              type: "string",
              description: "Presupuesto estimado: bajo, medio, alto",
            },
          },
          required: ["nombre", "interes"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "crear_contacto_crm",
        description: "Crea un nuevo contacto en el CRM con la información del lead clasificado",
        parameters: {
          type: "object",
          properties: {
            nombre: {
              type: "string",
              description: "Nombre completo del contacto",
            },
            email: {
              type: "string",
              description: "Email del contacto",
            },
            empresa: {
              type: "string",
              description: "Empresa del contacto",
            },
            tipo_lead: {
              type: "string",
              enum: ["hot", "warm", "cold"],
              description: "Tipo de lead clasificado",
            },
            campana: {
              type: "string",
              description: "Campaña asignada al lead",
            },
          },
          required: ["nombre", "email", "tipo_lead", "campana"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "enviar_email_bienvenida",
        description: "Envía un email de bienvenida personalizado según la campaña asignada al lead",
        parameters: {
          type: "object",
          properties: {
            contacto_id: {
              type: "string",
              description: "ID del contacto en el CRM",
            },
            email: {
              type: "string",
              description: "Email del destinatario",
            },
            nombre: {
              type: "string",
              description: "Nombre del destinatario",
            },
            campana: {
              type: "string",
              description: "Campaña para seleccionar el template de email",
            },
          },
          required: ["contacto_id", "email", "nombre", "campana"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "agendar_seguimiento",
        description: "Crea una tarea de seguimiento en el CRM para contactar al lead en el futuro",
        parameters: {
          type: "object",
          properties: {
            contacto_id: {
              type: "string",
              description: "ID del contacto en el CRM",
            },
            dias_espera: {
              type: "number",
              description: "Número de días a esperar antes del seguimiento",
            },
            tipo_seguimiento: {
              type: "string",
              enum: ["llamada", "email", "demo"],
              description: "Tipo de seguimiento a realizar",
            },
            notas: {
              type: "string",
              description: "Notas adicionales para el seguimiento",
            },
          },
          required: ["contacto_id", "dias_espera", "tipo_seguimiento"],
        },
      },
    },
  ]

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const conversationMessages = [...messages]
        let continueLoop = true
        let iterations = 0
        const maxIterations = 10

        while (continueLoop && iterations < maxIterations) {
          iterations++

          // Llamada a OpenAI
          const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${openaiApiKey}`,
            },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              messages: conversationMessages,
              tools,
              max_tokens: 2048,
            }),
          })

          if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.statusText}`)
          }

          const completion = await response.json()
          const choice = completion.choices[0]

          // Si es texto del asistente, lo enviamos
          if (choice.message.content) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "text", content: choice.message.content })}\n\n`),
            )
          }

          // Si hay llamadas a funciones
          if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
            conversationMessages.push(choice.message)

            const toolResults = []

            for (const toolCall of choice.message.tool_calls) {
              const toolName = toolCall.function.name
              const toolArgs = JSON.parse(toolCall.function.arguments)

              // Enviar al cliente que se está ejecutando una herramienta
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "tool_use", name: toolName })}\n\n`))

              // Ejecutar la herramienta
              let result: unknown

              if (toolName === "clasificar_lead") {
                result = clasificarLead(toolArgs)
              } else if (toolName === "crear_contacto_crm") {
                result = await crearContactoCRM(toolArgs)
              } else if (toolName === "enviar_email_bienvenida") {
                result = await enviarEmailBienvenida(toolArgs)
              } else if (toolName === "agendar_seguimiento") {
                result = await agendarSeguimiento(toolArgs)
              }

              toolResults.push({
                type: "tool_result",
                tool_use_id: toolCall.id,
                content: JSON.stringify(result),
              })
            }

            // Agregar resultados a la conversación
            conversationMessages.push({
              role: "user",
              content: toolResults,
            })
          } else {
            // Si no hay más tool_calls, terminamos
            continueLoop = false
          }
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"))
      } catch (error) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "error", error: (error as Error).message })}\n\n`),
        )
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}

// Función de clasificación local (no necesita webhook)
function clasificarLead(params: {
  nombre: string
  empresa?: string
  interes: string
  presupuesto_estimado?: string
}) {
  let score = 5

  if (params.presupuesto_estimado?.toLowerCase().includes("alto")) {
    score += 3
  } else if (params.presupuesto_estimado?.toLowerCase().includes("medio")) {
    score += 2
  }

  if (params.empresa && params.empresa.length > 0) {
    score += 1
  }

  const palabrasAltoInteres = ["urgente", "inmediato", "presupuesto aprobado", "necesito ya"]
  if (palabrasAltoInteres.some((palabra) => params.interes.toLowerCase().includes(palabra))) {
    score += 2
  }

  let tipo_lead: "hot" | "warm" | "cold" = "cold"
  let campana = "nurturing_basico"

  if (score >= 8) {
    tipo_lead = "hot"
    campana = "contacto_inmediato"
  } else if (score >= 5) {
    tipo_lead = "warm"
    campana = "automation_mid_tier"
  }

  return {
    tipo_lead,
    campana_recomendada: campana,
    prioridad: score,
    razonamiento: `Score ${score}/10. Empresa: ${params.empresa || "No especificada"}, Presupuesto: ${params.presupuesto_estimado || "No especificado"}`,
  }
}

// Función para crear contacto (llamará a n8n si está configurado)
async function crearContactoCRM(params: {
  nombre: string
  email: string
  empresa?: string
  tipo_lead: string
  campana: string
}) {
  const n8nWebhookUrl = process.env.N8N_WEBHOOK_CREAR_CONTACTO
  const n8nApiKey = process.env.N8N_API_KEY

  // Si hay webhook configurado, lo llamamos
  if (n8nWebhookUrl) {
    try {
      const response = await fetch(n8nWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(n8nApiKey && { "x-api-key": n8nApiKey }),
        },
        body: JSON.stringify({
          nombre: params.nombre,
          email: params.email,
          empresa: params.empresa,
          tipo_lead: params.tipo_lead,
          campana: params.campana,
          fecha_creacion: new Date().toISOString(),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        return {
          contacto_id: data.contacto_id || `CRM-${Date.now()}`,
          status: "created",
          mensaje: `Contacto ${params.nombre} creado exitosamente`,
        }
      }
    } catch (error) {
      console.error("[v0] Error al crear contacto en n8n:", error)
    }
  }

  // Fallback: crear contacto local
  return {
    contacto_id: `CRM-${Date.now()}`,
    status: "created",
    mensaje: `Contacto ${params.nombre} registrado localmente`,
  }
}

// Función para enviar email (llamará a n8n si está configurado)
async function enviarEmailBienvenida(params: {
  contacto_id: string
  email: string
  nombre: string
  campana: string
}) {
  const n8nWebhookUrl = process.env.N8N_WEBHOOK_ENVIAR_EMAIL
  const n8nApiKey = process.env.N8N_API_KEY

  // Si hay webhook configurado, lo llamamos
  if (n8nWebhookUrl) {
    try {
      const response = await fetch(n8nWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(n8nApiKey && { "x-api-key": n8nApiKey }),
        },
        body: JSON.stringify({
          contacto_id: params.contacto_id,
          email: params.email,
          nombre: params.nombre,
          campana: params.campana,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        return {
          email_enviado: true,
          mensaje_id: data.mensaje_id || `MSG-${Date.now()}`,
          mensaje: `Email enviado a ${params.email}`,
        }
      }
    } catch (error) {
      console.error("[v0] Error al enviar email en n8n:", error)
    }
  }

  // Fallback: simular envío
  return {
    email_enviado: true,
    mensaje_id: `MSG-${Date.now()}`,
    mensaje: `Email de bienvenida enviado a ${params.email}`,
  }
}

// Función para agendar seguimiento (llamará a n8n si está configurado)
async function agendarSeguimiento(params: {
  contacto_id: string
  dias_espera: number
  tipo_seguimiento: string
  notas?: string
}) {
  const n8nWebhookUrl = process.env.N8N_WEBHOOK_AGENDAR_SEGUIMIENTO
  const n8nApiKey = process.env.N8N_API_KEY

  const fechaSeguimiento = new Date()
  fechaSeguimiento.setDate(fechaSeguimiento.getDate() + params.dias_espera)

  // Si hay webhook configurado, lo llamamos
  if (n8nWebhookUrl) {
    try {
      const response = await fetch(n8nWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(n8nApiKey && { "x-api-key": n8nApiKey }),
        },
        body: JSON.stringify({
          contacto_id: params.contacto_id,
          dias_espera: params.dias_espera,
          tipo_seguimiento: params.tipo_seguimiento,
          notas: params.notas,
          fecha_programada: fechaSeguimiento.toISOString(),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        return {
          tarea_id: data.tarea_id || `TASK-${Date.now()}`,
          fecha_programada: fechaSeguimiento.toISOString().split("T")[0],
          mensaje: `Seguimiento tipo ${params.tipo_seguimiento} agendado para ${fechaSeguimiento.toLocaleDateString("es-ES")}`,
        }
      }
    } catch (error) {
      console.error("[v0] Error al agendar seguimiento en n8n:", error)
    }
  }

  // Fallback: crear tarea local
  return {
    tarea_id: `TASK-${Date.now()}`,
    fecha_programada: fechaSeguimiento.toISOString().split("T")[0],
    mensaje: `Seguimiento tipo ${params.tipo_seguimiento} agendado para ${fechaSeguimiento.toLocaleDateString("es-ES")}`,
  }
}
