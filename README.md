🛠️ Servidor MCP (Mínimo Producto con Capacidades) de Herramientas
Este proyecto implementa un servidor simple con Node.js y Express que actúa como un Mínimo Producto con Capacidades (MCP). Expone dos endpoints principales para el descubrimiento y la ejecución de "herramientas" o funciones que pueden ser consumidas por otro servicio o modelo, como un Large Language Model (LLM).

El ejemplo actual incluye una herramienta para la clasificación de leads.

🚀 Instalación y Ejecución
Sigue estos pasos para poner en marcha el servidor localmente:

Prerrequisitos
Node.js (versión recomendada LTS)

1. Inicialización del Proyecto
Si aún no lo tienes, crea un archivo package.json:
npm init -y

2. Instalación de Dependencias
Este proyecto solo requiere express y body-parser:
npm install express body-parser

3. Guardar el Código
Guarda el código proporcionado en un archivo llamado, por ejemplo, server.js.

4. Ejecución del Servidor
Inicia el servidor:
node server.js

El servidor estará corriendo en http://localhost:3000.
<img width="559" height="144" alt="image" src="https://github.com/user-attachments/assets/4a122463-d09a-4641-bcec-86fdb41c4cc7" />

⚙️ Endpoints de la API
El servidor expone dos endpoints bajo el prefijo /mcp:

1. Descubrimiento de Herramientas
Utiliza este endpoint para obtener la lista de herramientas disponibles y sus parámetros (similar al patrón de "descubrimiento de funciones" o tool calling):

Método,Ruta,Descripción
GET,/mcp/tools,Lista todas las herramientas disponibles.

Lógica de Clasificación de clasificar_lead:

Categoría: Basada en palabras clave en el mensaje:

"software" -> "Tecnología"

"consultoría" -> "Consultoría"

"marketing" -> "Marketing"

Cualquier otra cosa -> "Otro"

Prioridad: Si el mensaje incluye la palabra "urgente" se establece como "Alta", de lo contrario es "Normal".
