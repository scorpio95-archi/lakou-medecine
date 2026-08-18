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
        <p class="dash-empty">Ton compte visiteur donne accès à la lecture. Les mémoires, cas, stages, collectifs et opportunités validés apparaissent sur la <a href="index.html">page d'accueil</a>.</p>
      </div>`);
    return;
  }

  await renderMyDeposits(session.user.id, content);

  if (role === 'enseignant' || role === 'admin') {
    await renderReviewQueue(content);
  }
  if (role === 'admin') {
    await renderStatistiques(content);
    await renderRoleManager(content);
  }
})();

const DEPOT_TABLES = [
  { name: 'memoires', label: 'Mémoire', field: 'titre' },
  { name: 'cas_cliniques', label: 'Cas clinique', field: 'titre' },
  { name: 'stages', label: 'Stage', field: 'hopital' },
  { name: 'articles', label: 'Article', field: 'titre' },
  { name: 'collectifs', label: 'Collectif', field: 'nom' },
  { name: 'opportunites', label: 'Opportunité', field: 'titre' }
];

async function renderMyDeposits(uid, container) {
  let rows = [];
  for (const t of DEPOT_TABLES) {
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
      <a class="btn-dossier" href="depot-collectif.html">+ Collectif</a>
      <a class="btn-dossier" href="depot-opportunite.html">+ Opportunité</a>
    </div>
  </div>`;
  container.insertAdjacentHTML('beforeend', html);
}

async function renderReviewQueue(container) {
  let pending = [];
  for (const t of DEPOT_TABLES) {
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

async function renderStatistiques(container) {
  container.insertAdjacentHTML('beforeend', `
    <div class="dash-block" id="statsBlock">
      <h2>Statistiques</h2>
      <div class="stats-cards" id="statsCards"></div>
      <canvas id="statsChart" height="180"></canvas>
      <div class="dash-links">
        <button class="btn-dossier" id="sendReportBtn" type="button">Envoyer le rapport</button>
      </div>
      <div class="auth-msg" id="reportMsg"></div>
    </div>`);

  const today = new Date();
  const dayKeys = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    dayKeys.push(d.toISOString().slice(0, 10));
  }
  const depotBuckets = Object.fromEntries(dayKeys.map(k => [k, 0]));
  const inscritBuckets = Object.fromEntries(dayKeys.map(k => [k, 0]));
  const since = dayKeys[0] + 'T00:00:00Z';

  const { count: totalInscrits } = await window.supabaseClient
    .from('profiles').select('*', { count: 'exact', head: true });

  const { data: recentProfiles } = await window.supabaseClient
    .from('profiles').select('created_at').gte('created_at', since);
  (recentProfiles || []).forEach(p => {
    const day = (p.created_at || '').slice(0, 10);
    if (day in inscritBuckets) inscritBuckets[day]++;
  });

  const statusTotals = { en_attente: 0, valide: 0, rejete: 0 };
  for (const t of DEPOT_TABLES) {
    const { data } = await window.supabaseClient.from(t.name).select('status, created_at');
    (data || []).forEach(r => {
      if (statusTotals[r.status] !== undefined) statusTotals[r.status]++;
      const day = (r.created_at || '').slice(0, 10);
      if (day in depotBuckets) depotBuckets[day]++;
    });
  }

  document.getElementById('statsCards').innerHTML = `
    <div class="stat-card"><span class="stat-num">${totalInscrits || 0}</span><span class="stat-label">Inscrits</span></div>
    <div class="stat-card"><span class="stat-num">${statusTotals.en_attente}</span><span class="stat-label">En attente</span></div>
    <div class="stat-card"><span class="stat-num">${statusTotals.valide}</span><span class="stat-label">Validés</span></div>
    <div class="stat-card"><span class="stat-num">${statusTotals.rejete}</span><span class="stat-label">Rejetés</span></div>
  `;

  await loadChartJs();
  const labels = dayKeys.map(k => k.slice(5).split('-').reverse().join('/'));
  new Chart(document.getElementById('statsChart'), {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Dépôts', data: dayKeys.map(k => depotBuckets[k]), borderColor: '#5b8fa8', backgroundColor: 'rgba(91,143,168,0.15)', tension: 0.3, fill: true },
        { label: 'Inscriptions', data: dayKeys.map(k => inscritBuckets[k]), borderColor: '#e8a33d', backgroundColor: 'rgba(232,163,61,0.12)', tension: 0.3, fill: true }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: '#241f18', font: { family: 'Courier Prime', size: 10 } } } },
      scales: {
        x: { ticks: { color: '#6b6152', font: { size: 9 } } },
        y: { beginAtZero: true, ticks: { color: '#6b6152', precision: 0 } }
      }
    }
  });

  document.getElementById('sendReportBtn').addEventListener('click', async () => {
    const btn = document.getElementById('sendReportBtn');
    const msg = document.getElementById('reportMsg');
    btn.disabled = true; btn.textContent = 'Envoi...';
    const { error } = await window.supabaseClient.functions.invoke('send-dashboard-report');
    btn.disabled = false; btn.textContent = 'Envoyer le rapport';
    if (error) {
      msg.textContent = error.message || "Erreur lors de l'envoi.";
      msg.className = 'auth-msg show error';
    } else {
      msg.textContent = 'Rapport envoyé par courriel.';
      msg.className = 'auth-msg show ok';
    }
  });
}

function loadChartJs() {
  return new Promise((resolve) => {
    if (window.Chart) return resolve();
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4';
    script.onload = resolve;
    document.head.appendChild(script);
  });
}

function escapeHtmlD(str) {
  return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}
