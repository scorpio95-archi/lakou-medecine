// LAKOU SANTÉ — MÉDECINE — page listing complète : Collectifs & Promotions

const TYPE_LABELS_COL = { promotion: 'Promotion', association: 'Association', ong: 'ONG', club: 'Club' };

document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('collectifsFullGrid');
  const empty = document.getElementById('collectifsEmpty');
  if (!grid) return;

  const { data, error } = await window.supabaseClient
    .from('collectifs').select('*')
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
      <div class="slot-title">${escapeHtmlC(item.nom || 'Sans titre')}</div>
      <div class="slot-meta">${escapeHtmlC([TYPE_LABELS_COL[item.type] || item.type, item.annee].filter(Boolean).join(' — '))}</div>
    </div>
  `).join('');
});

function escapeHtmlC(str) {
  return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}
