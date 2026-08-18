// LAKOU SANTÉ — MÉDECINE — Mes dossiers : galerie personnelle, toutes bannières confondues

const MES_DOSSIERS_TABLES = [
  { name: 'memoires', label: 'Mémoire', titleField: 'titre', imageField: 'couverture_url' },
  { name: 'cas_cliniques', label: 'Cas clinique', titleField: 'titre', imageField: 'image_url' },
  { name: 'stages', label: 'Stage', titleField: 'hopital', imageField: 'photo_url' },
  { name: 'articles', label: 'Article', titleField: 'titre', imageField: 'image_url' },
  { name: 'collectifs', label: 'Collectif', titleField: 'nom', imageField: 'image_url' },
  { name: 'opportunites', label: 'Opportunité', titleField: 'titre', imageField: 'image_url' }
];

const STATUS_LABELS_MD = { en_attente: 'En attente', valide: 'Validé', rejete: 'Rejeté' };

(async function () {
  const { data: { session } } = await window.supabaseClient.auth.getSession();
  if (!session) { window.location.href = 'connexion.html'; return; }

  let rows = [];
  for (const t of MES_DOSSIERS_TABLES) {
    const { data } = await window.supabaseClient
      .from(t.name).select('*')
      .eq('author_id', session.user.id)
      .order('created_at', { ascending: false });
    (data || []).forEach(r => rows.push({
      type: t.label,
      title: r[t.titleField] || 'Sans titre',
      image: r[t.imageField],
      status: r.status,
      date: r.created_at
    }));
  }
  rows.sort((a, b) => new Date(b.date) - new Date(a.date));

  const grid = document.getElementById('mesDossiersGrid');
  const empty = document.getElementById('mesDossiersEmpty');

  if (!rows.length) {
    empty.style.display = 'block';
    return;
  }

  grid.innerHTML = rows.map(r => `
    <div class="entry-slot">
      <div class="slot-image">
        ${r.image ? `<img src="${r.image}" alt="">` : ''}
      </div>
      <div class="slot-title">${escapeHtmlMD(r.title)}</div>
      <div class="slot-meta">
        <span class="deposit-type">${r.type}</span>
        <span class="status-pill ${r.status}">${STATUS_LABELS_MD[r.status] || r.status}</span>
      </div>
    </div>
  `).join('');
})();

function escapeHtmlMD(str) {
  return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}
