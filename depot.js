// LAKOU SANTÉ — MÉDECINE — dépôts (mémoires, cas cliniques, stages)
// Utilise toujours window.supabaseClient.

async function requireSession() {
  const { data: { session } } = await window.supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = 'connexion.html';
    return null;
  }
  return session;
}

async function uploadFile(file, folder) {
  if (!file) return null;
  const ext = file.name.split('.').pop();
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await window.supabaseClient.storage
    .from('medecine-fichiers')
    .upload(path, file);
  if (error) throw error;
  const { data } = window.supabaseClient.storage.from('medecine-fichiers').getPublicUrl(path);
  return data.publicUrl;
}

function showDepotMsg(text, type) {
  const el = document.getElementById('depotMsg');
  if (!el) return;
  el.textContent = text;
  el.className = 'auth-msg show ' + type;
}

// ---------- DÉPÔT MÉMOIRE ----------
const memoireForm = document.getElementById('memoireForm');
if (memoireForm) {
  (async () => { await requireSession(); })();

  memoireForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    const session = await requireSession();
    if (!session) return;

    btn.disabled = true; btn.textContent = 'Envoi...';
    try {
      const couvertureFile = document.getElementById('couverture').files[0];
      const fichierFile = document.getElementById('fichier').files[0];
      const couverture_url = await uploadFile(couvertureFile, 'memoires/couvertures');
      const fichier_url = await uploadFile(fichierFile, 'memoires/documents');

      const { error } = await window.supabaseClient.from('memoires').insert({
        author_id: session.user.id,
        titre: document.getElementById('titre').value.trim(),
        annee: parseInt(document.getElementById('annee').value) || null,
        faculte: document.getElementById('faculte').value.trim(),
        specialite: document.getElementById('specialite').value.trim(),
        resume: document.getElementById('resume').value.trim(),
        couverture_url,
        fichier_url
      });
      if (error) throw error;

      showDepotMsg('Mémoire déposé. Il apparaîtra dès validation.', 'ok');
      memoireForm.reset();
      setTimeout(() => window.location.href = 'dashboard.html', 1400);
    } catch (err) {
      showDepotMsg(err.message || 'Une erreur est survenue.', 'error');
    } finally {
      btn.disabled = false; btn.textContent = 'Déposer le mémoire';
    }
  });
}

// ---------- DÉPÔT CAS CLINIQUE ----------
const casForm = document.getElementById('casForm');
if (casForm) {
  (async () => { await requireSession(); })();

  casForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    const session = await requireSession();
    if (!session) return;

    btn.disabled = true; btn.textContent = 'Envoi...';
    try {
      const imageFile = document.getElementById('image').files[0];
      const image_url = await uploadFile(imageFile, 'cas');

      const { error } = await window.supabaseClient.from('cas_cliniques').insert({
        author_id: session.user.id,
        titre: document.getElementById('titre').value.trim(),
        resume: document.getElementById('resume').value.trim(),
        image_url
      });
      if (error) throw error;

      showDepotMsg('Cas déposé. Il apparaîtra dès validation.', 'ok');
      casForm.reset();
      setTimeout(() => window.location.href = 'dashboard.html', 1400);
    } catch (err) {
      showDepotMsg(err.message || 'Une erreur est survenue.', 'error');
    } finally {
      btn.disabled = false; btn.textContent = 'Présenter le cas';
    }
  });
}

// ---------- DÉPÔT STAGE ----------
const stageForm = document.getElementById('stageForm');
if (stageForm) {
  (async () => { await requireSession(); })();

  stageForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    const session = await requireSession();
    if (!session) return;

    btn.disabled = true; btn.textContent = 'Envoi...';
    try {
      const photoFile = document.getElementById('photo').files[0];
      const photo_url = await uploadFile(photoFile, 'stages');

      const { error } = await window.supabaseClient.from('stages').insert({
        author_id: session.user.id,
        hopital: document.getElementById('hopital').value.trim(),
        service: document.getElementById('service').value.trim(),
        ville: document.getElementById('ville').value.trim(),
        periode: document.getElementById('periode').value.trim(),
        notes: document.getElementById('notes').value.trim(),
        photo_url
      });
      if (error) throw error;

      showDepotMsg('Stage ajouté. Il apparaîtra dès validation.', 'ok');
      stageForm.reset();
      setTimeout(() => window.location.href = 'dashboard.html', 1400);
    } catch (err) {
      showDepotMsg(err.message || 'Une erreur est survenue.', 'error');
    } finally {
      btn.disabled = false; btn.textContent = 'Ajouter le stage';
    }
  });
}
