// LAKOU SANTÉ — MÉDECINE — accueil : affiche les dépôts validés

document.addEventListener('DOMContentLoaded', async () => {
  if (!window.supabaseClient) return;
  await renderList('memoires', 'titre', 'memoires-grid', 'couverture_url',
    m => [m.annee, m.faculte].filter(Boolean).join(' — '));
  await renderList('cas_cliniques', 'titre', 'cas-grid', 'image_url',
    c => c.resume ? (c.resume.length > 80 ? c.resume.slice(0, 80) + '…' : c.resume) : '');
  await renderList('stages', 'hopital', 'stages-grid', 'photo_url',
    s => [s.service, s.ville].filter(Boolean).join(' — '));
});

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
