const API_URL = "http://localhost:3000";
const getToken = () => localStorage.getItem("token");

//  Load Posts
async function loadPosts() {
  try {
    const token = getToken();
    const res = await fetch(`${API_URL}/posts`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error("Failed to fetch posts");

    const posts = await res.json();
    const container = document.getElementById("postsContainer");
    container.innerHTML = "";

    posts.forEach((post) => {
      const postEl = document.createElement("div");
      postEl.className = "post";

      postEl.innerHTML = `
  <div class="post-card">
    <div class="post-header">
      <img class="avatar" src="https://i.pravatar.cc/40?u=${
        post.authorId || "user"
      }" alt="avatar"/>
      <div>
        <strong class="author">${post.authorId || "User"}</strong>
        <span class="date">Just now</span>
      </div>
    </div>

    <div class="post-content">
      <p>${post.content || ""}</p>
      ${post.imageUrl ? `<img src="${post.imageUrl}" class="post-img"/>` : ""}
    </div>

    <div class="post-actions">
     
      <button class="action-btn"> Comment</button>
      <button class="action-btn edit-btn" onclick="showEditForm('${
        post.id
      }', \`${post.content || ""}\`)"> Edit Post</button>
      <button class="action-btn Delete Post-btn" onclick="deletePost('${
        post.id
      }')">🗑 Delete</button>
    </div>
  </div>
`;

      container.appendChild(postEl);
    });
  } catch (err) {
    console.error("Error loading posts:", err);
  }
}

// ======================== Create New Post ========================
async function createPost() {
  try {
    const contentInput = document.getElementById("newPostContent");
    const fileInput = document.getElementById("newPostFile");

    if (!contentInput || !fileInput) {
      console.error("Inputs not found in DOM");
      return;
    }

    const content = contentInput.value;
    const file = fileInput.files[0];

    if (!content && !file) {
      alert("Please add some text or upload a file.");
      return;
    }

    const formData = new FormData();
    formData.append("content", content);
    if (file) formData.append("media", file);

    const res = await fetch(`${API_URL}/posts`, {
      method: "POST",
      headers: { Authorization: "Bearer " + getToken() },
      body: formData,
    });

    const data = await res.json();
    console.log("Post created:", data);

    contentInput.value = "";
    fileInput.value = "";
    loadPosts();
  } catch (err) {
    console.error("Error creating post:", err);
  }
}

// ======================== Update Post ========================
async function updatePost(postId) {
  const content = document.getElementById("editContent").value.trim();
  const fileInput = document.getElementById("editFile");
  const file = fileInput.files[0];
  const token = getToken();

  try {
    const formData = new FormData();
    formData.append("content", content);
    if (file) formData.append("media", file);

    const res = await fetch(`${API_URL}/posts/${postId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.msg || "Failed to update post");
    }

    document.getElementById("editForm").style.display = "none";
    loadPosts();
  } catch (err) {
    console.error("Error updating post:", err);
    alert(err.message);
  }
}

//  Show Edit Form
function showEditForm(id, content) {
  const form = document.getElementById("editForm");
  form.style.display = "block";
  form.dataset.id = id;
  document.getElementById("editContent").value = content;
}

// Cancel Edit
function cancelEdit() {
  document.getElementById("editForm").style.display = "none";
  document.getElementById("editContent").value = "";
  document.getElementById("editFile").value = "";
}

//  Delete Post
async function deletePost(postId) {
  const token = getToken();

  try {
    const res = await fetch(`${API_URL}/posts/${postId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.msg || "Failed to delete post");
    }

    loadPosts();
  } catch (err) {
    console.error("Error deleting post:", err);
    alert(err.message);
  }
}

//  Bind Functions to Window
window.createPost = createPost;
window.updatePost = updatePost;
window.deletePost = deletePost;
window.showEditForm = showEditForm;
window.cancelEdit = cancelEdit;

//  Initial Load
loadPosts();
