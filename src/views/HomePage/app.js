/* ======= Mini Facebook - Compact app.js ======= */
const API_URL = "http://localhost:3000";
const getToken = () => localStorage.getItem("token");

/* --- defaults / helpers --- */
const DEFAULT_AVATAR = "data:image/svg+xml;utf8," + encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><circle cx='32' cy='32' r='32' fill='#e6e9f0'/><circle cx='32' cy='24' r='12' fill='#bfc7d1'/><path d='M16 52c0-8.837 7.163-16 16-16s16 7.163 16 16' fill='#bfc7d1'/></svg>`
);
const esc = (s="") => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const authHeaders = (extra={}) => ({ Authorization: `Bearer ${getToken()}`, ...extra });
const j = (path, opts={}) => fetch(`${API_URL}${path}`, { headers: authHeaders(opts.headers||{}), ...opts })
  .then(async r=>r.ok? r.json(): Promise.reject(await r.json().catch(()=>({msg:"Error"}))));

/* --- my meta (id/role/avatar/name) --- */
const MY = { id:null, role:null, avatar:null, name:"User" };
async function ensureMe() {
  if (MY.id && MY.role!==null) return MY;
  try {
    const me = await j("/me");
    MY.id  = me?.id || me?._id || me?.uid || me?.userId || me?.user?.id || null;
    MY.role= (me?.role || me?.user?.role || "").toString().toLowerCase();
    MY.avatar = me?.avatarUrl || me?.imageUrl || me?.photoURL || me?.avatar || me?.profileImage || null;
    MY.name = me?.name || me?.displayName || me?.username || me?.email || "User";
  } catch {}
  // personalize add-post box
  const av = document.querySelector(".new-post-header .avatar");
  if (av) Object.assign(av, { src: MY.avatar||DEFAULT_AVATAR, style:"width:44px;height:44px;border-radius:50%;object-fit:cover" });
  const ta = document.getElementById("newPostContent");
  if (ta) ta.placeholder = `What's on your mind, ${MY.name}?`;
  return MY;
}

/* --- user meta cache (name + avatar) --- */
const userCache = new Map();
async function getUserMeta(uid){
  if (!uid) return {name:"User", avatar:null};
  if (userCache.has(uid)) return userCache.get(uid);
  try {
    const u = await j(`/users/${uid}`);
    const meta = {
      name: u?.name || u?.displayName || u?.username || u?.data?.name || "User",
      avatar: u?.avatarUrl || u?.imageUrl || u?.photoURL || u?.photoUrl || u?.avatar || u?.profileImage || u?.picture || null,
    };
    userCache.set(uid, meta); return meta;
  } catch { const f={name:"User", avatar:null}; userCache.set(uid,f); return f; }
}

