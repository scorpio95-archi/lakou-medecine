// LAKOU SANTÉ — MÉDECINE — tableau de bord par rôle

(async function () {
  const dashCard = document.getElementById('dashCard');
  if (!dashCard) return;

  const { data: { session } } = await window.supabaseClient.auth.getSession();
  if (!session) { window.location.href = 'connexion.html'; return; }

  const { data: profile } = await window.supabaseClient
    .from('profiles')
    .select('full_name, role, faculte')
    .eq('id', session.user.id)
    .single();

  const role = profile?.role || 'etudiant';
  const roleLabels = { etudiant: 'Étudiant', enseignant: 'Enseignant', visiteur: 'Visiteur', admin: 'Admin' };

  document.getElementById('dashRole').textContent = roleLabels[role];
  document.getElementById('dashName').textContent = profile?.full_name || session.user.email;
  document.getElementById('dashEmail').textContent = session.user.email;

  document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    await window.supabaseClient.auth.signOut();
    window.location.href = 'connexion.html';
  });

  const content = document.getElementById('dashContent');

  if (role === 'visiteur') {
    content.insertAdjacentHTML('beforeend', `
      <div class="dash-block">
        <p class="dash-empty">Ton compte visiteur donne accès à la lecture. Les mémoires, cas et stages validés apparaissent sur la <a href="index.html">page d'accueil</a>.</p>
      </div>`);
    return;
  }

  await renderMyDeposits(session.user.id, content);

  if (role === 'enseignant' || role === 'admin') {
    await renderReviewQueue(content);
  }
  if (role === 'admin') {
    await renderRoleManager(content);
  }
})();

async function renderMyDeposits(uid, container) {
  const tables = [
    { name: 'memoires', label: 'Mémoire', field: 'titre' },
    { name: 'cas_cliniques', label: 'Cas clinique', field: 'titre' },
    { name: 'stages', label: 'Stage', field: 'hopital' },
    { name: 'articles', label: 'Article', field: 'titre' }
  ];
  let rows = [];
  for (const t of tables) {
    const { data } = await window.supabaseClient
      .from(t.name).select('id,status,created_at,' + t.field)
      .eq('author_id', uid).order('created_at', { ascending: false });
    (data || []).forEach(r => rows.push({ type: t.label, title: r[t.field], status: r.status, date: r.created_at }));
  }
  rows.sort((a, b) => new Date(b.date) - new Date(a.date));

  let html = `<div class="dash-block"><h2>Mes dépôts</h2>`;
  if (!rows.length) {
    html += `<p class="dash-empty">Rien déposé pour l'instant.</p>`;
  } else {
    html += `<div class="deposit-list">` + rows.map(r => `
      <div class="deposit-row">
        <div><span class="deposit-type">${r.type}</span><div class="deposit-title">${escapeHtmlD(r.title || 'Sans titre')}</div></div>
        <span class="status-pill ${r.status}">${r.status === 'valide' ? 'Validé' : 'En attente'}</span>
      </div>`).join('') + `</div>`;
  }
  html += `
    <div class="dash-links">
      <a class="btn-dossier" href="depot-memoire.html">+ Mémoire</a>
      <a class="btn-dossier" href="depot-cas.html">+ Cas clinique</a>
      <a class="btn-dossier" href="depot-stage.html">+ Stage</a>
      <a class="btn-dossier" href="depot-article.html">+ Article</a>
    </div>
  </div>`;
  container.insertAdjacentHTML('beforeend', html);
}

async function renderReviewQueue(container) {
  const tables = [
    { name: 'memoires', label: 'Mémoire', field: 'titre' },
    { name: 'cas_cliniques', label: 'Cas clinique', field: 'titre' },
    { name: 'stages', label: 'Stage', field: 'hopital' },
    { name: 'articles', label: 'Article', field: 'titre' }
  ];
  let pending = [];
  for (const t of tables) {
    const { data } = await window.supabaseClient
      .from(t.name).select('id,created_at,' + t.field)
      .eq('status', 'en_attente').order('created_at', { ascending: true });
    (data || []).forEach(r => pending.push({ table: t.name, type: t.label, title: r[t.field], id: r.id }));
  }

  let html = `<div class="dash-block"><h2>À valider</h2>`;
  if (!pending.length) {
    html += `<p class="dash-empty">Aucun dépôt en attente. Le dossier est à jour.</p>`;
  } else {
    html += `<div class="deposit-list">` + pending.map(p => `
      <div class="deposit-row">
        <div><span class="deposit-type">${p.type}</span><div class="deposit-title">${escapeHtmlD(p.title || 'Sans titre')}</div></div>
        <button class="btn-validate" data-table="${p.table}" data-id="${p.id}">Valider</button>
      </div>`).join('') + `</div>`;
  }
  html += `</div>`;
  container.insertAdjacentHTML('beforeend', html);

  container.querySelectorAll('.btn-validate').forEach(btn => {
    btn.addEventListener('click', async () => {
      btn.disabled = true; btn.textContent = '...';
      const { error } = await window.supabaseClient
        .from(btn.dataset.table).update({ status: 'valide' }).eq('id', btn.dataset.id);
      if (!error) btn.closest('.deposit-row').remove();
      else { btn.disabled = false; btn.textContent = 'Valider'; }
    });
  });
}

async function renderRoleManager(container) {
  const { data: profiles } = await window.supabaseClient
    .from('profiles').select('id, full_name, role').order('full_name');

  let html = `<div class="dash-block"><h2>Gestion des rôles</h2><div class="deposit-list">`;
  (profiles || []).forEach(p => {
    html += `
      <div class="deposit-row">
        <div class="deposit-title">${escapeHtmlD(p.full_name || '(sans nom)')}</div>
        <select class="role-select" data-id="${p.id}">
          ${['etudiant', 'enseignant', 'visiteur', 'admin'].map(r =>
            `<option value="${r}" ${r === p.role ? 'selected' : ''}>${r}</option>`).join('')}
        </select>
      </div>`;
  });
  html += `</div></div>`;
  container.insertAdjacentHTML('beforeend', html);

  container.querySelectorAll('.role-select').forEach(sel => {
    sel.addEventListener('change', async () => {
      await window.supabaseClient.from('profiles').update({ role: sel.value }).eq('id', sel.dataset.id);
    });
  });
}

function escapeHtmlD(str) {
  return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}
