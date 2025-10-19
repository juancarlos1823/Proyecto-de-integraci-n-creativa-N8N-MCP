const express = require("express");
const bodyParser = require("body-parser");
const app = express();
app.use(bodyParser.json());

// Define herramientas
const tools = [
  {
    name: "clasificar_lead",
    description: "Clasifica el tipo de lead según su mensaje",
    parameters: { nombre: "string", empresa: "string", mensaje: "string" }
  }
];

// Endpoint para listar herramientas (descubrimiento MCP)
app.get("/mcp/tools", (req, res) => {
  res.json({ tools });
});

// Endpoint para ejecutar herramienta
app.post("/mcp/run", (req, res) => {
  const { name, args } = req.body;

  if (name === "clasificar_lead") {
    const mensaje = args.mensaje.toLowerCase();
    let categoria = "Otro";
    if (mensaje.includes("software")) categoria = "Tecnología";
    else if (mensaje.includes("consultoría")) categoria = "Consultoría";
    else if (mensaje.includes("marketing")) categoria = "Marketing";

    const prioridad = mensaje.includes("urgente") ? "Alta" : "Normal";
    res.json({ categoria, prioridad });
  } else {
    res.status(404).json({ error: "Herramienta no encontrada" });
  }
});

app.listen(3000, () => console.log("Servidor MCP corriendo en http://localhost:3000"));
