// LAKOU SANTÉ — MÉDECINE — page listing complète : Carnet de terrain

document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('stagesFullGrid');
  const empty = document.getElementById('stagesEmpty');
  if (!grid) return;

  const { data, error } = await window.supabaseClient
    .from('stages').select('*')
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
        ${item.photo_url ? `<img src="${item.photo_url}" alt="">` : ''}
      </div>
      <div class="slot-title">${escapeHtmlT(item.hopital || 'Sans titre')}</div>
      <div class="slot-meta">${escapeHtmlT([item.service, item.ville].filter(Boolean).join(' — '))}</div>
    </div>
  `).join('');
});

function escapeHtmlT(str) {
  return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}
