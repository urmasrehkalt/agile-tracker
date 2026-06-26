// Lightweight i18n layer (no build step). Exposes globals used by app.js:
//   t(key, params), getLang(), setLang(lang), applyStaticTranslations(root)
// English is the primary language; Estonian is the switchable secondary.

const LANG_KEY = "agiilne-tracker-lang";
const DEFAULT_LANG = "en";
const SUPPORTED_LANGS = ["en", "et"];

const I18N = {
    en: {
        // common / shared
        "common.close": "Close",
        "common.cancel": "Cancel",
        "common.save": "Save",
        "common.edit": "Edit",
        "common.delete": "Delete",
        "common.remove": "Remove",
        "common.description": "Description",
        "common.project": "Project",
        "common.status": "Status",
        // toolbar / header
        "toolbar.searchLabel": "Search stories by title",
        "toolbar.searchPlaceholder": "Search by title…",
        "toolbar.pointsFilterLabel": "Filter by points",
        "toolbar.allPoints": "All points",
        // language switch
        "lang.label": "Language",
        "lang.switchToEnglish": "Switch to English",
        "lang.switchToEstonian": "Switch to Estonian",
        // theme toggle
        "theme.dark": "Dark",
        "theme.light": "Light",
        "theme.switchToDark": "Switch to dark theme",
        "theme.switchToLight": "Switch to light theme",
        // project switcher / projects modal
        "project.switcherLabel": "Selected project",
        "project.switcherDefault": "Project",
        "project.manage": "Manage projects",
        "project.modalTitle": "Projects",
        "project.existing": "Existing projects",
        "project.formNewTitle": "New project",
        "project.editTitle": "Edit project #{id}",
        "project.fieldName": "Name *",
        "project.fieldColor": "Color",
        "project.fieldOwner": "Owner",
        "project.fieldClient": "Client",
        "project.fieldDeadline": "Deadline",
        "project.saveButton": "Save project",
        "project.errName": "Project name is required.",
        "projectStatus.active": "Active",
        "projectStatus.archived": "Archived",
        // columns
        "column.todoSubtitle": "Planned work",
        "column.doingSubtitle": "Stories in progress",
        "column.doneSubtitle": "Done & verified",
        "column.countOne": "{n} story",
        "column.countMany": "{n} stories",
        // status labels (kept identical across locales — Kanban terms)
        "status.todo": "Todo / Backlog",
        "status.doing": "Doing",
        "status.done": "Done",
        // story modal / form
        "story.addButton": "+ New story",
        "story.modalNewTitle": "New story",
        "story.modalEditTitle": "Edit story #{number}",
        "story.fieldTitle": "Title *",
        "story.fieldPoints": "Points *",
        "story.criteriaLegend": "Acceptance criteria * (at least 1)",
        "story.criteriaHeading": "Acceptance criteria",
        "story.addCriterion": "+ Add criterion",
        "story.criterionPlaceholder": "Acceptance criterion",
        "story.errTitle": "Title is required.",
        "story.errPoints": "Points must be a non-negative integer.",
        "story.errCriteria": "Add at least one acceptance criterion.",
        "story.cardAria": "Open story #{number}: {title}",
        "story.commentCount": "{n} comments",
        // empty states
        "empty.title": "No stories here yet.",
        "empty.todo": "Add the first story or adjust the filters.",
        "empty.doing": "Drag a story here when work starts.",
        "empty.done": "Completed stories appear here.",
        "empty.filteredTitle": "No stories match the filters.",
        "empty.filteredHint": "Try changing the search or points filter.",
        // detail view
        "detail.created": "Created: {date}",
        "detail.updated": "Updated: {date}",
        "detail.editInline": "Edit description and criteria",
        // comments
        "comment.heading": "Comments",
        "comment.empty": "No comments yet.",
        "comment.placeholder": "Add a comment…",
        "comment.addButton": "Add",
        "comment.deleteAria": "Delete comment",
        "comment.errEmpty": "Comment must not be empty.",
        // mockup
        "mockup.title": "Mockup",
        "mockup.openAria": "Open mockup full size",
        "mockup.openFull": "Open full size",
        "mockup.replace": "Replace",
        "mockup.dropzoneAria": "Add a mockup by dragging, choosing a file, or pasting from the clipboard",
        "mockup.dropzoneTitle": "Drag a mockup here",
        "mockup.dropzoneHint": "Or choose a PNG, JPEG or WebP file up to 5 MB. Clipboard paste works while the detail view is open.",
        "mockup.pick": "Choose file",
        "mockup.errChoose": "Choose a mockup file.",
        "mockup.errType": "Allowed mockup types are PNG, JPEG and WebP.",
        "mockup.errSize": "Maximum mockup size is 5 MB.",
        "mockup.errEmpty": "Mockup file must not be empty.",
        // confirm dialogs
        "dialog.deleteStory": "Delete story \"{title}\"?",
        "dialog.deleteProject": "Delete project \"{name}\"? The project must be empty.",
        "dialog.replaceMockup": "Replace the existing mockup with a new one?",
        "dialog.deleteMockup": "Delete the mockup?",
        "dialog.deleteComment": "Delete the comment?",
        // status / error messages
        "status.loading": "Loading stories…",
        "error.field": "field",
        "error.invalid": "invalid",
        "error.loadStories": "Failed to load data (HTTP {status})",
        "error.loadProjects": "Failed to load projects (HTTP {status})",
        "error.save": "Saving failed (HTTP {status})",
        "error.update": "Update failed (HTTP {status})",
        "error.delete": "Deletion failed (HTTP {status})",
        "error.commentSave": "Failed to save comment (HTTP {status})",
        "error.commentDelete": "Failed to delete comment (HTTP {status})",
        "error.mockupSave": "Failed to save mockup (HTTP {status})",
        "error.mockupDelete": "Failed to delete mockup (HTTP {status})",
        "error.projectSave": "Failed to save project (HTTP {status})",
        "error.projectDelete": "Failed to delete project (HTTP {status})",
        "error.status": "Failed to change status (HTTP {status})",
        "error.reorder": "Failed to save order (HTTP {status})",
    },
    et: {
        // common / shared
        "common.close": "Sulge",
        "common.cancel": "Tühista",
        "common.save": "Salvesta",
        "common.edit": "Muuda",
        "common.delete": "Kustuta",
        "common.remove": "Eemalda",
        "common.description": "Kirjeldus",
        "common.project": "Projekt",
        "common.status": "Staatus",
        // toolbar / header
        "toolbar.searchLabel": "Otsi story pealkirja järgi",
        "toolbar.searchPlaceholder": "Otsi pealkirja järgi…",
        "toolbar.pointsFilterLabel": "Filtreeri punktide järgi",
        "toolbar.allPoints": "Kõik punktid",
        // language switch
        "lang.label": "Keel",
        "lang.switchToEnglish": "Lülita inglise keelele",
        "lang.switchToEstonian": "Lülita eesti keelele",
        // theme toggle
        "theme.dark": "Tume",
        "theme.light": "Hele",
        "theme.switchToDark": "Lülita tume teema sisse",
        "theme.switchToLight": "Lülita hele teema sisse",
        // project switcher / projects modal
        "project.switcherLabel": "Valitud projekt",
        "project.switcherDefault": "Projekt",
        "project.manage": "Halda projekte",
        "project.modalTitle": "Projektid",
        "project.existing": "Olemasolevad projektid",
        "project.formNewTitle": "Uus projekt",
        "project.editTitle": "Muuda projekti #{id}",
        "project.fieldName": "Nimi *",
        "project.fieldColor": "Värv",
        "project.fieldOwner": "Omanik",
        "project.fieldClient": "Klient",
        "project.fieldDeadline": "Tähtaeg",
        "project.saveButton": "Salvesta projekt",
        "project.errName": "Projekti nimi on kohustuslik.",
        "projectStatus.active": "Aktiivne",
        "projectStatus.archived": "Arhiveeritud",
        // columns
        "column.todoSubtitle": "Planeeritud töö",
        "column.doingSubtitle": "Töös olevad story'd",
        "column.doneSubtitle": "Valmis ja kontrollitud",
        "column.countOne": "{n} story",
        "column.countMany": "{n} story",
        // status labels (kept identical across locales — Kanban terms)
        "status.todo": "Todo / Backlog",
        "status.doing": "Doing",
        "status.done": "Done",
        // story modal / form
        "story.addButton": "+ Uus story",
        "story.modalNewTitle": "Uus story",
        "story.modalEditTitle": "Muuda story #{number}",
        "story.fieldTitle": "Pealkiri *",
        "story.fieldPoints": "Punktid *",
        "story.criteriaLegend": "Vastuvõtutingimused * (vähemalt 1)",
        "story.criteriaHeading": "Vastuvõtutingimused",
        "story.addCriterion": "+ Lisa tingimus",
        "story.criterionPlaceholder": "Vastuvõtutingimus",
        "story.errTitle": "Pealkiri on kohustuslik.",
        "story.errPoints": "Punktid peavad olema mittenegatiivne täisarv.",
        "story.errCriteria": "Lisa vähemalt üks vastuvõtutingimus.",
        "story.cardAria": "Ava story #{number}: {title}",
        "story.commentCount": "{n} kommentaari",
        // empty states
        "empty.title": "Siin pole veel story'sid.",
        "empty.todo": "Lisa esimene story või muuda filtreid.",
        "empty.doing": "Lohista siia story, kui töö algab.",
        "empty.done": "Valmis story'd ilmuvad siia.",
        "empty.filteredTitle": "Filtritele vastavaid story'sid ei leitud.",
        "empty.filteredHint": "Proovi otsingut või punktifiltrit muuta.",
        // detail view
        "detail.created": "Loodud: {date}",
        "detail.updated": "Uuendatud: {date}",
        "detail.editInline": "Muuda kirjeldust ja tingimusi",
        // comments
        "comment.heading": "Kommentaarid",
        "comment.empty": "Veel pole kommentaare.",
        "comment.placeholder": "Lisa kommentaar…",
        "comment.addButton": "Lisa",
        "comment.deleteAria": "Kustuta kommentaar",
        "comment.errEmpty": "Kommentaar ei tohi olla tühi.",
        // mockup
        "mockup.title": "Mockup",
        "mockup.openAria": "Ava mockup suurelt",
        "mockup.openFull": "Ava suurelt",
        "mockup.replace": "Asenda",
        "mockup.dropzoneAria": "Lisa mockup lohistades, failivalikuga või clipboardist kleepides",
        "mockup.dropzoneTitle": "Lohista mockup siia",
        "mockup.dropzoneHint": "Või vali PNG, JPEG või WebP fail kuni 5 MB. Clipboardist kleepimine töötab, kui detailvaade on avatud.",
        "mockup.pick": "Vali fail",
        "mockup.errChoose": "Vali mockupi fail.",
        "mockup.errType": "Lubatud mockupi tüübid on PNG, JPEG ja WebP.",
        "mockup.errSize": "Mockupi maksimaalne suurus on 5 MB.",
        "mockup.errEmpty": "Mockupi fail ei tohi olla tühi.",
        // confirm dialogs
        "dialog.deleteStory": "Kustuta story \"{title}\"?",
        "dialog.deleteProject": "Kustuta projekt \"{name}\"? Projekt peab olema tühi.",
        "dialog.replaceMockup": "Asenda olemasolev mockup uuega?",
        "dialog.deleteMockup": "Kustuta mockup?",
        "dialog.deleteComment": "Kustuta kommentaar?",
        // status / error messages
        "status.loading": "Laadin story'sid…",
        "error.field": "väli",
        "error.invalid": "vigane",
        "error.loadStories": "Andmete laadimine ebaõnnestus (HTTP {status})",
        "error.loadProjects": "Projektide laadimine ebaõnnestus (HTTP {status})",
        "error.save": "Salvestamine ebaõnnestus (HTTP {status})",
        "error.update": "Uuendamine ebaõnnestus (HTTP {status})",
        "error.delete": "Kustutamine ebaõnnestus (HTTP {status})",
        "error.commentSave": "Kommentaari salvestamine ebaõnnestus (HTTP {status})",
        "error.commentDelete": "Kommentaari kustutamine ebaõnnestus (HTTP {status})",
        "error.mockupSave": "Mockupi salvestamine ebaõnnestus (HTTP {status})",
        "error.mockupDelete": "Mockupi kustutamine ebaõnnestus (HTTP {status})",
        "error.projectSave": "Projekti salvestamine ebaõnnestus (HTTP {status})",
        "error.projectDelete": "Projekti kustutamine ebaõnnestus (HTTP {status})",
        "error.status": "Staatuse muutmine ebaõnnestus (HTTP {status})",
        "error.reorder": "Järjekorra salvestamine ebaõnnestus (HTTP {status})",
    },
};

