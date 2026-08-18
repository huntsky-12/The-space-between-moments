const bar = document.querySelector('.chapter-progress span');
const update = () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  bar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
};
window.addEventListener('scroll', update, {passive:true});
window.addEventListener('resize', update);
update();
