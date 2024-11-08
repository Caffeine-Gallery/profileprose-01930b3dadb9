import { AuthClient } from "@dfinity/auth-client";
import { backend } from "declarations/backend";

let authClient;
let userPrincipal;

// DOM Elements
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const profileBtn = document.getElementById("profileBtn");
const profileSection = document.getElementById("profileSection");
const createPostSection = document.getElementById("createPostSection");
const postsSection = document.getElementById("postsSection");
const newPostBtn = document.getElementById("newPostBtn");
const loadingSpinner = document.getElementById("loadingSpinner");

// Initialize
async function init() {
    authClient = await AuthClient.create();
    if (await authClient.isAuthenticated()) {
        handleAuthenticated();
    }
    setupEventListeners();
    loadPosts();
}

// Event Listeners
function setupEventListeners() {
    loginBtn.onclick = login;
    logoutBtn.onclick = logout;
    profileBtn.onclick = showProfile;
    newPostBtn.onclick = showCreatePost;
    document.getElementById("profileForm").onsubmit = saveProfile;
    document.getElementById("postForm").onsubmit = createPost;
}

// Authentication
async function login() {
    await authClient.login({
        identityProvider: "https://identity.ic0.app",
        onSuccess: handleAuthenticated,
    });
}

async function logout() {
    await authClient.logout();
    userPrincipal = null;
    updateUI(false);
    loadPosts();
}

async function handleAuthenticated() {
    userPrincipal = await authClient.getIdentity().getPrincipal();
    updateUI(true);
    loadProfile();
    loadPosts();
}

// UI Updates
function updateUI(isAuthenticated) {
    loginBtn.classList.toggle("d-none", isAuthenticated);
    logoutBtn.classList.toggle("d-none", !isAuthenticated);
    profileBtn.classList.toggle("d-none", !isAuthenticated);
    newPostBtn.classList.toggle("d-none", !isAuthenticated);
    profileSection.classList.add("d-none");
    createPostSection.classList.add("d-none");
    postsSection.classList.remove("d-none");
}

function showLoading(show) {
    loadingSpinner.classList.toggle("d-none", !show);
}

// Profile Management
async function loadProfile() {
    showLoading(true);
    try {
        const profile = await backend.getProfile(userPrincipal);
        if (profile) {
            document.getElementById("username").value = profile.username;
            document.getElementById("bio").value = profile.bio;
            document.getElementById("avatar").value = profile.avatar;
        }
    } catch (error) {
        console.error("Error loading profile:", error);
    }
    showLoading(false);
}

async function saveProfile(e) {
    e.preventDefault();
    showLoading(true);
    
    const username = document.getElementById("username").value;
    const bio = document.getElementById("bio").value;
    const avatar = document.getElementById("avatar").value;

    try {
        const exists = await backend.getProfile(userPrincipal);
        const result = exists 
            ? await backend.updateProfile(username, bio, avatar)
            : await backend.createProfile(username, bio, avatar);
        
        if (result) {
            profileSection.classList.add("d-none");
            postsSection.classList.remove("d-none");
        }
    } catch (error) {
        console.error("Error saving profile:", error);
    }
    showLoading(false);
}

// Post Management
function showProfile() {
    profileSection.classList.remove("d-none");
    createPostSection.classList.add("d-none");
    postsSection.classList.add("d-none");
}

function showCreatePost() {
    createPostSection.classList.remove("d-none");
    profileSection.classList.add("d-none");
    postsSection.classList.add("d-none");
}

async function createPost(e) {
    e.preventDefault();
    showLoading(true);

    const title = document.getElementById("postTitle").value;
    const content = document.getElementById("postContent").value;

    try {
        const result = await backend.createPost(title, content);
        if (result !== null) {
            document.getElementById("postForm").reset();
            createPostSection.classList.add("d-none");
            postsSection.classList.remove("d-none");
            await loadPosts();
        }
    } catch (error) {
        console.error("Error creating post:", error);
    }
    showLoading(false);
}

async function loadPosts() {
    showLoading(true);
    try {
        console.log("Fetching posts...");
        const posts = await backend.getAllPosts();
        console.log("Received posts:", posts);
        await displayPosts(posts);
    } catch (error) {
        console.error("Error loading posts:", error);
    }
    showLoading(false);
}

async function displayPosts(posts) {
    const postsList = document.getElementById("postsList");
    postsList.innerHTML = "";

    // Sort posts by created timestamp (BigInt)
    const sortedPosts = [...posts].sort((a, b) => {
        const timeA = BigInt(a.created);
        const timeB = BigInt(b.created);
        return timeB > timeA ? 1 : timeB < timeA ? -1 : 0;
    });

    for (const post of sortedPosts) {
        try {
            const profile = await backend.getProfile(post.author);
            const username = profile ? profile.username : "Anonymous";
            
            const postElement = document.createElement("div");
            postElement.className = "card mb-3";
            
            const createdDate = new Date(Number(BigInt(post.created) / BigInt(1000000)));
            
            postElement.innerHTML = `
                <div class="card-body">
                    <h5 class="card-title">${post.title}</h5>
                    <h6 class="card-subtitle mb-2 text-muted">By ${username}</h6>
                    <p class="card-text">${post.content}</p>
                    <div class="text-muted small">
                        Posted: ${createdDate.toLocaleString()}
                    </div>
                    ${post.author.toString() === userPrincipal?.toString() ? `
                        <div class="mt-2">
                            <button class="btn btn-sm btn-danger delete-post" data-post-id="${post.id}">Delete</button>
                        </div>
                    ` : ''}
                </div>
            `;

            // Add event listener for delete button
            const deleteBtn = postElement.querySelector('.delete-post');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', async () => {
                    await deletePost(post.id);
                });
            }

            postsList.appendChild(postElement);
        } catch (error) {
            console.error("Error displaying post:", error);
        }
    }
}

async function deletePost(id) {
    if (confirm("Are you sure you want to delete this post?")) {
        showLoading(true);
        try {
            const result = await backend.deletePost(id);
            if (result) {
                await loadPosts();
            }
        } catch (error) {
            console.error("Error deleting post:", error);
        }
        showLoading(false);
    }
}

// Initialize the app
init();
