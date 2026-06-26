const API = "/api/stories";
const PROJECTS_API = "/api/projects";
const THEME_KEY = "agiilne-tracker-theme";
const PROJECT_KEY = "agiilne-tracker-project-id";
const MOCKUP_MAX_SIZE = 5 * 1024 * 1024;
const MOCKUP_TYPES = ["image/png", "image/jpeg", "image/webp"];

const state = {
    stories: [],
    projects: [],
    selectedProjectId: null,
    filters: {
        query: "",
        minPoints: 0,
    },
};

function matchesFilters(story) {
    const q = state.filters.query.trim().toLowerCase();
    if (q && !story.title.toLowerCase().includes(q)) return false;
    if (story.points < state.filters.minPoints) return false;
    return true;
}

async function fetchStories() {
    const projectParam = state.selectedProjectId ? `?projectId=${state.selectedProjectId}` : "";
    const res = await fetch(`${API}${projectParam}`);
    if (!res.ok) {
        throw new Error(t("error.loadStories", { status: res.status }));
    }
    return res.json();
}

async function fetchProjects() {
    const res = await fetch(PROJECTS_API);
    if (!res.ok) {
        throw new Error(t("error.loadProjects", { status: res.status }));
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

function getSystemTheme() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getSavedTheme() {
    const theme = localStorage.getItem(THEME_KEY);
    return theme === "dark" || theme === "light" ? theme : null;
}

function updateThemeToggle(theme) {
    const btn = document.getElementById("theme-toggle");
    if (!btn) return;
    const isDark = theme === "dark";
    btn.textContent = isDark ? t("theme.light") : t("theme.dark");
    btn.setAttribute("aria-pressed", String(isDark));
    btn.setAttribute("aria-label", isDark ? t("theme.switchToLight") : t("theme.switchToDark"));
}

function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    updateThemeToggle(theme);
}

function initTheme() {
    const btn = document.getElementById("theme-toggle");
    applyTheme(getSavedTheme() || getSystemTheme());
    if (!btn) return;
    btn.addEventListener("click", () => {
        const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
        localStorage.setItem(THEME_KEY, next);
        applyTheme(next);
    });
    if (window.matchMedia) {
        const media = window.matchMedia("(prefers-color-scheme: dark)");
        const syncSystemTheme = () => {
            if (!getSavedTheme()) applyTheme(getSystemTheme());
        };
        if (media.addEventListener) {
            media.addEventListener("change", syncSystemTheme);
        } else if (media.addListener) {
            media.addListener(syncSystemTheme);
        }
    }
}

// Set by initFilters so applyLanguage can re-sync the points-filter trigger label.
let syncPointsFilterFn = null;

function updateLangToggle() {
    const btn = document.getElementById("lang-toggle");
    if (!btn) return;
    const target = getLang() === "en" ? "et" : "en";
    btn.textContent = target.toUpperCase();
    btn.setAttribute("aria-label", target === "et" ? t("lang.switchToEstonian") : t("lang.switchToEnglish"));
}

// Re-render every visible piece of UI in the newly selected language.
function applyLanguage(lang) {
    setLang(lang);
    applyStaticTranslations();
    updateLangToggle();
    updateThemeToggle(document.documentElement.dataset.theme || getSystemTheme());
    renderProjectSwitcher();
    renderBoard();
    if (syncPointsFilterFn) syncPointsFilterFn();
    if (modal.root && !modal.root.hidden) {
        modal.updateTitle();
        modal.syncStatusSelect();
    }
    if (projectsModal.root && !projectsModal.root.hidden) {
        projectsModal.render();
        projectsModal.updateFormTitle();
        projectsModal.syncStatusSelect();
    }
    if (detail.root && !detail.root.hidden && detail.currentId != null) {
        const story = findStory(detail.currentId);
        if (story) detail.open(story);
    }
}

function initLang() {
    setLang(getLang());
    applyStaticTranslations();
    updateLangToggle();
    const btn = document.getElementById("lang-toggle");
    if (!btn) return;
    btn.addEventListener("click", () => {
        applyLanguage(getLang() === "en" ? "et" : "en");
    });
}

function setAppStatus(message, type = "info") {
    const status = document.getElementById("app-status");
    if (!status) return;
    status.textContent = message;
    status.className = type === "error" ? "app-status error" : "app-status";
    status.hidden = !message;
}

function clearAppStatus() {
    setAppStatus("");
}

function currentProject() {
    return state.projects.find((project) => project.id === state.selectedProjectId) || null;
}

function projectColor(project) {
    return /^#[0-9a-f]{6}$/i.test(project?.color || "") ? project.color : "#2563eb";
}

function formatFileSize(size) {
    if (!Number.isFinite(size)) return "";
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function validateMockupFile(file) {
    if (!file) return t("mockup.errChoose");
    if (!MOCKUP_TYPES.includes(file.type)) return t("mockup.errType");
    if (file.size > MOCKUP_MAX_SIZE) return t("mockup.errSize");
    if (file.size === 0) return t("mockup.errEmpty");
    return "";
}

function renderCard(story) {
    const card = document.createElement("article");
    card.className = "card";
    card.dataset.id = story.id;
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", t("story.cardAria", { number: story.number, title: story.title }));
    const criteriaCount = (story.acceptanceCriteria || []).length;
    const commentCount = (story.comments || []).length;
    const description = String(story.description || "").trim();
    const mockup = story.mockup;
    card.innerHTML = `
        <div class="card-meta">
            <span class="points-badge">${story.points}p</span>
            <span class="card-id">#${story.number}</span>
        </div>
        ${mockup ? `
            <div class="card-mockup-preview" aria-hidden="true">
                <img src="${escapeHtml(mockup.url)}" alt="">
            </div>
        ` : ""}
        <h3 class="card-title">${escapeHtml(story.title)}</h3>
        ${description ? `<p class="card-description">${escapeHtml(description)}</p>` : ""}
        <div class="card-metrics">
            <span class="metric-badge">${criteriaCount} AC</span>
            <span class="metric-badge">${escapeHtml(t("story.commentCount", { n: commentCount }))}</span>
            ${story.mockup ? `<span class="metric-badge mockup-badge">${escapeHtml(t("mockup.title"))}</span>` : ""}
        </div>
    `;
    return card;
}

function renderEmptyState(container, status, filteredOut) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    const statusText = {
        todo: t("empty.todo"),
        doing: t("empty.doing"),
        done: t("empty.done"),
    };
    empty.innerHTML = filteredOut
        ? `<div><strong>${escapeHtml(t("empty.filteredTitle"))}</strong><span>${escapeHtml(t("empty.filteredHint"))}</span></div>`
        : `<div><strong>${escapeHtml(t("empty.title"))}</strong><span>${escapeHtml(statusText[status])}</span></div>`;
    container.appendChild(empty);
}

function renderBoard() {
    const byStatus = { todo: [], doing: [], done: [] };
    for (const s of state.stories) {
        if (!matchesFilters(s)) continue;
        if (byStatus[s.status]) byStatus[s.status].push(s);
    }
    byStatus.todo.sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0) || a.id - b.id);
    byStatus.doing.sort((a, b) => a.id - b.id);
    byStatus.done.sort((a, b) => a.id - b.id);
    const filteredTotal = byStatus.todo.length + byStatus.doing.length + byStatus.done.length;
    const filteredOut = state.stories.length > 0 && filteredTotal === 0;

    for (const status of ["todo", "doing", "done"]) {
        const container = document.getElementById(`col-${status}`);
        container.innerHTML = "";
        for (const story of byStatus[status]) {
            container.appendChild(renderCard(story));
        }
        if (byStatus[status].length === 0) renderEmptyState(container, status, filteredOut);
        const sum = byStatus[status].reduce((acc, s) => acc + (s.points || 0), 0);
        const sumEl = document.querySelector(`[data-sum-for="${status}"]`);
        if (sumEl) sumEl.textContent = `${sum}p`;
        const countEl = document.querySelector(`[data-count-for="${status}"]`);
        if (countEl) {
            const n = byStatus[status].length;
            countEl.textContent = t(n === 1 ? "column.countOne" : "column.countMany", { n });
        }
    }
}

