export default async function handler(req, res) {
  // Solo aceptamos POST para proteger tus datos
  if (req.method !== 'POST') {
    return res.status(405).json({ status: "error", message: "Método no permitido" });
  }

  const { user_id, amount } = req.body;

  // Validación rápida
  if (!user_id || !amount) {
    return res.status(400).json({ status: "error", message: "Faltan datos" });
  }

  // Aquí es donde conectaríamos la base de datos para recuperar tus 50
  // Por ahora, simulamos la respuesta exitosa
  const bonus = parseFloat(amount) * 0.05;

  return res.status(200).json({
    status: "success",
    balance: 0, // Tras reinvertir
    invested: parseFloat(amount) + bonus,
    message: "¡Reinversión exitosa!"
  });
}
