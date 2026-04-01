import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  // Configuración de CORS para que tu web pueda hablar con la API
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Capturamos los datos (vengan por GET o por POST)
  const user_id = req.query.user_id || req.body?.user_id;
  const invited_by = req.query.invited_by || req.body?.invited_by;

  if (!user_id) {
    return res.status(400).json({ error: "Falta el user_id" });
  }

  try {
    // 1. Intentamos buscar al usuario en la base de datos
    let { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', String(user_id))
      .single();

    // 2. Si el usuario NO existe, lo creamos
    if (!user) {
      console.log(`Registrando nuevo usuario: ${user_id}. Invitado por: ${invited_by}`);
      
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([{ 
          user_id: String(user_id), 
          balance: 0.00, 
          invested: 0.00, 
          referrals: 0,
          invited_by: (invited_by && invited_by !== "null" && invited_by !== user_id) ? String(invited_by) : null
        }])
        .select()
        .single();

      if (createError) throw createError;
      user = newUser;

      // 3. LOGICA DE CONTEO: Si fue invitado por alguien, le sumamos el referido al "padre"
      if (user.invited_by) {
        const { data: sponsor } = await supabase
          .from('users')
          .select('referrals')
          .eq('user_id', user.invited_by)
          .single();

        if (sponsor) {
          await supabase
            .from('users')
            .update({ referrals: (sponsor.referrals || 0) + 1 })
            .eq('user_id', user.invited_by);
          console.log(`Referido sumado al sponsor: ${user.invited_by}`);
        }
      }
    }

    // 4. Respondemos con los datos del usuario (ya sea nuevo o existente)
    return res.status(200).json(user);

  } catch (err) {
    console.error("Error en la API:", err.message);
    return res.status(500).json({ error: err.message });
  }
        }