function showError(message) {
    setAppStatus(message, "error");
}

async function reload() {
    setAppStatus(t("status.loading"));
    try {
        state.stories = await fetchStories();
        renderBoard();
        clearAppStatus();
    } catch (err) {
        showError(err.message);
    }
}

const modal = {
    root: null,
    form: null,
    error: null,
    criteriaList: null,
    statusSelect: null,
    statusMenu: null,
    statusTrigger: null,
    projectSelect: null,
    editingId: null,
    open(story = null) {
        this.editingId = story ? story.id : null;
        this.error.hidden = true;
        this.error.textContent = "";
        this.form.reset();
        this.criteriaList.innerHTML = "";
        this.populateProjectOptions();
        this.updateTitle();
        if (story) {
            this.form.title.value = story.title;
            this.form.description.value = story.description || "";
            this.form.points.value = story.points;
            this.form.projectId.value = story.projectId || state.selectedProjectId || 1;
            this.form.status.value = story.status;
            this.syncStatusSelect();
            for (const c of story.acceptanceCriteria || []) this.addCriterion(c);
            if (!(story.acceptanceCriteria || []).length) this.addCriterion();
        } else {
            this.form.projectId.value = state.selectedProjectId || (state.projects[0] && state.projects[0].id) || 1;
            this.addCriterion();
            this.syncStatusSelect();
        }
        this.root.hidden = false;
        const first = this.form.querySelector("input[name=title]");
        if (first) first.focus();
    },
    close() {
        this.editingId = null;
        this.root.hidden = true;
    },
    updateTitle() {
        const headerEl = document.getElementById("modal-title");
        if (!headerEl) return;
        if (this.editingId != null) {
            const story = findStory(this.editingId);
            headerEl.textContent = story
                ? t("story.modalEditTitle", { number: story.number })
                : t("story.modalNewTitle");
        } else {
            headerEl.textContent = t("story.modalNewTitle");
        }
    },
    addCriterion(value = "") {
        const row = document.createElement("div");
        row.className = "criterion";
        row.innerHTML = `
            <input type="text" placeholder="${escapeHtml(t("story.criterionPlaceholder"))}" value="${escapeHtml(value)}">
            <button type="button" class="remove" aria-label="${escapeHtml(t("common.remove"))}">✕</button>
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
            projectId: Number(fd.get("projectId")) || state.selectedProjectId || 1,
            status: String(fd.get("status") || "todo"),
            acceptanceCriteria: criteria,
        };
    },
    showError(msg) {
        this.error.textContent = msg;
        this.error.hidden = false;
    },
    syncStatusSelect() {
        if (!this.statusSelect || !this.statusTrigger || !this.statusMenu) return;
        const selected = this.statusSelect.selectedOptions[0];
        const label = selected ? selected.textContent : t("status.todo");
        document.getElementById("status-trigger-value").textContent = label;
        this.statusMenu.querySelectorAll(".custom-select-option").forEach((option) => {
            const isSelected = option.dataset.value === this.statusSelect.value;
            option.setAttribute("aria-selected", String(isSelected));
        });
    },
    closeStatusSelect() {
        if (!this.statusMenu || !this.statusTrigger) return;
        this.statusMenu.hidden = true;
        this.statusTrigger.setAttribute("aria-expanded", "false");
    },
    toggleStatusSelect() {
        if (!this.statusMenu || !this.statusTrigger) return;
        const isOpen = !this.statusMenu.hidden;
        this.statusMenu.hidden = isOpen;
        this.statusTrigger.setAttribute("aria-expanded", String(!isOpen));
    },
    populateProjectOptions() {
        if (!this.projectSelect) return;
        this.projectSelect.innerHTML = state.projects
            .map((project) => `<option value="${project.id}">${escapeHtml(project.name)}</option>`)
            .join("");
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
        throw new Error(detail || t("error.save", { status: res.status }));
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
        throw new Error(formatValidationError(data.detail) || t("error.update", { status: res.status }));
    }
    return res.json();
}

async function deleteStory(id) {
    const res = await fetch(`${API}/${id}`, { method: "DELETE" });
    if (!res.ok && res.status !== 204) {
        throw new Error(t("error.delete", { status: res.status }));
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
        throw new Error(formatValidationError(data.detail) || t("error.commentSave", { status: res.status }));
    }
    return res.json();
}

async function deleteComment(storyId, commentId) {
    const res = await fetch(`${API}/${storyId}/comments/${commentId}`, { method: "DELETE" });
    if (!res.ok && res.status !== 204) {
        throw new Error(t("error.commentDelete", { status: res.status }));
    }
}

async function uploadMockup(storyId, file) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`${API}/${storyId}/mockup`, {
        method: "PUT",
        body: fd,
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(formatValidationError(data.detail) || t("error.mockupSave", { status: res.status }));
    }
    return res.json();
}

async function deleteMockup(storyId) {
    const res = await fetch(`${API}/${storyId}/mockup`, { method: "DELETE" });
    if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({}));
        throw new Error(formatValidationError(data.detail) || t("error.mockupDelete", { status: res.status }));
    }
}

async function saveProject(id, payload) {
    const res = await fetch(id ? `${PROJECTS_API}/${id}` : PROJECTS_API, {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(formatValidationError(data.detail) || t("error.projectSave", { status: res.status }));
    }
    return res.json();
}

async function deleteProject(id) {
    const res = await fetch(`${PROJECTS_API}/${id}`, { method: "DELETE" });
    if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({}));
        throw new Error(formatValidationError(data.detail) || t("error.projectDelete", { status: res.status }));
    }
}

async function patchStatus(id, status) {
    const res = await fetch(`${API}/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error(t("error.status", { status: res.status }));
    return res.json();
}

async function reorderBacklog(orderIds) {
    const res = await fetch(`${API}/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: orderIds, projectId: state.selectedProjectId || 1 }),
    });
    if (!res.ok) throw new Error(t("error.reorder", { status: res.status }));
    return res.json();
}

function formatValidationError(detail) {
    if (!detail) return "";
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
        return detail
            .map((d) => `${(d.loc || []).slice(-1)[0] || t("error.field")}: ${d.msg || t("error.invalid")}`)
            .join("; ");
    }
    return JSON.stringify(detail);
}

function renderProjectSwitcher() {
    const triggerValue = document.getElementById("project-trigger-value");
    const triggerDot = document.getElementById("project-trigger-dot");
    const optionsRoot = document.getElementById("project-options");
    const project = currentProject();
    if (triggerValue) triggerValue.textContent = project ? project.name : t("project.switcherDefault");
    if (triggerDot) triggerDot.style.background = projectColor(project);
    if (!optionsRoot) return;
    optionsRoot.innerHTML = state.projects.map((p) => `
        <button type="button" class="custom-select-option project-option" role="option" data-id="${p.id}" aria-selected="${p.id === state.selectedProjectId}">
            <span class="project-dot" style="background:${escapeHtml(projectColor(p))}" aria-hidden="true"></span>
            <span>${escapeHtml(p.name)}</span>
            ${p.status === "archived" ? `<span class="project-status-pill">${escapeHtml(t("projectStatus.archived"))}</span>` : ""}
        </button>
    `).join("");
    optionsRoot.querySelectorAll(".project-option").forEach((btn) => {
        btn.addEventListener("click", async () => {
            await selectProject(Number(btn.dataset.id));
            closeProjectSwitcher();
        });
    });
}

function closeProjectSwitcher() {
    const trigger = document.getElementById("project-trigger");
    const menu = document.getElementById("project-menu");
    if (!trigger || !menu) return;
    menu.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
}

async function selectProject(id) {
    if (!state.projects.some((project) => project.id === id)) return;
    state.selectedProjectId = id;
    localStorage.setItem(PROJECT_KEY, String(id));
    renderProjectSwitcher();
    if (modal.projectSelect) modal.populateProjectOptions();
    await reload();
}

async function loadProjects() {
    state.projects = await fetchProjects();
    const savedId = Number(localStorage.getItem(PROJECT_KEY));
    const fallback = state.projects.find((project) => project.status === "active") || state.projects[0];
    const selected = state.projects.find((project) => project.id === savedId) || fallback;
    state.selectedProjectId = selected ? selected.id : null;
    if (state.selectedProjectId) localStorage.setItem(PROJECT_KEY, String(state.selectedProjectId));
    renderProjectSwitcher();
}

const projectsModal = {
    root: null,
    form: null,
    list: null,
    error: null,
    statusSelect: null,
    statusMenu: null,
    statusTrigger: null,
    editingId: null,
    open() {
        this.render();
        this.root.hidden = false;
    },
    close() {
        this.root.hidden = true;
        this.resetForm();
    },
    resetForm() {
        this.editingId = null;
        this.form.reset();
        this.form.color.value = "#2563eb";
        this.form.status.value = "active";
        this.syncStatusSelect();
        this.updateFormTitle();
        this.hideError();
    },
    updateFormTitle() {
        const el = document.getElementById("project-form-title");
        if (!el) return;
        el.textContent = this.editingId != null
            ? t("project.editTitle", { id: this.editingId })
            : t("project.formNewTitle");
    },
    hideError() {
        this.error.hidden = true;
        this.error.textContent = "";
    },
    showError(message) {
        this.error.textContent = message;
        this.error.hidden = false;
    },
    collect() {
        const fd = new FormData(this.form);
        return {
            name: String(fd.get("name") || "").trim(),
            description: String(fd.get("description") || "").trim(),
            color: String(fd.get("color") || "#2563eb"),
            status: String(fd.get("status") || "active"),
            owner: String(fd.get("owner") || "").trim(),
            client: String(fd.get("client") || "").trim(),
            deadline: String(fd.get("deadline") || ""),
        };
    },
    edit(project) {
        this.editingId = project.id;
        this.form.name.value = project.name;
        this.form.description.value = project.description || "";
        this.form.color.value = projectColor(project);
        this.form.status.value = project.status || "active";
        this.syncStatusSelect();
        this.form.owner.value = project.owner || "";
        this.form.client.value = project.client || "";
        this.form.deadline.value = project.deadline || "";
        this.updateFormTitle();
        this.hideError();
    },
    render() {
        if (!this.list) return;
        this.list.innerHTML = state.projects.map((project) => `
            <article class="project-list-item" data-project-id="${project.id}">
                <div class="project-list-title">
                    <span class="project-dot" style="background:${escapeHtml(projectColor(project))}" aria-hidden="true"></span>
                    <div>
                        <strong>${escapeHtml(project.name)}</strong>
                        <span>${escapeHtml(project.client || project.owner || t("projectStatus." + project.status))}</span>
                    </div>
                </div>
                <div class="project-list-actions">
                    <button type="button" class="btn" data-edit-project>${escapeHtml(t("common.edit"))}</button>
                    <button type="button" class="btn btn-danger" data-delete-project>${escapeHtml(t("common.delete"))}</button>
                </div>
            </article>
        `).join("");
        this.list.querySelectorAll("[data-edit-project]").forEach((btn) => {
            btn.addEventListener("click", () => {
                const id = Number(btn.closest(".project-list-item").dataset.projectId);
                const project = state.projects.find((p) => p.id === id);
                if (project) this.edit(project);
            });
        });
        this.list.querySelectorAll("[data-delete-project]").forEach((btn) => {
            btn.addEventListener("click", async () => {
                const id = Number(btn.closest(".project-list-item").dataset.projectId);
                const project = state.projects.find((p) => p.id === id);
                if (!project || !confirm(t("dialog.deleteProject", { name: project.name }))) return;
                try {
                    await deleteProject(id);
                    await loadProjects();
                    await reload();
                    this.render();
                } catch (err) {
                    this.showError(err.message);
                }
            });
        });
    },
    syncStatusSelect() {
        if (!this.statusSelect || !this.statusMenu) return;
        const selected = this.statusSelect.selectedOptions[0];
        document.getElementById("project-status-value").textContent = selected ? selected.textContent : t("projectStatus.active");
        this.statusMenu.querySelectorAll(".custom-select-option").forEach((option) => {
            option.setAttribute("aria-selected", String(option.dataset.value === this.statusSelect.value));
        });
    },
    closeStatusSelect() {
        if (!this.statusMenu || !this.statusTrigger) return;
        this.statusMenu.hidden = true;
        this.statusTrigger.setAttribute("aria-expanded", "false");
    },
    toggleStatusSelect() {
        if (!this.statusMenu || !this.statusTrigger) return;
        const isOpen = !this.statusMenu.hidden;
        this.statusMenu.hidden = isOpen;
        this.statusTrigger.setAttribute("aria-expanded", String(!isOpen));
    },
};

function initModal() {
    modal.root = document.getElementById("modal-root");
    modal.form = document.getElementById("story-form");
    modal.error = document.getElementById("form-error");
    modal.criteriaList = document.getElementById("criteria-list");
    modal.statusSelect = document.getElementById("story-status");
    modal.statusTrigger = document.getElementById("status-trigger");
    modal.statusMenu = document.querySelector("[data-status-select] .custom-select-menu");
    modal.projectSelect = document.getElementById("story-project");

    document.getElementById("add-story").addEventListener("click", () => modal.open());
    document.getElementById("add-criterion").addEventListener("click", () => modal.addCriterion());

    modal.statusTrigger.addEventListener("click", () => modal.toggleStatusSelect());
    modal.statusMenu.querySelectorAll(".custom-select-option").forEach((option) => {
        option.addEventListener("click", () => {
            modal.statusSelect.value = option.dataset.value;
            modal.syncStatusSelect();
            modal.closeStatusSelect();
            modal.statusTrigger.focus();
        });
    });
    document.addEventListener("click", (e) => {
        if (!e.target.closest("[data-status-select]")) modal.closeStatusSelect();
    });

    modal.root.querySelectorAll("[data-close]").forEach((el) => {
        el.addEventListener("click", () => modal.close());
    });
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modal.statusMenu && !modal.statusMenu.hidden) {
            modal.closeStatusSelect();
            modal.statusTrigger.focus();
            return;
        }
        if (e.key === "Escape" && !modal.root.hidden) modal.close();
    });

    modal.form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const payload = modal.collect();
        if (!payload.title) return modal.showError(t("story.errTitle"));
        if (!Number.isInteger(payload.points) || payload.points < 0) {
            return modal.showError(t("story.errPoints"));
        }
        if (payload.acceptanceCriteria.length === 0) {
            return modal.showError(t("story.errCriteria"));
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
        document.getElementById("detail-title").textContent = `#${story.number}: ${story.title}`;
        const criteriaHtml = (story.acceptanceCriteria || [])
            .map((c) => `<li>${escapeHtml(c)}</li>`).join("");
        const commentsHtml = (story.comments || [])
            .map((c) => `
                <li class="comment" data-comment-id="${c.id}">
                    <button class="comment-delete" aria-label="${escapeHtml(t("comment.deleteAria"))}">✕</button>
                    <p class="comment-text">${escapeHtml(c.text)}</p>
                    <span class="comment-meta">${escapeHtml(c.createdAt || "")}</span>
                </li>
            `).join("");
        const mockupHtml = this.renderMockup(story);
        this.body.innerHTML = `
            <div class="detail-meta">
                <span class="status-badge status-${story.status}">${story.status}</span>
                <span class="points-badge">${story.points}p</span>
                <span>${escapeHtml(t("detail.created", { date: story.createdAt || "" }))}</span>
                <span>${escapeHtml(t("detail.updated", { date: story.updatedAt || "" }))}</span>
            </div>
            <div class="detail-section">
                <h3>${escapeHtml(t("common.description"))}</h3>
                <p>${escapeHtml(story.description || "—")}</p>
            </div>
            <div class="detail-section">
                <h3>${escapeHtml(t("story.criteriaHeading"))}</h3>
                <ul>${criteriaHtml || "<li>—</li>"}</ul>
            </div>
            <button type="button" class="btn btn-ghost detail-edit-inline" id="detail-edit-inline">${escapeHtml(t("detail.editInline"))}</button>
            <div class="detail-section mockup-section">
                <h3>${escapeHtml(t("mockup.title"))}</h3>
                ${mockupHtml}
                <input id="mockup-file" type="file" accept="image/png,image/jpeg,image/webp" hidden>
                <p class="form-error" id="mockup-error" hidden></p>
            </div>
            <div class="detail-section comments-section">
                <h3>${escapeHtml(t("comment.heading"))}</h3>
                <ul class="comments-list">${commentsHtml || `<li class="comment-meta">${escapeHtml(t("comment.empty"))}</li>`}</ul>
                <form class="comment-form" id="comment-form">
                    <textarea name="text" placeholder="${escapeHtml(t("comment.placeholder"))}" required></textarea>
                    <button type="submit" class="btn btn-primary">${escapeHtml(t("comment.addButton"))}</button>
                </form>
                <p class="form-error" id="comment-error" hidden></p>
            </div>
        `;
        this.body.querySelector("#detail-edit-inline").addEventListener("click", () => openCurrentStoryEditor());
        this.bindMockupEvents(story);
        this.bindCommentEvents();
        this.root.hidden = false;
    },
    renderMockup(story) {
        const mockup = story.mockup;
        if (mockup) {
            return `
                <div class="mockup-preview">
                    <button type="button" class="mockup-thumb-button" id="mockup-open" aria-label="${escapeHtml(t("mockup.openAria"))}">
                        <img class="mockup-thumb" src="${escapeHtml(mockup.url)}" alt="${escapeHtml(t("mockup.title"))}: ${escapeHtml(mockup.originalName)}">
                    </button>
                    <div class="mockup-info">
                        <strong>${escapeHtml(mockup.originalName)}</strong>
                        <span>${escapeHtml(mockup.contentType)} · ${formatFileSize(mockup.size)} · ${escapeHtml(mockup.createdAt || "")}</span>
                        <div class="mockup-actions">
                            <button type="button" class="btn" id="mockup-open-action">${escapeHtml(t("mockup.openFull"))}</button>
                            <button type="button" class="btn" id="mockup-replace">${escapeHtml(t("mockup.replace"))}</button>
                            <button type="button" class="btn btn-danger" id="mockup-delete">${escapeHtml(t("common.delete"))}</button>
                        </div>
                    </div>
                </div>
            `;
        }
        return `
            <div class="mockup-dropzone" id="mockup-dropzone" aria-label="${escapeHtml(t("mockup.dropzoneAria"))}">
                <strong>${escapeHtml(t("mockup.dropzoneTitle"))}</strong>
                <span>${escapeHtml(t("mockup.dropzoneHint"))}</span>
                <button type="button" class="btn" id="mockup-pick">${escapeHtml(t("mockup.pick"))}</button>
            </div>
        `;
    },
    showMockupError(msg) {
        const errorEl = this.body.querySelector("#mockup-error");
        if (!errorEl) return;
        errorEl.textContent = msg;
        errorEl.hidden = false;
    },
    async handleMockupFile(file) {
        const story = findStory(this.currentId);
        if (!story) return;
        const validation = validateMockupFile(file);
        if (validation) return this.showMockupError(validation);
        if (story.mockup && !confirm(t("dialog.replaceMockup"))) return;
        try {
            await uploadMockup(story.id, file);
            await reload();
            const updated = findStory(story.id);
            if (updated) this.open(updated);
        } catch (err) {
            this.showMockupError(err.message);
        }
    },
    bindMockupEvents(story) {
        const fileInput = this.body.querySelector("#mockup-file");
        const pickButtons = this.body.querySelectorAll("#mockup-pick, #mockup-replace");
        const openButtons = this.body.querySelectorAll("#mockup-open, #mockup-open-action");
        const dropzone = this.body.querySelector("#mockup-dropzone");
        const deleteBtn = this.body.querySelector("#mockup-delete");

        pickButtons.forEach((btn) => btn.addEventListener("click", () => fileInput.click()));
        fileInput.addEventListener("change", () => {
            const file = fileInput.files && fileInput.files[0];
            if (file) this.handleMockupFile(file);
            fileInput.value = "";
        });
        openButtons.forEach((btn) => btn.addEventListener("click", () => {
            if (story.mockup) mockupViewer.open(story.mockup);
        }));
        if (deleteBtn) {
            deleteBtn.addEventListener("click", async () => {
                if (!confirm(t("dialog.deleteMockup"))) return;
                try {
                    await deleteMockup(story.id);
                    await reload();
                    const updated = findStory(story.id);
                    if (updated) this.open(updated);
                } catch (err) {
                    this.showMockupError(err.message);
                }
            });
        }
        if (dropzone) {
            dropzone.addEventListener("click", (e) => {
                if (e.target.closest("button")) return;
                fileInput.click();
            });
            ["dragenter", "dragover"].forEach((eventName) => {
                dropzone.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    dropzone.classList.add("is-dragover");
                });
            });
            ["dragleave", "drop"].forEach((eventName) => {
                dropzone.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    dropzone.classList.remove("is-dragover");
                });
            });
            dropzone.addEventListener("drop", (e) => {
                const file = [...(e.dataTransfer.files || [])].find((f) => f.type.startsWith("image/"));
                if (file) this.handleMockupFile(file);
            });
        }
    },
    bindCommentEvents() {
        const form = this.body.querySelector("#comment-form");
        const errorEl = this.body.querySelector("#comment-error");
        if (form) {
            form.addEventListener("submit", async (e) => {
                e.preventDefault();
                const text = String(form.text.value || "").trim();
                if (!text) {
                    errorEl.textContent = t("comment.errEmpty");
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
                if (!confirm(t("dialog.deleteComment"))) return;
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

const mockupViewer = {
    root: null,
    image: null,
    caption: null,
    open(mockup) {
        this.image.src = mockup.url;
        this.image.alt = `Mockup: ${mockup.originalName}`;
        this.caption.textContent = `${mockup.originalName} · ${formatFileSize(mockup.size)}`;
        this.root.hidden = false;
    },
    close() {
        this.root.hidden = true;
        this.image.src = "";
        this.caption.textContent = "";
    },
};

function findStory(id) {
    return state.stories.find((s) => s.id === id);
}

function openCurrentStoryEditor() {
    const story = findStory(detail.currentId);
    if (!story) return;
    detail.close();
    modal.open(story);
}

function initDetail() {
    detail.root = document.getElementById("detail-root");
    detail.body = document.getElementById("detail-body");
    detail.root.querySelectorAll("[data-close]").forEach((el) => {
        el.addEventListener("click", () => detail.close());
    });
    document.addEventListener("keydown", (e) => {
        const viewer = document.getElementById("mockup-viewer-root");
        if (viewer && !viewer.hidden) return;
        if (e.key === "Escape" && !detail.root.hidden) detail.close();
    });
    document.addEventListener("paste", (e) => {
        if (detail.root.hidden || detail.currentId == null) return;
        const items = [...(e.clipboardData?.items || [])];
        const imageItem = items.find((item) => item.kind === "file" && item.type.startsWith("image/"));
        if (!imageItem) return;
        const file = imageItem.getAsFile();
        if (!file) return;
        e.preventDefault();
        detail.handleMockupFile(file);
    });
    document.getElementById("detail-edit").addEventListener("click", () => {
        openCurrentStoryEditor();
    });
    document.getElementById("detail-delete").addEventListener("click", async () => {
        const story = findStory(detail.currentId);
        if (!story) return;
        if (!confirm(t("dialog.deleteStory", { title: story.title }))) return;
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
    document.querySelector(".board").addEventListener("keydown", (e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        const card = e.target.closest(".card");
        if (!card) return;
        e.preventDefault();
        const id = Number(card.dataset.id);
        const story = findStory(id);
        if (story) detail.open(story);
    });
}

function initMockupViewer() {
    mockupViewer.root = document.getElementById("mockup-viewer-root");
    mockupViewer.image = document.getElementById("mockup-viewer-image");
    mockupViewer.caption = document.getElementById("mockup-viewer-caption");
    mockupViewer.root.querySelectorAll("[data-close]").forEach((el) => {
        el.addEventListener("click", () => mockupViewer.close());
    });
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !mockupViewer.root.hidden) mockupViewer.close();
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
            draggable: ".card",
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

function initFilters() {
    const searchEl = document.getElementById("search");
    const filterEl = document.getElementById("filter-points");
    const pointsRoot = document.querySelector("[data-points-filter]");
    const pointsTrigger = document.getElementById("points-filter-trigger");
    const pointsValue = document.getElementById("points-filter-value");
    const pointsMenu = pointsRoot.querySelector(".custom-select-menu");

    function syncPointsFilter() {
        const selected = filterEl.selectedOptions[0];
        pointsValue.textContent = selected ? selected.textContent : t("toolbar.allPoints");
        pointsMenu.querySelectorAll(".custom-select-option").forEach((option) => {
            option.setAttribute("aria-selected", String(option.dataset.value === filterEl.value));
        });
    }
    syncPointsFilterFn = syncPointsFilter;

    function closePointsFilter() {
        pointsMenu.hidden = true;
        pointsTrigger.setAttribute("aria-expanded", "false");
    }

    function applyPointsFilter(value) {
        filterEl.value = value;
        state.filters.minPoints = Number(value) || 0;
        syncPointsFilter();
        renderBoard();
    }

    searchEl.addEventListener("input", () => {
        state.filters.query = searchEl.value;
        renderBoard();
    });
    filterEl.addEventListener("change", () => {
        applyPointsFilter(filterEl.value);
    });
    pointsTrigger.addEventListener("click", () => {
        const isOpen = !pointsMenu.hidden;
        pointsMenu.hidden = isOpen;
        pointsTrigger.setAttribute("aria-expanded", String(!isOpen));
    });
    pointsMenu.querySelectorAll(".custom-select-option").forEach((option) => {
        option.addEventListener("click", () => {
            applyPointsFilter(option.dataset.value);
            closePointsFilter();
            pointsTrigger.focus();
        });
    });
    document.addEventListener("click", (e) => {
        if (!e.target.closest("[data-points-filter]")) closePointsFilter();
    });
    document.addEventListener("keydown", (e) => {
        if (e.key !== "Escape" || pointsMenu.hidden) return;
        closePointsFilter();
        pointsTrigger.focus();
    });
    syncPointsFilter();
}

function initProjects() {
    const trigger = document.getElementById("project-trigger");
    const menu = document.getElementById("project-menu");
    trigger.addEventListener("click", () => {
        const isOpen = !menu.hidden;
        menu.hidden = isOpen;
        trigger.setAttribute("aria-expanded", String(!isOpen));
    });
    document.getElementById("manage-projects").addEventListener("click", () => {
        closeProjectSwitcher();
        projectsModal.open();
    });
    document.addEventListener("click", (e) => {
        if (!e.target.closest("[data-project-switcher]")) closeProjectSwitcher();
    });
    document.addEventListener("keydown", (e) => {
        if (e.key !== "Escape" || menu.hidden) return;
        closeProjectSwitcher();
        trigger.focus();
    });
}

function initProjectsModal() {
    projectsModal.root = document.getElementById("projects-root");
    projectsModal.form = document.getElementById("project-form");
    projectsModal.list = document.getElementById("projects-list");
    projectsModal.error = document.getElementById("project-error");
    projectsModal.statusSelect = document.getElementById("project-status");
    projectsModal.statusTrigger = document.getElementById("project-status-trigger");
    projectsModal.statusMenu = document.querySelector("[data-project-status-select] .custom-select-menu");
    projectsModal.root.querySelectorAll("[data-close]").forEach((el) => {
        el.addEventListener("click", () => projectsModal.close());
    });
    projectsModal.statusTrigger.addEventListener("click", () => projectsModal.toggleStatusSelect());
    projectsModal.statusMenu.querySelectorAll(".custom-select-option").forEach((option) => {
        option.addEventListener("click", () => {
            projectsModal.statusSelect.value = option.dataset.value;
            projectsModal.syncStatusSelect();
            projectsModal.closeStatusSelect();
            projectsModal.statusTrigger.focus();
        });
    });
    document.addEventListener("click", (e) => {
        if (!e.target.closest("[data-project-status-select]")) projectsModal.closeStatusSelect();
    });
    document.getElementById("project-form-reset").addEventListener("click", () => projectsModal.resetForm());
    projectsModal.form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const payload = projectsModal.collect();
        if (!payload.name) return projectsModal.showError(t("project.errName"));
        try {
            const saved = await saveProject(projectsModal.editingId, payload);
            await loadProjects();
            projectsModal.render();
            projectsModal.resetForm();
            if (!state.selectedProjectId) await selectProject(saved.id);
        } catch (err) {
            projectsModal.showError(err.message);
        }
    });
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && projectsModal.statusMenu && !projectsModal.statusMenu.hidden) {
            projectsModal.closeStatusSelect();
            projectsModal.statusTrigger.focus();
            return;
        }
        if (e.key === "Escape" && !projectsModal.root.hidden) projectsModal.close();
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    initLang();
    initTheme();
    initProjects();
    initProjectsModal();
    try {
        await loadProjects();
    } catch (err) {
        showError(err.message);
    }
    initModal();
    initDetail();
    initMockupViewer();
    initSortable();
    initFilters();
    reload();
});
