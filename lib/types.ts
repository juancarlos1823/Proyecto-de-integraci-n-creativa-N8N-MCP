export type TipoLead = "hot" | "warm" | "cold"

export type Campana = "contacto_inmediato" | "automation_mid_tier" | "nurturing_basico"

export type TipoSeguimiento = "llamada" | "email" | "demo"

export interface Lead {
  nombre: string
  empresa?: string
  interes: string
  presupuesto_estimado?: string
}

export interface ClasificacionLead {
  tipo_lead: TipoLead
  campana_recomendada: Campana
  prioridad: number
  razonamiento: string
}

export interface Contacto {
  contacto_id: string
  nombre: string
  email: string
  empresa?: string
  tipo_lead: TipoLead
  campana: Campana
  fecha_creacion: string
}

export interface EmailResult {
  email_enviado: boolean
  mensaje_id: string
  mensaje: string
}

export interface TareaSeguimiento {
  tarea_id: string
  contacto_id: string
  tipo_seguimiento: TipoSeguimiento
  fecha_programada: string
  notas?: string
}
