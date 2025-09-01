// Minimal JS for mobile menu toggle
(function(){
  const toggle = document.querySelector('.mobile-menu-toggle');
  const menu = document.querySelector('.nav-menu');
  if(!toggle || !menu) return;
  toggle.addEventListener('click', ()=>{
    menu.classList.toggle('open');
  });
})();
