/*
 * ApiLog frontend (plain JavaScript, no framework).
 *
 * How offline mode works:
 * - IndexedDB keeps a local copy of apiaries, hives and inspections, plus a
 *   queue of changes made without network (store "queue").
 * - Every change is saved locally first, so the app reacts at once. Then we
 *   try to send it. Without network it waits in the queue.
 * - Each inspection has a client_uuid, so sending it twice makes no duplicate.
 * - When the network comes back ("online" event), flushQueue() sends the rest.
 */

const $ = (sel, root = document) => root.querySelector(sel);
const el = (tag, props = {}, ...kids) => {
  const n = document.createElement(tag);
  Object.entries(props).forEach(([k, v]) => {
    if (k === "class") n.className = v;
    else if (k.startsWith("on") && typeof v === "function")
      n.addEventListener(k.slice(2), v);
    else if (v !== null && v !== undefined) n.setAttribute(k, v);
  });
  // Children are always added as text nodes, never with innerHTML, so text
  // typed by the user can't run as code (XSS).
  kids.flat().forEach((c) =>
    n.appendChild(typeof c === "string" ? document.createTextNode(c) : c)
  );
  return n;
};
const uuid = () =>
  (crypto.randomUUID && crypto.randomUUID()) ||
  "id-" + Date.now() + "-" + Math.random().toString(16).slice(2);
/* t() for translations comes from i18n.js. All scripts share one global
 * scope, so don't declare another `t` here: the browser would reject the
 * whole file. */

/* IndexedDB helpers */
const DB_NAME = "apilog";
const STORES = ["apiaries", "hives", "inspections", "queue"];
let _db;

