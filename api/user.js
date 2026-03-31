import { createClient } from '@supabase/supabase-js'

// Conexión automática usando las variables que pusiste en Vercel
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const { user_id, action, invited_by } = req.method === 'POST' ? req.body : req.query;

  if (!user_id) {
    return res.status(400).json({ error: "Falta el user_id" });
  }

  // --- LÓGICA PARA OBTENER DATOS (GET) ---
  if (req.method === 'GET') {
    // 1. Intentamos buscar al usuario en la base de datos
    let { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', user_id)
      .single();

    // 2. Si el usuario no existe, lo creamos con sus 50 USDT iniciales
    if (!user) {
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([{ 
          user_id: user_id, 
          balance: 50.00, 
          invested: 0, 
          referrals: 0 
        }])
        .select()
        .single();
      
      user = newUser;
    }

    return res.status(200).json(user);
  }

  // --- LÓGICA PARA REFERIDOS (POST) ---
  if (req.method === 'POST' && action === 'register_referral') {
    if (invited_by && invited_by !== user_id) {
      // Sumamos +1 referido al patrocinador
      await supabase.rpc('increment_referrals', { row_id: invited_by });
    }
    return res.status(200).json({ status: "success" });
  }
                 }