/* ======================= POSTS ======================= */
async function loadPosts(){
  try {
    await ensureMe();
    const posts = await j("/posts");
    const enriched = await Promise.all(posts.map(async p=>{
      const m = await getUserMeta(p.authorId);
      return {...p, _name:m.name, _avatar:m.avatar||DEFAULT_AVATAR};
    }));

    const box = document.getElementById("postsContainer");
    box.innerHTML = "";

    enriched.forEach(p=>{
      const mine = (MY.id && String(p.authorId)===String(MY.id)) || (MY.role==="admin");

      const post = document.createElement("div");
      post.className = "post";
      post.dataset.postId = p.id;
      post.innerHTML = `
        <div class="post-card">
          <div class="post-header" style="display:flex;gap:10px;align-items:center;">
            <img class="avatar" src="${esc(p._avatar)}" alt="avatar" style="width:44px;height:44px;border-radius:50%;object-fit:cover"/>
            <div><strong class="author">${esc(p._name)}</strong></div>
          </div>

          <div class="post-content">
            <p class="post-text">${esc(p.content||"")}</p>
            ${p.imageUrl ? `<img src="${esc(p.imageUrl)}" class="post-img" style="width:100%;max-height:520px;border-radius:12px;object-fit:cover"/>` : ""}
          </div>

          <div class="post-actions">
            <button class="action-btn" onclick="toggleComments('${p.id}')"> Comment</button>
            ${ mine ? `
              <button class="action-btn" onclick="showEditForm('${p.id}', \`${(p.content||"").replace(/`/g,"\\`")}\`)"> Edit Post</button>
              <button class="action-btn" onclick="deletePost('${p.id}')">🗑 Delete</button>` : "" }
          </div>

          <div class="comments-wrap" style="margin-top:10px;"></div>
        </div>
      `;
      box.appendChild(post);

      // auto-load comments for everyone
      const wrap = post.querySelector(".comments-wrap");
      wrap.style.display = "block";
      loadComments(p.id, wrap).catch(console.error);
    });
  } catch(err){ console.error("loadPosts:", err); }
}

/* inline post edit */
function showEditForm(postId, current){
  const el = document.querySelector(`[data-post-id="${postId}"] .post-content`);
  if (!el) return;
  if (!el.dataset._orig) el.dataset._orig = el.innerHTML;
  el.innerHTML = `
    <div class="inline-edit">
      <textarea class="inline-edit-text" style="width:100%;min-height:100px;border-radius:10px;padding:8px;">${esc(current||"")}</textarea>
      <input type="file" class="inline-edit-file" accept="image/*,video/*" style="margin-top:8px;"/>
      <div style="display:flex;gap:8px;margin-top:8px;">
        <button class="action-btn" onclick="savePostInline('${postId}')">Save</button>
        <button class="action-btn" onclick="cancelPostInline('${postId}')">Cancel</button>
      </div>
    </div>`;
}
async function savePostInline(postId){
  const root = document.querySelector(`[data-post-id="${postId}"] .post-content`);
  const content = root.querySelector(".inline-edit-text")?.value?.trim() || "";
  const file = root.querySelector(".inline-edit-file")?.files?.[0];
  const fd = new FormData();
  if (content) fd.append("content", content);
  if (file) fd.append("media", file);
  try {
    const r = await fetch(`${API_URL}/posts/${postId}`, { method:"PUT", headers: authHeaders(), body: fd });
    const data = await r.json();
    if (!r.ok) throw new Error(data?.msg || "Failed to update");
    await loadPosts();
  } catch(e){ alert(e.message||"Failed to update"); }
}
function cancelPostInline(postId){
  const el = document.querySelector(`[data-post-id="${postId}"] .post-content`);
  if (el?.dataset?._orig){ el.innerHTML = el.dataset._orig; delete el.dataset._orig; }
}

/* create/delete post */
async function createPost(){
  const content = document.getElementById("newPostContent")?.value || "";
  const file = document.getElementById("newPostFile")?.files?.[0];
  if (!content && !file) return alert("Please add some text or upload a file.");
  const fd = new FormData(); fd.append("content", content); if (file) fd.append("media", file);
  try {
    const r = await fetch(`${API_URL}/posts`, { method:"POST", headers:authHeaders(), body:fd });
    const d = await r.json(); if (!r.ok) throw new Error(d?.msg||"Failed to create");
    document.getElementById("newPostContent").value=""; document.getElementById("newPostFile").value="";
    loadPosts();
  } catch(e){ alert(e.message||"Error creating post"); }
}
async function deletePost(id){
  try{
    const r = await fetch(`${API_URL}/posts/${id}`, { method:"DELETE", headers:authHeaders() });
    const d = await r.json(); if (!r.ok) throw new Error(d?.msg||"Failed to delete");
    loadPosts();
  }catch(e){ alert(e.message||"Error deleting post"); }
}

/* ======================= COMMENTS ======================= */
const avatarSmall = (src) => `<img src="${esc(src||DEFAULT_AVATAR)}" alt="a" style="width:28px;height:28px;border-radius:50%;object-fit:cover">`;

async function loadComments(postId, wrap){
  try{
    const list = await j(`/posts/${postId}/comments`);
    const withMeta = await Promise.all((list||[]).map(async c=>{
      const m = await getUserMeta(c.authorId);
      return {...c, _name: m.name, _avatar: m.avatar||DEFAULT_AVATAR};
    }));
    wrap.innerHTML = `
      <div style="padding:8px;border:1px solid #eee;border-radius:10px;">
        <div class="comments-list" style="display:flex;flex-direction:column;gap:8px;">
          ${withMeta.length? withMeta.map(c=>commentItem(postId,c)).join("") : `<div class="text-muted" style="font-size:14px;">No comments yet.</div>`}
        </div>
        ${addCommentBox(postId)}
      </div>`;
    bindCommentHandlers(postId, wrap);
  }catch(e){
    wrap.innerHTML = `<div style="padding:8px;border:1px solid #eee;border-radius:10px;">
      <div class="text-danger">Failed to load comments</div>${addCommentBox(postId)}</div>`;
    bindCommentHandlers(postId, wrap);
  }
}
const addCommentBox = (postId)=>`
  <div class="add-comment" style="display:flex;gap:8px;margin-top:10px;align-items:flex-start;">
    ${avatarSmall(MY.avatar)}
    <textarea class="new-comment-input" data-post="${postId}" placeholder="Write a comment..." style="flex:1;min-height:38px;border-radius:10px;padding:8px;"></textarea>
    <button class="action-btn submit-comment" data-post="${postId}">Post</button>
  </div>`;
function commentItem(postId,c){
  const can = (MY.id && String(c.authorId)===String(MY.id)) || (MY.role==="admin");
  return `
    <div class="comment-item" data-comment-id="${esc(c.id)}" style="display:flex;gap:8px;align-items:flex-start;">
      ${avatarSmall(c._avatar)}
      <div style="flex:1;">
        <strong style="font-size:14px;">${esc(c._name)}</strong>
        <div class="comment-body"><p class="comment-text" style="margin:2px 0;white-space:pre-wrap;">${esc(c.content||"")}</p></div>
        <div class="comment-actions" style="display:flex;gap:6px;">
          ${can? `<button class="action-btn edit-comment-btn" data-post="${esc(postId)}" data-id="${esc(c.id)}">Edit</button>
                  <button class="action-btn delete-comment-btn" data-post="${esc(postId)}" data-id="${esc(c.id)}">🗑 Delete</button>` : ""}
        </div>
      </div>
    </div>`;
}
function bindCommentHandlers(postId, wrap){
  wrap.querySelector(`.submit-comment[data-post="${postId}"]`)?.addEventListener("click", async ()=>{
    const inp = wrap.querySelector(`.new-comment-input[data-post="${postId}"]`);
    const content = inp?.value?.trim(); if (!content) return;
    await j(`/posts/${postId}/comments`, { method:"POST", headers:{...authHeaders({"Content-Type":"application/json"})}, body: JSON.stringify({content}) });
    loadComments(postId, wrap);
  });

  wrap.addEventListener("click", async (e)=>{
    const ed = e.target.closest(".edit-comment-btn"); const del = e.target.closest(".delete-comment-btn");
    if (ed) enterEditComment(postId, ed.dataset.id, wrap);
    if (del) { await j(`/posts/${postId}/comments/${del.dataset.id}`, { method:"DELETE", headers:authHeaders() }); loadComments(postId, wrap); }
  });
}
function enterEditComment(postId, cid, wrap){
  const item = wrap.querySelector(`.comment-item[data-comment-id="${CSS.escape(cid)}"]`);
  const body = item?.querySelector(".comment-body"); const txt = item?.querySelector(".comment-text")?.textContent || "";
  if (!body) return;
  if (!body.dataset._o) body.dataset._o = body.innerHTML;
  body.innerHTML = `
    <textarea class="edit-comment-input" style="width:100%;min-height:70px;border-radius:10px;padding:8px;">${esc(txt)}</textarea>
    <div style="display:flex;gap:6px;margin-top:6px;">
      <button class="action-btn save-comment">Save</button>
      <button class="action-btn cancel-comment">Cancel</button>
    </div>`;
  body.querySelector(".save-comment").onclick = async ()=>{
    const content = body.querySelector(".edit-comment-input")?.value?.trim(); if (!content) return;
    await j(`/posts/${postId}/comments/${cid}`, { method:"PUT", headers:{...authHeaders({"Content-Type":"application/json"})}, body: JSON.stringify({content}) });
    loadComments(postId, wrap);
  };
  body.querySelector(".cancel-comment").onclick = ()=>{ body.innerHTML = body.dataset._o; delete body.dataset._o; };
}

/* toggle (kept for UX; now it just collapses/expands) */
async function toggleComments(postId){
  const w = document.querySelector(`[data-post-id="${postId}"] .comments-wrap`);
  if (!w) return;
  w.style.display = (w.style.display==="none" ? "block" : "none");
}

/* --- expose & init --- */
window.createPost = createPost;
window.deletePost = deletePost;
window.showEditForm = showEditForm;
window.savePostInline = savePostInline;
window.cancelPostInline = cancelPostInline;
window.toggleComments = toggleComments;

loadPosts();