function openDB() {
  return new Promise((res, rej) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      STORES.forEach((s) => {
        if (!db.objectStoreNames.contains(s))
          db.createObjectStore(s, { keyPath: s === "queue" ? "qid" : "id" });
      });
    };
    req.onsuccess = () => res((_db = req.result));
    req.onerror = () => rej(req.error);
  });
}
function tx(store, mode = "readonly") {
  return _db.transaction(store, mode).objectStore(store);
}
function idbAll(store) {
  return new Promise((res, rej) => {
    const r = tx(store).getAll();
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
function idbPut(store, val) {
  return new Promise((res, rej) => {
    const r = tx(store, "readwrite").put(val);
    r.onsuccess = () => res(val);
    r.onerror = () => rej(r.error);
  });
}
function idbDel(store, key) {
  return new Promise((res, rej) => {
    const r = tx(store, "readwrite").delete(key);
    r.onsuccess = () => res();
    r.onerror = () => rej(r.error);
  });
}
async function idbReplaceAll(store, items) {
  const os = tx(store, "readwrite");
  await new Promise((res) => {
    const c = os.clear();
    c.onsuccess = res;
  });
  items.forEach((it) => os.put(it));
}

/* API and sync */
const state = { apiaries: [], hives: [], inspections: [], alerts: [], pending: 0 };

/* HTTP error from the server. (Without network fetch throws a TypeError instead.) */
class ApiError extends Error {
  constructor(status) {
    super("HTTP " + status);
    this.status = status;
  }
}

async function api(path, opts = {}) {
  const res = await fetch("/api" + path, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) throw new ApiError(res.status);
  return res.status === 204 ? null : res.json();
}

/* Local records with a negative (temporary) id are not on the server yet. */
const isTempId = (id) => typeof id === "number" && id < 0;

/* Server data plus local records that are still waiting in the queue. */
async function withUnsynced(store, serverItems) {
  const unsynced = (await idbAll(store)).filter((x) => isTempId(x.id));
  return serverItems.concat(unsynced);
}

/* Get fresh data from the server (when online) and update the local copy. */
async function refreshFromServer() {
  if (!navigator.onLine) return;
  try {
    const [apiaries, hives, inspections, alerts] = await Promise.all([
      api("/apiaries"),
      api("/hives"),
      api("/inspections"),
      api("/alerts"),
    ]);
    state.apiaries = await withUnsynced("apiaries", apiaries);
    state.hives = await withUnsynced("hives", hives);
    state.inspections = await withUnsynced("inspections", inspections);
    state.alerts = alerts;
    await idbReplaceAll("apiaries", state.apiaries);
    await idbReplaceAll("hives", state.hives);
    await idbReplaceAll("inspections", state.inspections);
  } catch (e) {
    console.warn("refresh nieudany, korzystam z cache", e);
  }
}

/* Load data from the local copy (used offline and on start). */
async function loadFromCache() {
  state.apiaries = await idbAll("apiaries");
  state.hives = await idbAll("hives");
  state.inspections = await idbAll("inspections");
  state.pending = (await idbAll("queue")).length;
}

/*
 * Save that also works offline:
 *  1. save to the local copy, so the UI shows the change at once,
 *  2. add the request to the queue,
 *  3. try to send the queue to the server.
 */
async function saveQueued({ store, method, path, body, localItem }) {
  if (localItem) await idbPut(store, localItem);
  // For new records we remember the temporary id, so after the server saves
  // the record we can replace it with the real id (locally and in the queue).
  const tempId = method === "POST" && localItem && isTempId(localItem.id) ? localItem.id : null;
  // seq keeps the original order. IndexedDB returns records sorted by key
  // (a random qid), so without it a hive could be sent before its apiary.
  const qItem = { qid: uuid(), seq: nextSeq(), store, method, path, body, tempId };
  await idbPut("queue", qItem);
  state.pending = (await idbAll("queue")).length;
  await flushQueue();
}

/* Field that other records use to point to a record in this store. */
const REF_FIELD = { apiaries: "apiary_id", hives: "hive_id" };
/* Child records, deleted together with the parent (the server does the same). */
const CHILD_STORE = { apiaries: "hives", hives: "inspections" };

/* Delete a record locally (with its children) and queue a DELETE request.
 * A record created offline (negative id) is not on the server yet, so we
 * only remove it locally and drop its requests from the queue. */
async function deleteQueued(store, id) {
  await deleteLocalTree(store, id);
  if (isTempId(id)) {
    for (const it of await idbAll("queue")) {
      if (it.tempId === id || it.path === `/${store}/${id}`) await idbDel("queue", it.qid);
    }
    state.pending = (await idbAll("queue")).length;
    return;
  }
  const qItem = { qid: uuid(), seq: nextSeq(), store, method: "DELETE", path: `/${store}/${id}`, body: null, tempId: null };
  await idbPut("queue", qItem);
  state.pending = (await idbAll("queue")).length;
  await flushQueue();
}

async function deleteLocalTree(store, id) {
  const childStore = CHILD_STORE[store];
  if (childStore) {
    for (const child of await idbAll(childStore)) {
      if (child[REF_FIELD[store]] === id) await deleteLocalTree(childStore, child.id);
    }
  }
  await idbDel(store, id);
}

/* Ask for confirmation, delete and refresh the view. */
async function confirmDelete(store, id, question, afterDelete) {
  if (!window.confirm(question)) return;
  await deleteQueued(store, id);
  await loadFromCache();
  toast(navigator.onLine ? t("deleted") : t("deleted_offline"));
  afterDelete();
  render();
}

/* Replace a temporary id with the server id in a queued request.
 * Returns true if something changed. */
function rewriteQueuedRefs(item, store, tempId, realId) {
  let changed = false;
  const field = REF_FIELD[store];
  if (field && item.body && item.body[field] === tempId) {
    item.body[field] = realId;
    changed = true;
  }
  if (item.path === `/${store}/${tempId}`) {
    item.path = `/${store}/${realId}`;
    changed = true;
  }
  return changed;
}

/* After a successful POST: replace the temporary local record with the one
 * from the server and fix the records that point to it. */
async function replaceTempRecord(store, tempId, saved) {
  await idbDel(store, tempId);
  await idbPut(store, saved);
  const field = REF_FIELD[store];
  const childStore = { apiaries: "hives", hives: "inspections" }[store];
  if (field && childStore) {
    for (const child of await idbAll(childStore)) {
      if (child[field] === tempId) await idbPut(childStore, { ...child, [field]: saved.id });
    }
  }
  if (store === "hives" && openHiveId === tempId) openHiveId = saved.id;
}

let _lastSeq = 0;
function nextSeq() {
  _lastSeq = Math.max(Date.now(), _lastSeq + 1);
  return _lastSeq;
}

let _flushing = false;
async function flushQueue() {
  if (_flushing || !navigator.onLine) return;
  _flushing = true;
  let rejected = 0;
  try {
    const items = (await idbAll("queue")).sort((a, b) => (a.seq || 0) - (b.seq || 0));
    for (let n = 0; n < items.length; n++) {
      const it = items[n];
      try {
        const saved = await api(it.path, {
          method: it.method,
          body: it.body ? JSON.stringify(it.body) : undefined,
        });
        if (it.tempId != null && saved && saved.id != null) {
          await replaceTempRecord(it.store, it.tempId, saved);
          for (const later of items.slice(n + 1)) {
            if (rewriteQueuedRefs(later, it.store, it.tempId, saved.id)) await idbPut("queue", later);
          }
        }
        await idbDel("queue", it.qid);
      } catch (e) {
        if (e instanceof ApiError && e.status >= 400 && e.status < 500) {
          // The server rejected the data (e.g. validation). Retrying won't help,
          // and keeping it would block the whole queue, so we drop it.
          await idbDel("queue", it.qid);
          if (it.tempId != null) await idbDel(it.store, it.tempId);
          rejected++;
          continue;
        }
        // No network or a server error (5xx): keep it in the queue for later.
        break;
      }
    }
    if (rejected) toast(t("sync_rejected", rejected));
    state.pending = (await idbAll("queue")).length;
    if (state.pending === 0) await refreshFromServer();
  } finally {
    _flushing = false;
    updateNetBadge();
    render();
  }
}

/* Views */
let currentTab = "hives";
let openHiveId = null; // set when the hive details page is open

function toast(msg) {
  const box = $("#toast");
  box.textContent = msg;
  box.classList.add("show");
  setTimeout(() => box.classList.remove("show"), 1800);
}

function updateNetBadge() {
  const b = $("#netBadge");
  if (!navigator.onLine) {
    b.className = "net-badge offline";
    b.textContent = state.pending ? t("net_offline_pending", state.pending) : t("net_offline");
  } else if (state.pending) {
    b.className = "net-badge pending";
    b.textContent = t("net_syncing", state.pending);
  } else {
    b.className = "net-badge";
    b.textContent = t("net_online");
  }
}

function stars(n) {
  if (!n) return "—";
  return "★".repeat(n) + "☆".repeat(Math.max(0, 5 - n));
}

const queenLabel = (s) => t("qs_" + s) || s;
const moodLabel = (s) => t("md_" + s) || s;

/* "Fact of the day" card, from the local knowledge base (works offline). */
function factCard() {
  const fact = window.KNOWLEDGE ? window.KNOWLEDGE.factOfTheDay() : "";
  return el("div", { class: "card fact" },
    el("div", { class: "fact-label" }, t("fact_label")),
    el("div", {}, fact)
  );
}

/* Render a list of advice objects {level, title, text, next_review_days}. */
function renderAdviceList(list, opts = {}) {
  const wrap = el("div", {});
  if (opts.heading) wrap.appendChild(el("div", { class: "advice-head" }, opts.heading));
  (list || []).forEach((a) => {
    wrap.appendChild(
      el("div", { class: "advice " + (a.level || "info") },
        el("div", { class: "advice-title" }, a.title),
        el("div", { class: "advice-text" }, a.text),
        a.next_review_days
          ? el("div", { class: "advice-when" }, t("advice_review_in", a.next_review_days))
          : ""
      )
    );
  });
  return wrap;
}

/* Read the saved advice (a JSON string) without crashing on bad data. */
function parseAdvice(str) {
  if (!str) return null;
  try { return JSON.parse(str); } catch (e) { return null; }
}

function render() {
  const v = $("#view");
  v.innerHTML = "";
  updateNetBadge();

  if (openHiveId != null) return renderHiveDetail(v);

  if (currentTab === "apiaries") return renderApiaries(v);
  if (currentTab === "alerts") return renderAlerts(v);
  if (currentTab === "knowledge") return renderKnowledge(v);
  return renderHives(v);
}

/* Knowledge tab: development cycle and worker bee calendar */
function renderKnowledge(v) {
  $("#title").textContent = t("knowledge");
  const K = window.KNOWLEDGE || {};

  // Development cycle
  v.appendChild(el("h2", { class: "section" }, t("dev_cycle_h")));
  v.appendChild(el("div", { class: "sub", style: "margin-bottom:8px" }, t("dev_cycle_sub")));

  (K.devCycleLocalized ? K.devCycleLocalized() : []).forEach((c) => {
    const card = el("div", { class: "card" },
      el("div", { class: "row between" },
        el("h3", {}, `${c.emoji} ${c.caste}`),
        el("span", { class: "pill", style: `background:${c.color};color:#fff` }, `${c.total} ${t("days")}`))
    );
    // bar that shows how long each stage takes
    const bar = el("div", { class: "dev-bar" });
    c.stages.forEach((s) => {
      bar.appendChild(el("div", { class: "dev-seg", style: `flex:${s.days};background:${c.color}`, title: s.name },
        el("span", {}, s.name)));
    });
    card.appendChild(bar);
    c.stages.forEach((s) => {
      card.appendChild(el("div", { class: "dev-stage" },
        el("div", { class: "dev-stage-h" }, `${s.name} · ${s.range}`),
        el("div", { class: "dev-stage-d" }, s.desc)));
    });
    card.appendChild(el("div", { class: "sub", style: "margin-top:8px" }, "↳ " + c.after));
    v.appendChild(card);
  });

  // Worker bee calendar
  v.appendChild(el("h2", { class: "section" }, t("worker_cal_h")));
  v.appendChild(el("div", { class: "sub", style: "margin-bottom:8px" }, t("worker_cal_sub")));

  (K.workerCalendarLocalized ? K.workerCalendarLocalized() : []).forEach((r) => {
    v.appendChild(
      el("div", { class: "card worker-role", style: `border-left:5px solid ${r.color}` },
        el("div", { class: "row between" },
          el("h3", {}, `${r.emoji} ${r.role}`),
          el("span", { class: "pill" }, r.range)),
        el("div", { class: "dev-stage-d", style: "margin-top:4px" }, r.desc)
      )
    );
  });

  v.appendChild(el("div", { class: "sub", style: "margin:14px 0 4px;text-align:center" }, t("offline_note")));
}

/* Apiaries */
function renderApiaries(v) {
  $("#title").textContent = t("apiaries");
  v.appendChild(
    el("button", { onclick: () => formApiary() }, t("new_apiary"))
  );
  if (!state.apiaries.length)
    v.appendChild(el("div", { class: "empty" }, t("no_apiaries")));
  state.apiaries.forEach((a) => {
    const nHives = state.hives.filter((h) => h.apiary_id === a.id).length;
    v.appendChild(
      el("div", { class: "card" },
        el("div", { class: "row between" },
          el("div", {},
            el("h3", {}, a.name),
            el("div", { class: "sub" }, `${a.location || t("no_location")} · ${t("hives_count", nHives)}`)
          ),
          el("div", { class: "row", style: "gap:6px" },
            el("button", { class: "small secondary", onclick: () => formApiary(a) }, t("edit")),
            el("button", { class: "small danger", onclick: () =>
              confirmDelete("apiaries", a.id, t("confirm_delete_apiary", a.name, nHives), () => {}) }, t("delete"))
          )
        ),
        a.notes ? el("div", { class: "sub", style: "margin-top:6px" }, a.notes) : ""
      )
    );
  });
}

function formApiary(existing) {
  const v = $("#view");
  v.innerHTML = "";
  $("#title").textContent = existing ? t("edit_apiary") : t("new_apiary");
  const f = el("form", { class: "card",
    onsubmit: async (e) => {
      e.preventDefault();
      const body = {
        name: f.elements.name.value.trim(),
        location: f.location.value.trim() || null,
        notes: f.notes.value.trim() || null,
      };
      if (!body.name) return toast(t("need_apiary_name"));
      const id = existing ? existing.id : -Date.now(); // negative id = temporary local record
      const localItem = { ...(existing || {}), ...body, id };
      await saveQueued({
        store: "apiaries",
        method: existing ? "PUT" : "POST",
        path: existing ? `/apiaries/${existing.id}` : "/apiaries",
        body,
        localItem,
      });
      if (!existing) {
        // show it in the list at once
        state.apiaries = await idbAll("apiaries");
      }
      toast(t("saved"));
      currentTab = "apiaries";
      render();
    },
  });
  f.appendChild(el("label", {}, t("apiary_name") + " *"));
  f.appendChild(el("input", { name: "name", value: existing?.name || "", required: "" }));
  f.appendChild(el("label", {}, t("location")));
  f.appendChild(el("input", { name: "location", value: existing?.location || "" }));
  f.appendChild(el("label", {}, t("notes")));
  f.appendChild(el("textarea", { name: "notes" }, existing?.notes || ""));
  f.appendChild(el("div", { class: "row", style: "margin-top:12px;gap:8px" },
    el("button", { type: "submit", class: "grow" }, t("save")),
    el("button", { type: "button", class: "secondary", onclick: () => { currentTab = "apiaries"; render(); } }, t("cancel"))
  ));
  v.appendChild(f);
}

/* Hives */
function renderHives(v) {
  $("#title").textContent = t("hives");
  v.appendChild(factCard());
  v.appendChild(el("button", { onclick: () => formHive() }, t("new_hive")));

  if (!state.apiaries.length) {
    v.appendChild(el("div", { class: "empty" }, t("need_apiary_first")));
    return;
  }
  const active = state.hives.filter((h) => h.active !== false);
  if (!active.length)
    v.appendChild(el("div", { class: "empty" }, t("no_hives")));

  active.forEach((h) => {
    const insp = state.inspections
      .filter((i) => i.hive_id === h.id)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
    const last = insp[0];
    const hiveAlerts = state.alerts.filter((a) => a.hive_id === h.id);
    const worst = hiveAlerts.some((a) => a.level === "danger")
      ? "danger" : hiveAlerts.some((a) => a.level === "warning") ? "warn" : null;

    v.appendChild(
      el("div", { class: "card", onclick: () => { openHiveId = h.id; render(); }, style: "cursor:pointer" },
        el("div", { class: "row between" },
          el("h3", {}, `🍯 ${h.name}`),
          worst ? el("span", { class: `pill ${worst}` }, t("alerts_pill", hiveAlerts.length)) : el("span", { class: "pill ok" }, t("ok_pill"))
        ),
        el("div", { class: "sub" },
          [h.hive_type, h.bee_race, h.queen_year ? t("queen_year") + " " + h.queen_year : null]
            .filter(Boolean).join(" · ") || t("no_details")),
        last
          ? el("div", { class: "sub", style: "margin-top:6px" },
              `${t("last_inspection")}: ${last.date} · ${t("brood")} ${stars(last.brood_pattern)}`)
          : el("div", { class: "sub", style: "margin-top:6px" }, t("no_inspections"))
      )
    );
  });
}

function formHive(existing) {
  const v = $("#view");
  v.innerHTML = "";
  $("#title").textContent = existing ? t("edit_hive") : t("new_hive");
  const f = el("form", { class: "card",
    onsubmit: async (e) => {
      e.preventDefault();
      const body = {
        apiary_id: parseInt(f.apiary_id.value, 10),
        name: f.elements.name.value.trim(),
        hive_type: f.hive_type.value.trim() || null,
        bee_race: f.bee_race.value.trim() || null,
        queen_year: f.queen_year.value ? parseInt(f.queen_year.value, 10) : null,
        queen_color: f.queen_color.value || null,
        active: true,
      };
      if (!body.name) return toast(t("need_hive_name"));
      const id = existing ? existing.id : -Date.now();
      const localItem = { ...(existing || {}), ...body, id };
      await saveQueued({
        store: "hives",
        method: existing ? "PUT" : "POST",
        path: existing ? `/hives/${existing.id}` : "/hives",
        body,
        localItem,
      });
      state.hives = await idbAll("hives");
      toast(t("saved"));
      currentTab = "hives"; openHiveId = null;
      render();
    },
  });
  f.appendChild(el("label", {}, t("hive_apiary") + " *"));
  const sel = el("select", { name: "apiary_id", required: "" });
  state.apiaries.forEach((a) =>
    sel.appendChild(el("option", { value: a.id, ...(existing?.apiary_id === a.id ? { selected: "" } : {}) }, a.name)));
  f.appendChild(sel);
  f.appendChild(el("label", {}, t("hive_name") + " *"));
  f.appendChild(el("input", { name: "name", value: existing?.name || "", placeholder: "U-01" }));
  f.appendChild(el("div", { class: "grid2" },
    el("div", {}, el("label", {}, t("hive_type")),
      el("input", { name: "hive_type", value: existing?.hive_type || "", placeholder: "Langstroth / Dadant…" })),
    el("div", {}, el("label", {}, t("bee_race")),
      el("input", { name: "bee_race", value: existing?.bee_race || "", placeholder: "carnica…" }))
  ));
  f.appendChild(el("div", { class: "grid2" },
    el("div", {}, el("label", {}, t("queen_year")),
      el("input", { name: "queen_year", type: "number", value: existing?.queen_year || "" })),
    el("div", {}, el("label", {}, t("queen_color")),
      (() => {
        const s = el("select", { name: "queen_color" });
        const colors = t("colors");
        // Colour values are saved in Polish; the labels come from i18n.js.
        ["", "biały", "żółty", "czerwony", "zielony", "niebieski"]
          .forEach((val) => s.appendChild(el("option", { value: val, ...(existing?.queen_color === val ? { selected: "" } : {}) }, colors[val] || val)));
        return s;
      })())
  ));
  f.appendChild(el("div", { class: "row", style: "margin-top:12px;gap:8px" },
    el("button", { type: "submit", class: "grow" }, t("save")),
    el("button", { type: "button", class: "secondary", onclick: () => { currentTab = "hives"; openHiveId = null; render(); } }, t("cancel"))
  ));
  v.appendChild(f);
}

/* Hive details and inspection history */
function renderHiveDetail(v) {
  const h = state.hives.find((x) => x.id === openHiveId);
  if (!h) { openHiveId = null; return render(); }
  $("#title").textContent = h.name;

  v.appendChild(el("button", { class: "ghost secondary small back", style: "margin-bottom:8px",
    onclick: () => { openHiveId = null; render(); } }, t("back_to_hives")));

  v.appendChild(el("div", { class: "card" },
    el("div", { class: "row between" },
      el("h3", {}, `🍯 ${h.name}`),
      el("div", { class: "row", style: "gap:6px" },
        el("button", { class: "small secondary", onclick: () => formHive(h) }, t("edit_hive_btn")),
        el("button", { class: "small danger", onclick: () =>
          confirmDelete("hives", h.id, t("confirm_delete_hive", h.name), () => { openHiveId = null; }) }, t("delete"))
      )),
    el("div", { class: "sub" },
      [h.hive_type, h.bee_race, h.queen_year ? t("queen_year") + " " + h.queen_year + (h.queen_color ? ` (${h.queen_color})` : "") : null]
        .filter(Boolean).join(" · ") || t("no_details"))
  ));

  v.appendChild(el("button", { style: "margin-bottom:12px", onclick: () => formInspection(h) }, t("new_inspection")));

  const insp = state.inspections
    .filter((i) => i.hive_id === h.id)
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  v.appendChild(el("h2", { class: "section" }, t("inspection_history")));
  if (!insp.length) v.appendChild(el("div", { class: "empty" }, t("no_hive_inspections")));

  insp.forEach((i) => {
    const tags = [];
    if (i.queen_status) tags.push(queenLabel(i.queen_status));
    if (i.brood_pattern) tags.push(t("lbl_brood") + " " + stars(i.brood_pattern));
    if (i.swarm_mood && i.swarm_mood !== "spokojny") tags.push(moodLabel(i.swarm_mood));
    if (i.queen_cells) tags.push(t("lbl_cells") + i.queen_cells);
    if (i.varroa_count != null) tags.push(t("lbl_varroa") + i.varroa_count);
    if (i.treatment) tags.push("💊 " + i.treatment);
    if (i.feeding) tags.push("🍽️ " + i.feeding);
    if (i.honey_harvested_kg) tags.push("🍯 " + i.honey_harvested_kg + " kg");

    v.appendChild(
      el("div", { class: "card timeline-item" },
        el("div", { class: "row between" },
          el("strong", {}, i.date),
          el("div", { class: "row", style: "gap:6px" },
            i.id > 0 ? "" : el("span", { class: "pill warn" }, t("not_synced")),
            el("button", { class: "small secondary", onclick: () =>
              confirmDelete("inspections", i.id, t("confirm_delete_inspection", i.date), () => {}) }, t("delete"))
          )),
        el("div", { class: "sub", style: "margin-top:4px" }, tags.join(" · ") || "—"),
        i.notes ? el("div", { style: "margin-top:6px" }, i.notes) : "",
        i.todo ? el("div", { class: "sub", style: "margin-top:6px" }, t("todo_label") + i.todo) : "",
        adviceBlock(i)
      )
    );
  });
}

/* Saved advice shown in an inspection card (collapsible). */
function adviceBlock(i) {
  const parsed = parseAdvice(i.advice);
  const list = parsed && parsed.advice ? parsed.advice : null;
  if (!list || !list.length) return "";
  const details = el("details", { class: "advice-details" });
  details.appendChild(el("summary", {}, t("advice_toggle", list.length)));
  details.appendChild(renderAdviceList(list));
  return details;
}

/* Screen shown right after saving an inspection, with the advice. */
function showAdviceScreen(hive, result) {
  const v = $("#view");
  v.innerHTML = "";
  $("#title").textContent = t("advice_screen_title");
  v.appendChild(el("div", { class: "card" },
    el("h3", {}, t("advice_saved_head", hive.name)),
    el("div", { class: "sub" }, t("advice_saved_sub"))
  ));
  v.appendChild(renderAdviceList(result.advice));
  if (result.next_review_days) {
    const d = new Date(); d.setDate(d.getDate() + result.next_review_days);
    v.appendChild(el("div", { class: "card next-review" },
      el("strong", {}, t("next_review")),
      el("div", {}, t("next_review_txt", result.next_review_days, d.toISOString().slice(0, 10)))
    ));
  }
  v.appendChild(el("div", { class: "row", style: "gap:8px" },
    el("button", { class: "grow", onclick: () => { openHiveId = hive.id; render(); } }, t("see_history")),
    el("button", { class: "secondary", onclick: () => { openHiveId = null; currentTab = "hives"; render(); } }, t("to_hives"))
  ));
}

/* Inspection form */
function formInspection(hive) {
  const v = $("#view");
  v.innerHTML = "";
  $("#title").textContent = t("inspection_of") + hive.name;
  const today = new Date().toISOString().slice(0, 10);

  const f = el("form", { class: "card",
    onsubmit: async (e) => {
      e.preventDefault();
      const num = (name) => (f[name].value !== "" ? parseFloat(f[name].value) : null);
      const int = (name) => (f[name].value !== "" ? parseInt(f[name].value, 10) : null);
      const client_uuid = uuid();
      const body = {
        hive_id: hive.id,
        date: f.date.value || today,
        client_uuid,
        queen_status: f.queen_status.value,
        eggs: f.eggs.checked, larvae: f.larvae.checked, capped_brood: f.capped_brood.checked,
        brood_pattern: int("brood_pattern"),
        swarm_mood: f.swarm_mood.value,
        queen_cells: int("queen_cells") || 0,
        strength: int("strength"),
        temperament: f.temperament.value,
        frames_bees: num("frames_bees"),
        stores_food: int("stores_food"),
        stores_pollen: int("stores_pollen"),
        varroa_method: f.varroa_method.value,
        varroa_count: int("varroa_count"),
        disease_signs: f.disease_signs.value.trim() || null,
        treatment: f.treatment.value.trim() || null,
        feeding: f.feeding.value.trim() || null,
        honey_harvested_kg: num("honey_harvested_kg"),
        weather: f.weather.value.trim() || null,
        temperature_c: num("temperature_c"),
        notes: f.notes.value.trim() || null,
        todo: f.todo.value.trim() || null,
      };
      // The advice is made here in the browser (works offline) and saved in the advice field.
      const result = window.KNOWLEDGE ? window.KNOWLEDGE.generateAdvice(body) : { advice: [] };
      body.advice = JSON.stringify(result);

      // local record with a temporary (negative) id, so it shows in the history at once
      const localItem = { ...body, id: -Date.now() };
      await saveQueued({
        store: "inspections", method: "POST", path: "/inspections", body, localItem,
      });
      state.inspections = await idbAll("inspections");
      await refreshFromServer();
      toast(navigator.onLine ? t("saved") : t("saved_offline"));
      // show the advice instead of going back
      showAdviceScreen(hive, result);
    },
  });

  const opt = (val, lab, cur) => el("option", { value: val, ...(cur === val ? { selected: "" } : {}) }, lab);
  const check = (name, lab) => {
    const id = "c_" + name;
    const wrap = el("label", { class: "chip", for: id });
    wrap.appendChild(el("input", { type: "checkbox", name, id }));
    wrap.appendChild(document.createTextNode(lab));
    return wrap;
  };

  f.appendChild(el("label", {}, t("inspection_date")));
  f.appendChild(el("input", { name: "date", type: "date", value: today }));

  // Queen and brood
  const fsQueen = el("fieldset", {}, el("legend", {}, t("fs_queen")));
  fsQueen.appendChild(el("label", {}, t("queen_status")));
  const q = el("select", { name: "queen_status" });
  [["widziana", t("q_seen")], ["jaja", t("q_eggs")], ["nie_znaleziono", t("q_notfound")], ["nieoznakowana", t("q_unmarked")]]
    .forEach(([v_, l]) => q.appendChild(opt(v_, l, "widziana")));
  fsQueen.appendChild(q);
  fsQueen.appendChild(el("div", { class: "checks" }, check("eggs", t("chk_eggs")), check("larvae", t("chk_larvae")), check("capped_brood", t("chk_capped"))));
  fsQueen.appendChild(el("label", {}, t("brood_pattern")));
  const bp = el("select", { name: "brood_pattern" });
  bp.appendChild(opt("", "—"));
  [1, 2, 3, 4, 5].forEach((n) => bp.appendChild(opt(n, `${n}  ${"★".repeat(n)}`)));
  fsQueen.appendChild(bp);
  f.appendChild(fsQueen);

  // Swarming and strength
  const fsMood = el("fieldset", {}, el("legend", {}, t("fs_mood")));
  fsMood.appendChild(el("div", { class: "grid2" },
    el("div", {}, el("label", {}, t("swarm_mood")),
      (() => { const s = el("select", { name: "swarm_mood" });
        [["spokojny", t("mood_calm")], ["budujacy", t("mood_building")], ["rojowy", t("mood_swarming")]].forEach(([v_, l]) => s.appendChild(opt(v_, l, "spokojny")));
        return s; })()),
    el("div", {}, el("label", {}, t("queen_cells")),
      el("input", { name: "queen_cells", type: "number", min: "0", value: "0" }))
  ));
  fsMood.appendChild(el("div", { class: "grid2" },
    el("div", {}, el("label", {}, t("strength")),
      el("input", { name: "strength", type: "number", min: "1", max: "10" })),
    el("div", {}, el("label", {}, t("frames_bees")),
      el("input", { name: "frames_bees", type: "number", step: "0.5", min: "0" }))
  ));
  fsMood.appendChild(el("label", {}, t("temperament")));
  const tp = el("select", { name: "temperament" });
  [["lagodny", t("temp_gentle")], ["normalny", t("temp_normal")], ["agresywny", t("temp_aggr")]].forEach(([v_, l]) => tp.appendChild(opt(v_, l, "normalny")));
  fsMood.appendChild(tp);
  f.appendChild(fsMood);

  // Stores
  const fsStore = el("fieldset", {}, el("legend", {}, t("fs_stores")));
  fsStore.appendChild(el("div", { class: "grid2" },
    el("div", {}, el("label", {}, t("stores_food")), el("input", { name: "stores_food", type: "number", min: "0", max: "5" })),
    el("div", {}, el("label", {}, t("stores_pollen")), el("input", { name: "stores_pollen", type: "number", min: "0", max: "5" }))
  ));
  f.appendChild(fsStore);

  // Health
  const fsHealth = el("fieldset", {}, el("legend", {}, t("fs_health")));
  fsHealth.appendChild(el("div", { class: "grid2" },
    el("div", {}, el("label", {}, t("varroa_method")),
      (() => { const s = el("select", { name: "varroa_method" });
        [["brak", t("vm_none")], ["cukier_puder", t("vm_sugar")], ["smyw_alkoholowy", t("vm_alcohol")], ["wklad_dennicowy", t("vm_board")], ["czerw_trutowy", t("vm_drone")]].forEach(([v_, l]) => s.appendChild(opt(v_, l, "brak")));
        return s; })()),
    el("div", {}, el("label", {}, t("varroa_count")),
      el("input", { name: "varroa_count", type: "number", min: "0" }))
  ));
  fsHealth.appendChild(el("label", {}, t("disease_signs")));
  fsHealth.appendChild(el("input", { name: "disease_signs", placeholder: t("disease_ph") }));
  f.appendChild(fsHealth);

  // Actions
  const fsAct = el("fieldset", {}, el("legend", {}, t("fs_actions")));
  fsAct.appendChild(el("div", { class: "grid2" },
    el("div", {}, el("label", {}, t("treatment")), el("input", { name: "treatment" })),
    el("div", {}, el("label", {}, t("feeding")), el("input", { name: "feeding" }))
  ));
  fsAct.appendChild(el("label", {}, t("honey")));
  fsAct.appendChild(el("input", { name: "honey_harvested_kg", type: "number", step: "0.1", min: "0" }));
  f.appendChild(fsAct);

  // Context
  const fsCtx = el("fieldset", {}, el("legend", {}, t("fs_ctx")));
  fsCtx.appendChild(el("div", { class: "grid2" },
    el("div", {}, el("label", {}, t("weather")), el("input", { name: "weather" })),
    el("div", {}, el("label", {}, t("temperature")), el("input", { name: "temperature_c", type: "number" }))
  ));
  fsCtx.appendChild(el("label", {}, t("notes")));
  fsCtx.appendChild(el("textarea", { name: "notes" }));
  fsCtx.appendChild(el("label", {}, t("todo_next")));
  fsCtx.appendChild(el("textarea", { name: "todo" }));
  f.appendChild(fsCtx);

  f.appendChild(el("div", { class: "row", style: "margin-top:4px;gap:8px" },
    el("button", { type: "submit", class: "grow" }, t("save_inspection")),
    el("button", { type: "button", class: "secondary", onclick: () => render() }, t("cancel"))
  ));
  v.appendChild(f);
}

/* Alerts */
function renderAlerts(v) {
  $("#title").textContent = t("alerts");
  if (!navigator.onLine)
    v.appendChild(el("div", { class: "sub", style: "margin-bottom:10px" }, t("alerts_offline_note")));
  if (!state.alerts.length) {
    v.appendChild(el("div", { class: "empty" }, t("no_alerts")));
    return;
  }
  state.alerts.forEach((a) => {
    v.appendChild(
      el("div", { class: "alert " + a.level, onclick: () => { openHiveId = a.hive_id; render(); }, style: "cursor:pointer" },
        el("div", { class: "who" }, "🍯 " + a.hive_name),
        el("div", {}, alertMessage(a)),
        a.last_inspection ? el("div", { class: "when" }, t("alert_last") + a.last_inspection) : ""
      )
    );
  });
}

/* Build the alert text in the chosen language from code and params.
 * Falls back to a.message from the server if the code is unknown. */
function alertMessage(a) {
  if (!a.code) return a.message || "";
  const params = { ...(a.params || {}) };
  // translated swarming label without the emoji (it is inside a sentence)
  if (params.mood) params.mood = moodLabel(params.mood).replace(/^[^\p{L}]+/u, "").trim();
  const key = "al_" + a.code;
  const has = window.I18N && window.I18N.dict[window.I18N.getLang()][key];
  return has ? t(key, params) : (a.message || "");
}

/* Translate the static elements with a data-i18n attribute (e.g. the tab
 * labels) and set the text of the language button. */
function applyStaticI18n() {
  document.querySelectorAll("[data-i18n]").forEach((n) => {
    n.textContent = t(n.dataset.i18n);
  });
  const btn = $("#langToggle");
  if (btn) btn.textContent = (window.I18N.getLang() === "pl") ? "EN" : "PL";
  document.documentElement.lang = window.I18N.getLang();
}

/* Start */
async function boot() {
  document.querySelectorAll("nav.tabs button").forEach((b) =>
    b.addEventListener("click", () => {
      currentTab = b.dataset.tab;
      openHiveId = null;
      document.querySelectorAll("nav.tabs button").forEach((x) => x.classList.toggle("active", x === b));
      render();
    })
  );

  // Language button: switch the language, save it and draw the UI again.
  const langBtn = $("#langToggle");
  if (langBtn) {
    langBtn.addEventListener("click", () => {
      window.I18N.setLang(window.I18N.getLang() === "pl" ? "en" : "pl");
      applyStaticI18n();
      render();
    });
  }
  applyStaticI18n();

  window.addEventListener("online", () => { updateNetBadge(); flushQueue(); });
  window.addEventListener("offline", () => updateNetBadge());

  await openDB();
  await loadFromCache();
  render(); // show the local data at once
  await flushQueue(); // first send waiting changes,
  await refreshFromServer(); // then get fresh data
  render();

  if ("serviceWorker" in navigator) {
    try { await navigator.serviceWorker.register("/sw.js"); } catch (e) { console.warn("SW", e); }
  }
}
boot();
