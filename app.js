// public/app.js
const API_URL = "http://localhost:3000";
const getToken = () => localStorage.getItem("token");

// تحميل المنشورات
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
        <strong>${post.authorId || "User"}</strong>
        <p>${post.content}</p>
        <button onclick="deletePost('${post.id}')">Delete</button>
      `;
      container.appendChild(postEl);
    });
  } catch (err) {
    console.error("Error loading posts:", err);
  }
}

// إنشاء منشور جديد
async function createPost() {
  const contentInput = document.getElementById("newPostContent");
  const content = contentInput.value.trim();
  if (!content) return alert("Post content cannot be empty!");

  const token = getToken();

  try {
    const res = await fetch(`${API_URL}/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.msg || "Failed to create post");
    }

    contentInput.value = "";
    loadPosts();
  } catch (err) {
    console.error("Error creating post:", err);
    alert(err.message);
  }
}

// حذف منشور
async function deletePost(postId) {
  const token = getToken();

  try {
    const res = await fetch(`${API_URL}/posts/${postId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
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

// ربط الدوال بالـ window عشان تعمل مع onclick في HTML
window.createPost = createPost;
window.deletePost = deletePost;

// تحميل المنشورات عند بداية التحميل
loadPosts();
