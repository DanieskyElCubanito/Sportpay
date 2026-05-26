import { getUserById, updateUserBalance, claimMiningReward } from '../../services/userService.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { action, user_id, amount, amount_to_add } = req.body;

  try {
    const user = await getUserById(user_id);
    if (!user) {
      return res.status(404).json({ status: "error", message: "Usuario no encontrado" });
    }

    // ACCIÓN A: PROCESAR INVERSIÓN (Tu primer fragmento)
    if (action === 'invest') {
      if (user.balance < amount) {
        return res.status(400).json({ status: "error", message: "Saldo insuficiente" });
      }

      const nuevoBalance = user.balance - amount;
      const nuevaInversion = (user.invested || 0) + amount;

      await updateUserBalance(user_id, nuevoBalance, nuevaInversion);

      return res.status(200).json({ 
        status: "success", 
        balance: nuevoBalance, 
        invested: nuevaInversion 
      });
    }

    // ACCIÓN B: RECLAMAR MINERÍA (Tu tercer fragmento)
    if (action === 'claim_mining') {
      const currentBalance = parseFloat(user.balance || 0);
      const reward = parseFloat(amount_to_add || 0);
      const newBalance = currentBalance + reward;

      await claimMiningReward(user_id, newBalance);

      return res.status(200).json({
          status: "success",
          new_balance: newBalance
      });
    }

    return res.status(400).json({ status: "error", message: "Acción no válida" });

  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
}
