import { getUserById, registerUser } from '../../services/userService.js';

export default async function handler(req, res) {
  // Configuración de CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const user_id = req.query.user_id || req.body?.user_id;
  const invited_by = req.query.invited_by || req.body?.invited_by;

  if (!user_id) {
    return res.status(400).json({ error: "Falta el user_id" });
  }

  try {
    // 1. Buscamos si existe
    let user = await getUserById(user_id);

    // 2. Si no existe, lo registramos usando el servicio separado
    if (!user) {
      user = await registerUser(user_id, invited_by);
    }

    return res.status(200).json(user);

  } catch (err) {
    console.error("Error en API auth:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
