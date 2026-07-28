// LAKOU SANTÉ — MÉDECINE — paramètres du profil
// Utilise toujours window.supabaseClient.

let currentSession = null;

(async function initParametres() {
  const { data: { session } } = await window.supabaseClient.auth.getSession();
  if (!session) { window.location.href = 'connexion.html'; return; }
  currentSession = session;

  const { data: profile } = await window.supabaseClient
    .from('profiles')
    .select('full_name, faculte, avatar_url')
    .eq('id', session.user.id)
    .single();

  document.getElementById('fullName').value = profile?.full_name || '';
  document.getElementById('faculte').value = profile?.faculte || '';

  const preview = document.getElementById('avatarPreview');
  const fallback = document.getElementById('avatarFallback');
  if (profile?.avatar_url) {
    preview.src = profile.avatar_url;
    preview.style.display = 'block';
    fallback.style.display = 'none';
  } else {
    fallback.textContent = (profile?.full_name || session.user.email || '?').charAt(0).toUpperCase();
  }
})();

function showParamMsg(id, text, type) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.className = 'auth-msg show ' + type;
}

document.getElementById('profileForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!currentSession) return;
  const btn = document.getElementById('profileBtn');
  btn.disabled = true; btn.textContent = 'Enregistrement...';

  try {
    let avatar_url;
    const avatarFile = document.getElementById('avatar').files[0];
    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop();
      const path = `avatars/${currentSession.user.id}.${ext}`;
      const { error: upErr } = await window.supabaseClient.storage
        .from('medecine-fichiers')
        .upload(path, avatarFile, { upsert: true });
      if (upErr) throw upErr;
      avatar_url = window.supabaseClient.storage.from('medecine-fichiers').getPublicUrl(path).data.publicUrl;
    }

    const updates = {
      full_name: document.getElementById('fullName').value.trim(),
      faculte: document.getElementById('faculte').value.trim()
    };
    if (avatar_url) updates.avatar_url = avatar_url;

    const { error } = await window.supabaseClient
      .from('profiles').update(updates).eq('id', currentSession.user.id);
    if (error) throw error;

    showParamMsg('profileMsg', 'Profil mis à jour.', 'ok');
    if (avatar_url) {
      const preview = document.getElementById('avatarPreview');
      preview.src = avatar_url;
      preview.style.display = 'block';
      document.getElementById('avatarFallback').style.display = 'none';
    }
  } catch (err) {
    showParamMsg('profileMsg', err.message || 'Une erreur est survenue.', 'error');
  } finally {
    btn.disabled = false; btn.textContent = 'Enregistrer';
  }
});

document.getElementById('passwordForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('passwordBtn');
  const newPassword = document.getElementById('newPassword').value;

  btn.disabled = true; btn.textContent = 'Mise à jour...';
  const { error } = await window.supabaseClient.auth.updateUser({ password: newPassword });
  btn.disabled = false; btn.textContent = 'Mettre à jour';

  if (error) {
    showParamMsg('passwordMsg', error.message, 'error');
  } else {
    showParamMsg('passwordMsg', 'Mot de passe mis à jour.', 'ok');
    document.getElementById('passwordForm').reset();
  }
});
