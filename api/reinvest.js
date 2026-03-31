import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { user_id, amount } = req.body;

  // 1. Obtenemos los datos actuales del usuario
  const { data: user } = await supabase
    .from('users')
    .select('balance, invested')
    .eq('user_id', user_id)
    .single();

  if (user && user.balance >= amount) {
    const nuevoBalance = user.balance - amount;
    const nuevaInversion = (user.invested || 0) + amount;

    // 2. GUARDAMOS EN SUPABASE
    const { error } = await supabase
      .from('users')
      .update({ 
        balance: nuevoBalance, 
        invested: nuevaInversion 
      })
      .eq('user_id', user_id);

    if (!error) {
      return res.status(200).json({ 
        status: "success", 
        balance: nuevoBalance, 
        invested: nuevaInversion 
      });
    }
  }
  
  return res.status(400).json({ status: "error", message: "Saldo insuficiente o error" });
}
