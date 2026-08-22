// LAKOU SANTÉ — MÉDECINE — onglets actifs selon la section visible
// (la logique du menu déroulant vit désormais dans /shared/partials/nav.js)

document.addEventListener('DOMContentLoaded', () => {
  // onglets actifs selon la section visible
  const tabs = document.querySelectorAll('.tab');
  const sections = Array.from(tabs).map(t => document.querySelector(t.getAttribute('href')));

  function setActiveTab(){
    let current = sections[0];
    const scrollPos = window.scrollY + 140;
    sections.forEach(sec => {
      if (sec && sec.offsetTop <= scrollPos) current = sec;
    });
    tabs.forEach(t => {
      const target = document.querySelector(t.getAttribute('href'));
      t.classList.toggle('is-active', target === current);
    });
  }

  window.addEventListener('scroll', setActiveTab, { passive: true });
  setActiveTab();
});
