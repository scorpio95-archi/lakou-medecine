// LAKOU SANTÉ — MÉDECINE — authentification
// Utilise toujours window.supabaseClient (jamais `const supabase`).

function showMsg(el, text, type){
  el.textContent = text;
  el.className = 'auth-msg show ' + type;
}

// ---------- INSCRIPTION ----------
const inscriptionForm = document.getElementById('inscriptionForm');
if (inscriptionForm) {
  const roleInputs = document.querySelectorAll('input[name="role"]');
  roleInputs.forEach(input => {
    input.addEventListener('change', () => {
      document.querySelectorAll('.role-option').forEach(opt => opt.classList.remove('checked'));
      input.closest('.role-option').classList.add('checked');
    });
  });

  inscriptionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = document.getElementById('authMsg');
    const btn = document.getElementById('submitBtn');
    const fullName = document.getElementById('fullName').value.trim();
    const faculte = document.getElementById('faculte').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const roleChecked = document.querySelector('input[name="role"]:checked');

    if (!fullName || !email || !password || !roleChecked) {
      showMsg(msg, 'Remplis tous les champs obligatoires.', 'error');
      return;
    }
    if (password.length < 6) {
      showMsg(msg, 'Le mot de passe doit contenir au moins 6 caractères.', 'error');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Création du compte...';

    const { data, error } = await window.supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: roleChecked.value,
          faculte
        }
      }
    });

    btn.disabled = false;
    btn.textContent = 'Créer mon compte';

    if (error) {
      showMsg(msg, error.message, 'error');
      return;
    }

    showMsg(msg, 'Compte créé. Vérifie ta boîte mail pour confirmer, puis connecte-toi.', 'ok');
    inscriptionForm.reset();
    document.querySelectorAll('.role-option').forEach(opt => opt.classList.remove('checked'));
  });
}

// ---------- CONNEXION ----------
const connexionForm = document.getElementById('connexionForm');
if (connexionForm) {
  connexionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = document.getElementById('authMsg');
    const btn = document.getElementById('submitBtn');
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
      showMsg(msg, 'Entre ton courriel et ton mot de passe.', 'error');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Connexion...';

    const { data, error } = await window.supabaseClient.auth.signInWithPassword({ email, password });

    btn.disabled = false;
    btn.textContent = 'Se connecter';

    if (error) {
      showMsg(msg, 'Courriel ou mot de passe incorrect.', 'error');
      return;
    }

    window.location.href = 'dashboard.html';
  });
}

// ---------- DASHBOARD ----------
const dashCard = document.getElementById('dashCard');
if (dashCard) {
  (async () => {
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) {
      window.location.href = 'connexion.html';
      return;
    }

    const { data: profile } = await window.supabaseClient
      .from('profiles')
      .select('full_name, role, faculte')
      .eq('id', session.user.id)
      .single();

    const roleLabels = {
      etudiant: 'Étudiant',
      enseignant: 'Enseignant',
      visiteur: 'Visiteur',
      admin: 'Admin'
    };

    document.getElementById('dashRole').textContent = roleLabels[profile?.role] || 'Étudiant';
    document.getElementById('dashName').textContent = profile?.full_name || session.user.email;
    document.getElementById('dashEmail').textContent = session.user.email;
  })();

  document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    await window.supabaseClient.auth.signOut();
    window.location.href = 'connexion.html';
  });
}
