export default async function handler(req, res) {
  // SEGURIDAD: Solo tú puedes entrar (puedes usar un Token o tu ID de Telegram)
  const { admin_token } = req.query;
  if (admin_token !== "7517815832) {
    return res.status(401).json({ error: "No autorizado" });
  }

  try {
    // Aquí pides todos los datos a tu base de datos
    // Ejemplo ficticio de lo que devolvería:
    const users = [
      { id: "12345", balance: 50.00, invested: 100, referrals: 10 },
      { id: "67890", balance: 5.25, invested: 0, referrals: 2 }
    ];

    return res.status(200).json({ status: "success", data: users });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
