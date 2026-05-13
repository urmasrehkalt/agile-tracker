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

const modal = {
    root: null,
    form: null,
    error: null,
    criteriaList: null,
    editingId: null,
    open(story = null) {
        this.editingId = story ? story.id : null;
        this.error.hidden = true;
        this.error.textContent = "";
        this.form.reset();
        this.criteriaList.innerHTML = "";
        const headerEl = document.getElementById("modal-title");
        if (story) {
            headerEl.textContent = `Muuda story #${story.id}`;
            this.form.title.value = story.title;
            this.form.description.value = story.description || "";
            this.form.points.value = story.points;
            this.form.status.value = story.status;
            for (const c of story.acceptanceCriteria || []) this.addCriterion(c);
            if (!(story.acceptanceCriteria || []).length) this.addCriterion();
        } else {
            headerEl.textContent = "Uus story";
            this.addCriterion();
        }
        this.root.hidden = false;
        const first = this.form.querySelector("input[name=title]");
        if (first) first.focus();
    },
    close() {
        this.editingId = null;
        this.root.hidden = true;
    },
    addCriterion(value = "") {
        const row = document.createElement("div");
        row.className = "criterion";
        row.innerHTML = `
            <input type="text" placeholder="Vastuvõtutingimus" value="${escapeHtml(value)}">
            <button type="button" class="remove" aria-label="Eemalda">✕</button>
        `;
        row.querySelector(".remove").addEventListener("click", () => {
            if (this.criteriaList.children.length > 1) row.remove();
        });
        this.criteriaList.appendChild(row);
    },
    collect() {
        const fd = new FormData(this.form);
        const criteria = [...this.criteriaList.querySelectorAll("input")]
            .map((i) => i.value.trim())
            .filter((v) => v.length > 0);
        return {
            title: String(fd.get("title") || "").trim(),
            description: String(fd.get("description") || "").trim(),
            points: Number(fd.get("points")),
            status: String(fd.get("status") || "todo"),
            acceptanceCriteria: criteria,
        };
    },
    showError(msg) {
        this.error.textContent = msg;
        this.error.hidden = false;
    },
};

async function submitNewStory(payload) {
    const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const detail = formatValidationError(data.detail);
        throw new Error(detail || `Salvestamine ebaõnnestus (HTTP ${res.status})`);
    }
    return res.json();
}

async function updateStory(id, payload) {
    const res = await fetch(`${API}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(formatValidationError(data.detail) || `Uuendamine ebaõnnestus (HTTP ${res.status})`);
    }
    return res.json();
}

async function deleteStory(id) {
    const res = await fetch(`${API}/${id}`, { method: "DELETE" });
    if (!res.ok && res.status !== 204) {
        throw new Error(`Kustutamine ebaõnnestus (HTTP ${res.status})`);
    }
}

async function addComment(storyId, text) {
    const res = await fetch(`${API}/${storyId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(formatValidationError(data.detail) || `Kommentaari salvestamine ebaõnnestus (HTTP ${res.status})`);
    }
    return res.json();
}

async function deleteComment(storyId, commentId) {
    const res = await fetch(`${API}/${storyId}/comments/${commentId}`, { method: "DELETE" });
    if (!res.ok && res.status !== 204) {
        throw new Error(`Kommentaari kustutamine ebaõnnestus (HTTP ${res.status})`);
    }
}

async function patchStatus(id, status) {
    const res = await fetch(`${API}/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error(`Staatuse muutmine ebaõnnestus (HTTP ${res.status})`);
    return res.json();
}

async function reorderBacklog(orderIds) {
    const res = await fetch(`${API}/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: orderIds }),
    });
    if (!res.ok) throw new Error(`Järjekorra salvestamine ebaõnnestus (HTTP ${res.status})`);
    return res.json();
}

function formatValidationError(detail) {
    if (!detail) return "";
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
        return detail
            .map((d) => `${(d.loc || []).slice(-1)[0] || "väli"}: ${d.msg || "vigane"}`)
            .join("; ");
    }
    return JSON.stringify(detail);
}

function initModal() {
    modal.root = document.getElementById("modal-root");
    modal.form = document.getElementById("story-form");
    modal.error = document.getElementById("form-error");
    modal.criteriaList = document.getElementById("criteria-list");

    document.getElementById("add-story").addEventListener("click", () => modal.open());
    document.getElementById("add-criterion").addEventListener("click", () => modal.addCriterion());

    modal.root.querySelectorAll("[data-close]").forEach((el) => {
        el.addEventListener("click", () => modal.close());
    });
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !modal.root.hidden) modal.close();
    });

    modal.form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const payload = modal.collect();
        if (!payload.title) return modal.showError("Pealkiri on kohustuslik.");
        if (!Number.isInteger(payload.points) || payload.points < 0) {
            return modal.showError("Punktid peavad olema mittenegatiivne täisarv.");
        }
        if (payload.acceptanceCriteria.length === 0) {
            return modal.showError("Lisa vähemalt üks vastuvõtutingimus.");
        }
        try {
            if (modal.editingId != null) {
                await updateStory(modal.editingId, payload);
            } else {
                await submitNewStory(payload);
            }
            modal.close();
            await reload();
        } catch (err) {
            modal.showError(err.message);
        }
    });
}

