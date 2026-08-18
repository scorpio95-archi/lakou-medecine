// LAKOU SANTÉ — MÉDECINE — accueil : affiche les dépôts validés

document.addEventListener('DOMContentLoaded', async () => {
  if (!window.supabaseClient) return;
  await renderList('memoires', 'titre', 'memoires-grid', 'couverture_url',
    m => [m.annee, m.faculte].filter(Boolean).join(' — '));
  await renderList('cas_cliniques', 'titre', 'cas-grid', 'image_url',
    c => c.resume ? (c.resume.length > 80 ? c.resume.slice(0, 80) + '…' : c.resume) : '');
  await renderList('stages', 'hopital', 'stages-grid', 'photo_url',
    s => [s.service, s.ville].filter(Boolean).join(' — '));
  await renderList('collectifs', 'nom', 'collectifs-grid', 'image_url',
    c => [labelType(c.type), c.annee].filter(Boolean).join(' — '));
  await renderList('opportunites', 'titre', 'opportunites-grid', 'image_url',
    o => [labelType(o.type), o.organisation].filter(Boolean).join(' — '));
  await renderArticles();
  await renderAdminCard();
  await renderMenuAuthState();
});

async function renderMenuAuthState() {
  const guest = document.getElementById('menuGuest');
  const auth = document.getElementById('menuAuth');
  if (!guest || !auth) return;
  const { data: { session } } = await window.supabaseClient.auth.getSession();
  if (session) {
    guest.style.display = 'none';
    auth.style.display = 'block';
  } else {
    guest.style.display = 'block';
    auth.style.display = 'none';
  }
}

async function renderAdminCard() {
  const card = document.getElementById('adminCard');
  if (!card) return;

  const { data, error } = await window.supabaseClient
    .from('profiles')
    .select('full_name, faculte, avatar_url')
    .eq('role', 'admin')
    .limit(1)
    .maybeSingle();

  if (error || !data) return; // pas de RLS SELECT public sur profiles, ou pas encore d'admin

  const avatar = document.getElementById('adminAvatar');
  const fallback = document.getElementById('adminAvatarFallback');
  if (data.avatar_url) {
    avatar.src = data.avatar_url;
    avatar.style.display = 'block';
    fallback.style.display = 'none';
  } else {
    fallback.textContent = (data.full_name || 'A').charAt(0).toUpperCase();
  }

  document.getElementById('adminName').textContent = data.full_name || 'Administrateur';
  document.getElementById('adminFaculte').textContent = data.faculte || '';
  card.style.display = 'flex';
}

const TYPE_LABELS = {
  promotion: 'Promotion', association: 'Association', ong: 'ONG', club: 'Club',
  stage: 'Stage', residence: 'Résidence', conference: 'Conférence', congres: 'Congrès', bourse: 'Bourse'
};
function labelType(type) {
  return TYPE_LABELS[type] || type;
}

async function renderArticles() {
  const container = document.getElementById('articles-grid');
  if (!container) return;

  const { data, error } = await window.supabaseClient
    .from('articles').select('*')
    .eq('status', 'valide')
    .order('created_at', { ascending: false })
    .limit(6);

  if (error || !data || !data.length) return;

  container.innerHTML = data.map(item => {
    const link = item.url || item.fichier_url;
    return `
    <a class="entry-slot" href="${link}" target="_blank" rel="noopener" style="text-decoration:none;">
      <div class="slot-image">
        ${item.image_url ? `<img src="${item.image_url}" alt="">` : ''}
      </div>
      <div class="slot-title">${escapeHtmlH(item.titre || 'Sans titre')}</div>
      <div class="slot-meta">${escapeHtmlH(item.resume || (item.url ? 'Lien externe' : 'Document'))}</div>
    </a>
  `;
  }).join('');
}

async function renderList(table, titleField, containerId, imageField, metaFn) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const { data, error } = await window.supabaseClient
    .from(table).select('*')
    .eq('status', 'valide')
    .order('created_at', { ascending: false })
    .limit(6);

  if (error || !data || !data.length) return; // garde les emplacements réservés existants

  container.innerHTML = data.map(item => `
    <div class="entry-slot">
      <div class="slot-image">
        ${item[imageField] ? `<img src="${item[imageField]}" alt="">` : ''}
      </div>
      <div class="slot-title">${escapeHtmlH(item[titleField] || 'Sans titre')}</div>
      <div class="slot-meta">${escapeHtmlH(metaFn(item))}</div>
    </div>
  `).join('');
}

function escapeHtmlH(str) {
  return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}
