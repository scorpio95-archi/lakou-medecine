// LAKOU SANTÉ — MÉDECINE — page listing complète : Opportunités

const TYPE_LABELS_OPP = {
  stage: 'Stage', residence: 'Résidence', conference: 'Conférence', congres: 'Congrès', bourse: 'Bourse'
};

document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('opportunitesFullGrid');
  const empty = document.getElementById('opportunitesEmpty');
  if (!grid) return;

  const { data, error } = await window.supabaseClient
    .from('opportunites').select('*')
    .eq('status', 'valide')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error || !data || !data.length) {
    empty.style.display = 'block';
    return;
  }

  grid.innerHTML = data.map(item => `
    <div class="entry-slot">
      <div class="slot-image">
        ${item.image_url ? `<img src="${item.image_url}" alt="">` : ''}
      </div>
      <div class="slot-title">${escapeHtmlO(item.titre || 'Sans titre')}</div>
      <div class="slot-meta">${escapeHtmlO([TYPE_LABELS_OPP[item.type] || item.type, item.organisation].filter(Boolean).join(' — '))}</div>
    </div>
  `).join('');
});

function escapeHtmlO(str) {
  return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}
