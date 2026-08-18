// LAKOU SANTÉ — MÉDECINE — Forum : liste des sujets

const CAT_LABELS = {
  questions: 'Questions', projets: 'Projets', ressources: 'Ressources',
  entraide: 'Entraide', annonces: 'Annonces'
};

let currentCat = '';
let currentRole = null;

document.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await window.supabaseClient.auth.getSession();
  if (!session) { window.location.href = 'connexion.html'; return; }

  const { data: profile } = await window.supabaseClient
    .from('profiles').select('role').eq('id', session.user.id).single();
  currentRole = profile?.role || 'visiteur';

  if (currentRole === 'visiteur') {
    document.getElementById('forumCats').style.display = 'none';
    document.getElementById('forumBlocked').style.display = 'block';
    return;
  }

  document.getElementById('forumFab').style.display = 'flex';

  document.querySelectorAll('.forum-cat').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.forum-cat').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      currentCat = btn.dataset.cat;
      loadTopics();
    });
  });

  await loadTopics();
});

async function loadTopics() {
  const list = document.getElementById('forumList');
  const empty = document.getElementById('forumEmpty');
  empty.style.display = 'none';

  let query = window.supabaseClient
    .from('forum_topics').select('*')
    .order('created_at', { ascending: false });
  if (currentCat) query = query.eq('category', currentCat);

  const { data, error } = await query;

  if (error || !data || !data.length) {
    list.innerHTML = '';
    empty.style.display = 'block';
    return;
  }

  // Compte des réponses par sujet
  const { data: replyCounts } = await window.supabaseClient
    .from('forum_replies').select('topic_id');
  const counts = {};
  (replyCounts || []).forEach(r => { counts[r.topic_id] = (counts[r.topic_id] || 0) + 1; });

  list.innerHTML = data.map(t => `
    <a class="forum-row" href="forum-sujet.html?id=${t.id}">
      <div class="forum-row-top">
        <div>
          <span class="forum-row-cat">${CAT_LABELS[t.category] || t.category}</span>
          <div class="forum-row-title">${escapeHtmlF(t.title)}</div>
        </div>
        <span class="forum-status ${t.status}">${t.status === 'resolved' ? 'Résolu' : 'Ouvert'}</span>
      </div>
      <div class="forum-row-meta">${counts[t.id] || 0} réponse${(counts[t.id] || 0) > 1 ? 's' : ''} · ${new Date(t.created_at).toLocaleDateString('fr-FR')}</div>
    </a>
  `).join('');
}

function escapeHtmlF(str) {
  return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}
