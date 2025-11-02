import { ChatInterface } from "@/components/chat-interface"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Marketing CRM Automation</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Sistema inteligente que clasifica leads, crea contactos en CRM, envía emails personalizados y agenda
            seguimientos automáticamente
          </p>
        </div>

        <ChatInterface />

        <div className="grid md:grid-cols-3 gap-4 mt-8">
          <div className="p-4 rounded-lg bg-card border">
            <h3 className="font-semibold mb-2">1. Clasificación IA</h3>
            <p className="text-sm text-muted-foreground">
              Analiza el perfil del lead y determina si es hot, warm o cold
            </p>
          </div>
          <div className="p-4 rounded-lg bg-card border">
            <h3 className="font-semibold mb-2">2. Automatización CRM</h3>
            <p className="text-sm text-muted-foreground">Crea contactos y tareas automáticamente en tu CRM</p>
          </div>
          <div className="p-4 rounded-lg bg-card border">
            <h3 className="font-semibold mb-2">3. Email Personalizado</h3>
            <p className="text-sm text-muted-foreground">Envía emails de bienvenida según la campaña asignada</p>
          </div>
        </div>
      </div>
    </main>
  )
}
