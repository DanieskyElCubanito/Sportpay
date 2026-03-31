export default async function handler(req, res) {
  // Configuración de seguridad para que tu Mini App pueda leer la API
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const { user_id, action, invited_by } = req.body || req.query;

  // 1. Obtener datos del usuario (Aquí es donde recuperas tus 50 USDT)
  if (req.method === 'GET') {
    // Aquí consultarías tu base de datos real. 
    // Por ahora, devolvemos tus datos para que la App los muestre:
    return res.status(200).json({
      status: "success",
      balance: 50.00, 
      invested: 10.50,
      referrals: 3,
      userId: user_id
    });
  }

  // 2. Lógica de Referidos (POST)
  if (req.method === 'POST' && action === 'register_referral') {
    // Si 'invited_by' existe, sumas la recompensa en la base de datos
    return res.status(200).json({
      status: "success",
      message: `Referido registrado para el patrocinador: ${invited_by}`
    });
  }
}
