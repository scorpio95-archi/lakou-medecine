// /shared/partials/nav.js — charge le header + menu déroulant partagés
// Chaque page a juste besoin de : <div id="site-header"></div>
// puis, avant </body> : <script src="/shared/partials/nav.js"></script>

(async function () {
  const mount = document.getElementById('site-header');
  if (!mount) return;

  try {
    const res = await fetch('/shared/partials/header.html');
    mount.outerHTML = await res.text();
  } catch (err) {
    console.error('Impossible de charger le header partagé :', err);
    return;
  }

  // ----- Menu déroulant : ouverture / fermeture -----
  const burger = document.getElementById('burgerBtn');
  const menu = document.getElementById('menuPanel');
  const overlay = document.getElementById('overlay');
  const closeBtn = document.getElementById('menuClose');

  function openMenu() {
    menu.classList.add('open');
    overlay.classList.add('open');
  }
  function closeMenu() {
    menu.classList.remove('open');
    overlay.classList.remove('open');
  }

  burger?.addEventListener('click', openMenu);
  closeBtn?.addEventListener('click', closeMenu);
  overlay?.addEventListener('click', closeMenu);
  document.querySelectorAll('#menuPanel a[data-close]').forEach((a) => {
    a.addEventListener('click', closeMenu);
  });

  // Signal pour les autres scripts (ex. bascule menuGuest/menuAuth selon
  // la session) qui doivent attendre que le header existe dans le DOM.
  document.dispatchEvent(new Event('header:ready'));
})();
