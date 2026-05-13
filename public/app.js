const API = "/api/stories";

const state = {
    stories: [],
};

async function fetchStories() {
    const res = await fetch(API);
    if (!res.ok) {
        throw new Error(`Andmete laadimine ebaõnnestus (HTTP ${res.status})`);
    }
    return res.json();
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function renderCard(story) {
    const card = document.createElement("article");
    card.className = "card";
    card.dataset.id = story.id;
    card.innerHTML = `
        <h3 class="card-title">${escapeHtml(story.title)}</h3>
        <div class="card-meta">
            <span class="points-badge">${story.points}p</span>
            <span class="card-id">#${story.id}</span>
        </div>
    `;
    return card;
}

function renderBoard() {
    const byStatus = { todo: [], doing: [], done: [] };
    for (const s of state.stories) {
        if (byStatus[s.status]) byStatus[s.status].push(s);
    }
    byStatus.todo.sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0) || a.id - b.id);
    byStatus.doing.sort((a, b) => a.id - b.id);
    byStatus.done.sort((a, b) => a.id - b.id);

    for (const status of ["todo", "doing", "done"]) {
        const container = document.getElementById(`col-${status}`);
        container.innerHTML = "";
        for (const story of byStatus[status]) {
            container.appendChild(renderCard(story));
        }
    }
}

function showError(message) {
    let banner = document.getElementById("error-banner");
    if (!banner) {
        banner = document.createElement("div");
        banner.id = "error-banner";
        banner.style.cssText = "background:#fee2e2;color:#991b1b;padding:0.6rem 1rem;border-bottom:1px solid #fecaca;font-size:0.9rem;";
        document.body.insertBefore(banner, document.body.firstChild);
    }
    banner.textContent = message;
}

async function reload() {
    try {
        state.stories = await fetchStories();
        renderBoard();
    } catch (err) {
        showError(err.message);
    }
}

document.addEventListener("DOMContentLoaded", reload);
