import { supabase } from '../config/supabase.js';

// Obtener datos básicos de un usuario
export async function getUserById(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('user_id', String(userId))
    .maybeSingle(); // Usamos maybeSingle para que no rompa si no existe
  
  if (error) throw error;
  return data;
}

// Registrar un usuario nuevo y gestionar su sponsor (padre)
export async function registerUser(userId, invitedBy) {
  const cleanInvitedBy = (invitedBy && invitedBy !== "null" && invitedBy !== String(userId)) ? String(invitedBy) : null;

  // 1. Insertar el nuevo usuario
  const { data: newUser, error: createError } = await supabase
    .from('users')
    .insert([{ 
      user_id: String(userId), 
      balance: 0.00, 
      invested: 0.00, 
      referrals: 0,
      invited_by: cleanInvitedBy
    }])
    .select()
    .single();

  if (createError) throw createError;

  // 2. Si tiene sponsor, sumarle un referido al padre
  if (cleanInvitedBy) {
    const { data: sponsor } = await supabase
      .from('users')
      .select('referrals')
      .eq('user_id', cleanInvitedBy)
      .single();

    if (sponsor) {
      await supabase
        .from('users')
        .update({ referrals: (sponsor.referrals || 0) + 1 })
        .eq('user_id', cleanInvitedBy);
    }
  }

  return newUser;
}

// Actualizar el balance general (sirve para invertir o para añadir recompensas de minería)
export async function updateUserBalance(userId, newBalance, newInvested = null) {
  const updateData = { balance: newBalance };
  if (newInvested !== null) updateData.invested = newInvested;

  const { error } = await supabase
    .from('users')
    .update(updateData)
    .eq('user_id', userId);

  if (error) throw error;
  return true;
}

// Registrar el reclamo de minería añadiendo la fecha
export async function claimMiningReward(userId, newBalance) {
  const { error } = await supabase
    .from('users')
    .update({ 
      balance: newBalance,
      last_claim_at: new Date().toISOString() 
    })
    .eq('user_id', userId);

  if (error) throw error;
  return true;
}
