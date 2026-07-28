// LAKOU SANTÉ — MÉDECINE — menu + onglets

document.addEventListener('DOMContentLoaded', () => {
  const burger = document.getElementById('burgerBtn');
  const menu = document.getElementById('menuPanel');
  const overlay = document.getElementById('overlay');
  const closeBtn = document.getElementById('menuClose');

  function openMenu(){
    menu.classList.add('open');
    overlay.classList.add('open');
  }
  function closeMenu(){
    menu.classList.remove('open');
    overlay.classList.remove('open');
  }

  burger?.addEventListener('click', openMenu);
  closeBtn?.addEventListener('click', closeMenu);
  overlay?.addEventListener('click', closeMenu);
  document.querySelectorAll('#menuPanel a[data-close]').forEach(a => {
    a.addEventListener('click', closeMenu);
  });

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
