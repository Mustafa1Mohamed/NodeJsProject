/* Global Navbar (compact)
   Left: Facebook | Center: Home | Right: Avatar + Username -> Profile + Sign out
*/
(() => {
  // ---------- Config (adjust paths if your folders differ) ----------
  const API      = (typeof API_URL !== "undefined" && API_URL) ? API_URL : "http://localhost:3000";
  const HOME     = "./home%20page.html";
  const PROFILE  = "../profile/profile.html";
  const LOGIN    = "../auth/login/login.html";

  const getToken = () => localStorage.getItem("token");

  // ---------- Tiny utils ----------
  const esc = (s="") => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const DEFAULT_AVATAR = "data:image/svg+xml;utf8,"+encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'>
       <circle cx='32' cy='32' r='32' fill='#e6e9f0'/>
       <circle cx='32' cy='24' r='12' fill='#bfc7d1'/>
       <path d='M16 52c0-8.837 7.163-16 16-16s16 7.163 16 16' fill='#bfc7d1'/>
     </svg>`
  );

  // ---------- Styles (once) ----------
  if (!document.getElementById("global-navbar-styles")) {
    const st = document.createElement("style");
    st.id = "global-navbar-styles";
    st.textContent = `
      #appNavbar{position:sticky;top:0;z-index:1000;display:flex;align-items:center;justify-content:space-between;
        padding:10px 14px;background:#fff;border-bottom:1px solid #eee}
      #appNavbar .left,#appNavbar .right{display:flex;align-items:center;gap:10px}
      #appNavbar .center button{border:0;background:transparent;cursor:pointer;display:flex;align-items:center}
      #navAvatar{width:32px;height:32px;border-radius:50%;object-fit:cover;display:block}
      #navUsername{background:transparent;border:0;cursor:pointer;color:#111;font-weight:600}
      #navSignout{border:1px solid #ddd;background:#fff;color:#333;padding:6px 10px;border-radius:10px;cursor:pointer}
      #navSignout:hover{background:#f6f6f6;border-color:#ccc}
    `;
    document.head.appendChild(st);
  }

  // ---------- Navbar DOM ----------
  const nav = document.createElement("nav");
  nav.id = "appNavbar";
  nav.innerHTML = `
    <div class="left">
      <a href="https://facebook.com" target="_blank" rel="noopener" aria-label="Facebook" title="Facebook">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="#1877F2" aria-hidden="true">
          <path d="M22 12.06C22 6.51 17.52 2 12 2S2 6.51 2 12.06C2 17.07 5.66 21.19 10.44 22v-7.02H7.9v-2.92h2.54V9.41c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.44 2.92h-2.34V22C18.34 21.19 22 17.07 22 12.06z"/>
        </svg>
      </a>
    </div>

    <div class="center">
      <button id="navHome" type="button" aria-label="Home" title="Home">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="#333" aria-hidden="true">
          <path d="M12 3l9 8h-3v9h-5v-6H11v6H6v-9H3z"/>
        </svg>
      </button>
    </div>

    <div class="right">
      <img id="navAvatar" src="${DEFAULT_AVATAR}" alt="avatar">
      <button id="navUsername" type="button" title="Go to profile">User</button>
      <button id="navSignout" type="button" title="Sign out">Sign out</button>
    </div>
  `;

  // ---------- Insert then wire ----------
  function insert() {
    const host = document.getElementById("navbar-root");
    if (host) { host.innerHTML = ""; host.appendChild(nav); }
    else { document.body.insertBefore(nav, document.body.firstChild); }
    wire();
  }

  async function wire() {
    const avatarEl = document.getElementById("navAvatar");
    const nameBtn  = document.getElementById("navUsername");

    // nav actions
    document.getElementById("navHome")?.addEventListener("click", ()=> location.href = HOME);
    nameBtn?.addEventListener("click", ()=> location.href = PROFILE);
    document.getElementById("navSignout")?.addEventListener("click", ()=>{
      try { localStorage.removeItem("token"); } catch {}
      location.href = LOGIN;
    });

    // populate /me (if token exists)
    const tok = getToken();
    if (!tok) { avatarEl.src = DEFAULT_AVATAR; nameBtn.textContent = "User"; return; }

    try {
      const r = await fetch(`${API}/me`, { headers: { Authorization: "Bearer " + tok } });
      if (!r.ok) throw 0;
      const me = await r.json();
      const username = me?.name || me?.displayName || me?.username || me?.email || "User";
      const avatar   = me?.avatarUrl || me?.imageUrl || me?.photoURL || me?.photoUrl || me?.avatar || me?.profileImage || me?.picture || null;
      nameBtn.textContent = esc(username);
      avatarEl.src = avatar ? esc(avatar) : DEFAULT_AVATAR;
    } catch {
      nameBtn.textContent = "User";
      avatarEl.src = DEFAULT_AVATAR;
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", insert);
  } else {
    insert();
  }
})();
