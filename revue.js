// LAKOU SANTÉ — MÉDECINE — page listing complète : Revue

document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('articlesFullGrid');
  const empty = document.getElementById('articlesEmpty');
  if (!grid) return;

  const { data, error } = await window.supabaseClient
    .from('articles').select('*')
    .eq('status', 'valide')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error || !data || !data.length) {
    empty.style.display = 'block';
    return;
  }

  grid.innerHTML = data.map(item => {
    const link = item.url || item.fichier_url;
    return `
    <a class="entry-slot" href="${link}" target="_blank" rel="noopener" style="text-decoration:none;">
      <div class="slot-image">
        ${item.image_url ? `<img src="${item.image_url}" alt="">` : ''}
      </div>
      <div class="slot-title">${escapeHtmlR(item.titre || 'Sans titre')}</div>
      <div class="slot-meta">${escapeHtmlR(item.resume || (item.url ? 'Lien externe' : 'Document'))}</div>
    </a>
  `;
  }).join('');
});

function escapeHtmlR(str) {
  return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}
