import { createClient } from '@supabase/supabase-js'

// Conexión automática usando las variables que pusiste en Vercel
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

// ... (Configuración de Supabase arriba)

export default async function handler(req, res) {
    const { user_id, invited_by } = req.query;

    if (!user_id) return res.status(400).json({ error: "Falta ID" });

    // 1. Intentar obtener el usuario
    let { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', user_id)
        .single();

    // 2. SI EL USUARIO ES NUEVO (Aquí es donde se cuenta el referido)
    if (!user && !error) {
        // Creamos al usuario nuevo y le asignamos quién lo invitó
        const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert([{ 
                user_id: user_id, 
                balance: 0, 
                invested: 0, 
                referrals: 0,
                invited_by: invited_by || null // Guardamos el ID del que invitó
            }])
            .select()
            .single();

        user = newUser;

        // --- AQUÍ ESTÁ EL TRUCO PARA QUE CUENTE ---
        if (invited_by && invited_by !== "" && invited_by !== user_id) {
            // Buscamos al patrocinador y le sumamos +1 al contador de referrals
            const { data: sponsor } = await supabase
                .from('users')
                .select('referrals')
                .eq('user_id', invited_by)
                .single();

            if (sponsor) {
                await supabase
                    .from('users')
                    .update({ referrals: (sponsor.referrals || 0) + 1 })
                    .eq('user_id', invited_by);
            }
        }
    }

    return res.status(200).json(user);
                    }

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
          balance: 0.00, 
          invested: 0.00, 
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
// Lógica para procesar los 5 niveles de referidos
async function payReferralCommission(sponsorId, amount, level = 1) {
    const percentages = [0.08, 0.04, 0.015, 0.01, 0.005]; // 8%, 4%, 1.5%, 1%, 0.5%
    
    if (level > 5 || !sponsorId) return;

    const commission = amount * percentages[level - 1];

    // 1. Buscamos al patrocinador
    const { data: sponsor } = await supabase
        .from('users')
        .select('user_id, balance, invited_by')
        .eq('user_id', sponsorId)
        .single();

    if (sponsor) {
        // 2. Le sumamos su comisión
        await supabase
            .from('users')
            .update({ balance: sponsor.balance + commission })
            .eq('user_id', sponsorId);

        // 3. Saltamos al siguiente nivel (Recursividad)
        if (sponsor.invited_by) {
            await payReferralCommission(sponsor.invited_by, amount, level + 1);
        }
    }
}
