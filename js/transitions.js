(() => {
const order={"index.html":1,"page2.html":2,"page3.html":3,"writings.html":4,"letters.html":4,"random.html":4};
const fileName=(url=location.href)=>new URL(url,location.href).pathname.split("/").pop()||"index.html";
const current=fileName(), level=order[current]??99;
const last=sessionStorage.getItem("insanity-last-page");
const lastLevel=last?(order[last]??level):level;
let refLevel=null;
try{if(document.referrer&&new URL(document.referrer).origin===location.origin)refLevel=order[fileName(document.referrer)]??null}catch{}
const backward=refLevel!==null&&refLevel!==level?refLevel>level:lastLevel>level;
const body=document.body;
body.classList.add(backward?"page-enter-backward":"page-enter-forward");
requestAnimationFrame(()=>{body.classList.add("page-ready");requestAnimationFrame(()=>body.classList.remove("page-enter-forward","page-enter-backward"))});
sessionStorage.setItem("insanity-last-page",current);
let navigating=false;
document.addEventListener("click",e=>{
const a=e.target.closest("a[href]");if(!a||navigating)return;
const h=a.getAttribute("href");
if(!h||h.startsWith("#")||h.startsWith("mailto:")||h.startsWith("tel:")||a.target==="_blank"||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
const u=new URL(h,location.href);if(u.origin!==location.origin)return;
const dest=fileName(u.href),destLevel=order[dest]??99;
e.preventDefault();navigating=true;
body.classList.remove("page-ready","page-enter-forward","page-enter-backward");
void body.offsetHeight;
body.classList.add(destLevel<level?"page-exit-backward":"page-exit-forward");
setTimeout(()=>location.assign(u.href),440);
});
})();
