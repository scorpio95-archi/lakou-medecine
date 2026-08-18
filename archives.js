// LAKOU SANTÉ — MÉDECINE — page listing complète : Archives académiques

document.addEventListener('DOMContentLoaded', async () => {
  await loadFullGrid('memoires', 'titre', 'memoiresFullGrid', 'memoiresEmpty', 'couverture_url',
    m => [m.annee, m.faculte].filter(Boolean).join(' — '));
  await loadFullGrid('cas_cliniques', 'titre', 'casFullGrid', 'casEmpty', 'image_url',
    c => c.resume ? (c.resume.length > 100 ? c.resume.slice(0, 100) + '…' : c.resume) : '');
});

async function loadFullGrid(table, titleField, gridId, emptyId, imageField, metaFn) {
  const grid = document.getElementById(gridId);
  const empty = document.getElementById(emptyId);
  if (!grid) return;

  const { data, error } = await window.supabaseClient
    .from(table).select('*')
    .eq('status', 'valide')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error || !data || !data.length) {
    if (empty) empty.style.display = 'block';
    return;
  }

  grid.innerHTML = data.map(item => `
    <div class="entry-slot">
      <div class="slot-image">
        ${item[imageField] ? `<img src="${item[imageField]}" alt="">` : ''}
      </div>
      <div class="slot-title">${escapeHtmlA(item[titleField] || 'Sans titre')}</div>
      <div class="slot-meta">${escapeHtmlA(metaFn(item))}</div>
    </div>
  `).join('');
}

function escapeHtmlA(str) {
  return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}
