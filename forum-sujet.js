// LAKOU SANTÉ — MÉDECINE — Forum : fil de discussion

const CAT_LABELS_S = {
  questions: 'Questions', projets: 'Projets', ressources: 'Ressources',
  entraide: 'Entraide', annonces: 'Annonces'
};

const topicId = new URLSearchParams(window.location.search).get('id');
let currentUserId = null;
let currentRole = 'visiteur';
let currentTopic = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (!topicId) { window.location.href = 'forum.html'; return; }

  const { data: { session } } = await window.supabaseClient.auth.getSession();
  if (!session) { window.location.href = 'connexion.html'; return; }
  currentUserId = session.user.id;

  const { data: profile } = await window.supabaseClient
    .from('profiles').select('role').eq('id', currentUserId).single();
  currentRole = profile?.role || 'visiteur';

  const { data: topic, error } = await window.supabaseClient
    .from('forum_topics').select('*').eq('id', topicId).single();

  if (error || !topic) {
    document.getElementById('topicPost').innerHTML = '<p class="listing-empty">Sujet introuvable, ou forum non accessible à ton rôle.</p>';
    document.getElementById('replyForm').style.display = 'none';
    return;
  }
  currentTopic = topic;

  const authorIds = new Set([topic.author_id]);
  const { data: replies } = await window.supabaseClient
    .from('forum_replies').select('*').eq('topic_id', topicId).order('created_at', { ascending: true });
  (replies || []).forEach(r => authorIds.add(r.author_id));

  const { data: authors } = await window.supabaseClient
    .from('profiles').select('id, full_name').in('id', Array.from(authorIds));
  const nameOf = {};
  (authors || []).forEach(a => { nameOf[a.id] = a.full_name || 'Membre'; });

  const replyIds = (replies || []).map(r => r.id);
  let votesByReply = {};
  if (replyIds.length) {
    const { data: votes } = await window.supabaseClient
      .from('forum_reply_votes').select('*').in('reply_id', replyIds);
    (votes || []).forEach(v => {
      votesByReply[v.reply_id] = votesByReply[v.reply_id] || [];
      votesByReply[v.reply_id].push(v);
    });
  }

  renderTopic(topic, nameOf);
  renderReplies(replies || [], nameOf, votesByReply);
  wireReplyForm(topic);
});

function renderTopic(topic, nameOf) {
  document.getElementById('breadcrumbTitle').textContent = topic.title;
  document.getElementById('topicCat').textContent = CAT_LABELS_S[topic.category] || topic.category;
  const statusEl = document.getElementById('topicStatus');
  statusEl.textContent = topic.status === 'resolved' ? 'Résolu' : 'Ouvert';
  statusEl.className = 'forum-status ' + topic.status;
  document.getElementById('topicTitle').textContent = topic.title;
  document.getElementById('topicMeta').textContent =
    `${nameOf[topic.author_id] || 'Membre'} · ${new Date(topic.created_at).toLocaleDateString('fr-FR')}`;
  document.getElementById('topicContent').textContent = topic.content;

  const isAuthor = topic.author_id === currentUserId;
  const isAdmin = currentRole === 'admin';
  const actions = document.getElementById('topicLockActions');
  actions.innerHTML = '';

  if (topic.status === 'open' && (isAdmin || isAuthor)) {
    actions.innerHTML = `<button type="button" class="vote-btn" id="lockBtn">🔒 Marquer résolu</button>`;
    document.getElementById('lockBtn').addEventListener('click', () => setStatus('resolved'));
  } else if (topic.status === 'resolved' && isAdmin) {
    actions.innerHTML = `<button type="button" class="vote-btn" id="unlockBtn">🔓 Rouvrir</button>`;
    document.getElementById('unlockBtn').addEventListener('click', () => setStatus('open'));
  }
}

async function setStatus(status) {
  const { error } = await window.supabaseClient
    .from('forum_topics').update({ status, updated_at: new Date().toISOString() }).eq('id', topicId);
  if (!error) window.location.reload();
}

function renderReplies(replies, nameOf, votesByReply) {
  const list = document.getElementById('repliesList');
  const empty = document.getElementById('repliesEmpty');
  const isAdmin = currentRole === 'admin';

  if (!replies.length) {
    empty.style.display = 'block';
    return;
  }

  list.innerHTML = replies.map(r => {
    const votes = votesByReply[r.id] || [];
    const useful = votes.filter(v => v.vote_type === 'useful').length;
    const notRel = votes.filter(v => v.vote_type === 'not_relevant').length;
    const mine = votes.find(v => v.user_id === currentUserId);
    return `
      <div class="forum-reply" data-reply-id="${r.id}">
        <div class="forum-reply-content">${escapeHtmlS(r.content)}</div>
        <div class="forum-reply-meta">
          <span class="forum-reply-author">${escapeHtmlS(nameOf[r.author_id] || 'Membre')} · ${new Date(r.created_at).toLocaleDateString('fr-FR')}</span>
          <div class="vote-btns">
            <button type="button" class="vote-btn vote-useful ${mine?.vote_type === 'useful' ? 'is-mine' : ''}" data-reply="${r.id}" data-type="useful">👍 Utile (${useful})</button>
            <button type="button" class="vote-btn vote-notrel ${mine?.vote_type === 'not_relevant' ? 'is-mine' : ''}" data-reply="${r.id}" data-type="not_relevant">👎 Pas pertinent (${notRel})</button>
            ${isAdmin ? `<button type="button" class="vote-btn" data-delete-reply="${r.id}">Supprimer</button>` : ''}
          </div>
        </div>
      </div>`;
  }).join('');

  list.querySelectorAll('.vote-btn[data-reply]').forEach(btn => {
    btn.addEventListener('click', () => handleVote(btn.dataset.reply, btn.dataset.type));
  });
  list.querySelectorAll('[data-delete-reply]').forEach(btn => {
    btn.addEventListener('click', async () => {
      await window.supabaseClient.from('forum_replies').delete().eq('id', btn.dataset.deleteReply);
      window.location.reload();
    });
  });
}

async function handleVote(replyId, voteType) {
  const { data: existing } = await window.supabaseClient
    .from('forum_reply_votes').select('*')
    .eq('reply_id', replyId).eq('user_id', currentUserId).maybeSingle();

  if (!existing) {
    await window.supabaseClient.from('forum_reply_votes').insert({ reply_id: replyId, user_id: currentUserId, vote_type: voteType });
  } else if (existing.vote_type === voteType) {
    await window.supabaseClient.from('forum_reply_votes').delete().eq('id', existing.id);
  } else {
    await window.supabaseClient.from('forum_reply_votes').update({ vote_type: voteType }).eq('id', existing.id);
  }
  window.location.reload();
}

function wireReplyForm(topic) {
  const form = document.getElementById('replyForm');
  if (topic.status === 'resolved') {
    form.style.display = 'none';
    document.getElementById('lockedMsg').style.display = 'block';
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = document.getElementById('authMsg');
    const btn = document.getElementById('submitBtn');
    const content = document.getElementById('replyContent').value.trim();
    if (!content) return;

    btn.disabled = true; btn.textContent = 'Envoi...';
    const { error } = await window.supabaseClient
      .from('forum_replies').insert({ topic_id: topicId, content, author_id: currentUserId });
    btn.disabled = false; btn.textContent = 'Répondre';

    if (error) {
      msg.textContent = error.message;
      msg.className = 'auth-msg show error';
      return;
    }
    window.location.reload();
  });
}

function escapeHtmlS(str) {
  return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}