function getLang() {
    const stored = localStorage.getItem(LANG_KEY);
    return SUPPORTED_LANGS.includes(stored) ? stored : DEFAULT_LANG;
}

let currentLang = getLang();

function setLang(lang) {
    currentLang = SUPPORTED_LANGS.includes(lang) ? lang : DEFAULT_LANG;
    localStorage.setItem(LANG_KEY, currentLang);
    document.documentElement.lang = currentLang;
    return currentLang;
}

function t(key, params) {
    const table = I18N[currentLang] || I18N[DEFAULT_LANG];
    let str = table[key];
    if (str == null) str = I18N[DEFAULT_LANG][key];
    if (str == null) return key;
    if (params) {
        str = str.replace(/\{(\w+)\}/g, (m, name) => (params[name] != null ? String(params[name]) : m));
    }
    return str;
}

function applyStaticTranslations(root = document) {
    root.querySelectorAll("[data-i18n]").forEach((el) => {
        el.textContent = t(el.dataset.i18n);
    });
    root.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
        el.setAttribute("placeholder", t(el.dataset.i18nPlaceholder));
    });
    root.querySelectorAll("[data-i18n-aria-label]").forEach((el) => {
        el.setAttribute("aria-label", t(el.dataset.i18nAriaLabel));
    });
}