const detail = {
    root: null,
    body: null,
    currentId: null,
    open(story) {
        this.currentId = story.id;
        document.getElementById("detail-title").textContent = `#${story.id}: ${story.title}`;
        const criteriaHtml = (story.acceptanceCriteria || [])
            .map((c) => `<li>${escapeHtml(c)}</li>`).join("");
        const commentsHtml = (story.comments || [])
            .map((c) => `
                <li class="comment" data-comment-id="${c.id}">
                    <button class="comment-delete" aria-label="Kustuta kommentaar">✕</button>
                    <p class="comment-text">${escapeHtml(c.text)}</p>
                    <span class="comment-meta">${escapeHtml(c.createdAt || "")}</span>
                </li>
            `).join("");
        this.body.innerHTML = `
            <div class="detail-meta">
                <span class="status-badge status-${story.status}">${story.status}</span>
                <span class="points-badge">${story.points}p</span>
                <span>Loodud: ${escapeHtml(story.createdAt || "")}</span>
                <span>Uuendatud: ${escapeHtml(story.updatedAt || "")}</span>
            </div>
            <div class="detail-section">
                <h3>Kirjeldus</h3>
                <p>${escapeHtml(story.description || "—")}</p>
            </div>
            <div class="detail-section">
                <h3>Vastuvõtutingimused</h3>
                <ul>${criteriaHtml || "<li>—</li>"}</ul>
            </div>
            <div class="detail-section">
                <h3>Kommentaarid</h3>
                <ul class="comments-list">${commentsHtml || "<li class=\"comment-meta\">Veel pole kommentaare.</li>"}</ul>
                <form class="comment-form" id="comment-form">
                    <textarea name="text" placeholder="Lisa kommentaar…" required></textarea>
                    <button type="submit" class="btn btn-primary">Lisa</button>
                </form>
                <p class="form-error" id="comment-error" hidden></p>
            </div>
        `;
        this.bindCommentEvents();
        this.root.hidden = false;
    },
    bindCommentEvents() {
        const form = this.body.querySelector("#comment-form");
        const errorEl = this.body.querySelector("#comment-error");
        if (form) {
            form.addEventListener("submit", async (e) => {
                e.preventDefault();
                const text = String(form.text.value || "").trim();
                if (!text) {
                    errorEl.textContent = "Kommentaar ei tohi olla tühi.";
                    errorEl.hidden = false;
                    return;
                }
                try {
                    await addComment(this.currentId, text);
                    await reload();
                    const updated = findStory(this.currentId);
                    if (updated) this.open(updated);
                } catch (err) {
                    errorEl.textContent = err.message;
                    errorEl.hidden = false;
                }
            });
        }
        this.body.querySelectorAll(".comment-delete").forEach((btn) => {
            btn.addEventListener("click", async () => {
                const li = btn.closest(".comment");
                const cid = Number(li.dataset.commentId);
                if (!confirm("Kustuta kommentaar?")) return;
                try {
                    await deleteComment(this.currentId, cid);
                    await reload();
                    const updated = findStory(this.currentId);
                    if (updated) this.open(updated);
                } catch (err) {
                    if (errorEl) {
                        errorEl.textContent = err.message;
                        errorEl.hidden = false;
                    }
                }
            });
        });
    },
    close() {
        this.currentId = null;
        this.root.hidden = true;
    },
};

function findStory(id) {
    return state.stories.find((s) => s.id === id);
}

function initDetail() {
    detail.root = document.getElementById("detail-root");
    detail.body = document.getElementById("detail-body");
    detail.root.querySelectorAll("[data-close]").forEach((el) => {
        el.addEventListener("click", () => detail.close());
    });
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !detail.root.hidden) detail.close();
    });
    document.getElementById("detail-edit").addEventListener("click", () => {
        const story = findStory(detail.currentId);
        if (!story) return;
        detail.close();
        modal.open(story);
    });
    document.getElementById("detail-delete").addEventListener("click", async () => {
        const story = findStory(detail.currentId);
        if (!story) return;
        if (!confirm(`Kustuta story "${story.title}"?`)) return;
        try {
            await deleteStory(story.id);
            detail.close();
            await reload();
        } catch (err) {
            showError(err.message);
        }
    });

    document.querySelector(".board").addEventListener("click", (e) => {
        const card = e.target.closest(".card");
        if (!card) return;
        const id = Number(card.dataset.id);
        const story = findStory(id);
        if (story) detail.open(story);
    });
}

function initSortable() {
    if (typeof Sortable === "undefined") return;
    const columns = ["todo", "doing", "done"];
    columns.forEach((status) => {
        const el = document.getElementById(`col-${status}`);
        if (!el) return;
        Sortable.create(el, {
            group: "kanban",
            animation: 150,
            ghostClass: "sortable-ghost",
            dragClass: "sortable-drag",
            onEnd: async (evt) => {
                const id = Number(evt.item.dataset.id);
                const toStatus = evt.to.id.replace("col-", "");
                const fromStatus = evt.from.id.replace("col-", "");
                try {
                    if (toStatus !== fromStatus) {
                        await patchStatus(id, toStatus);
                    }
                    if (toStatus === "todo") {
                        const ids = [...document.getElementById("col-todo").querySelectorAll(".card")]
                            .map((c) => Number(c.dataset.id));
                        if (ids.length) await reorderBacklog(ids);
                    }
                    await reload();
                } catch (err) {
                    showError(err.message);
                    await reload();
                }
            },
        });
    });
}

document.addEventListener("DOMContentLoaded", () => {
    initModal();
    initDetail();
    initSortable();
    reload();
});
