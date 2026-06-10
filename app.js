/** Set only by readonly.html before this script loads. index.html never sets it. */
function isReadOnly() {
  return !!window.__CONTENT_FLOW_READ_ONLY__;
}

function applyReadOnlyShell() {
  if (!isReadOnly()) return;

  document.body.classList.add("read-only-mode");

  document.getElementById("drawerClose")?.setAttribute("tabindex", "-1");
}

function softenReadOnlyCopy() {
  if (!isReadOnly()) return;

  document.querySelectorAll(".kpi-card").forEach(card => card.removeAttribute("title"));

  const dynamicContext = document.getElementById("dynamicContext");
  if (dynamicContext) {
    const p = dynamicContext.querySelector("p");
    if (p) {
      p.textContent =
        "Read-only snapshot: use the tabs to move between views. Status controls and diagram drawers are locked; Jira and epic links stay available.";
    }
  }

  document.querySelectorAll(".legend-item").forEach(el => {
    if (el.textContent.includes("Click = details")) {
      el.textContent = "Hover = context hints (read-only)";
    }
  });

  document.querySelectorAll("#flowchart .tooltip-small").forEach(t => {
    if (t.textContent.includes("Click:")) {
      t.textContent = "Read-only snapshot";
    }
  });
}

/**
 * github.io uses one origin per user (e.g. https://chakn005.github.io), so localStorage
 * is shared across all projects. Scope keys by pathname so this app does not collide
 * with other sites, and migrate legacy unscoped keys once.
 */
function normalizeAppPathKey() {
  try {
    let p = window.location.pathname || "/";
    p = p.replace(/\/index\.html$/i, "");
    if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
    return p || "/";
  } catch {
    return "/";
  }
}

function scopedStorageKey(localKey) {
  return `${localKey}:${normalizeAppPathKey()}`;
}

function loadScopedJson(localKey) {
  const scoped = scopedStorageKey(localKey);
  try {
    let raw = localStorage.getItem(scoped);
    if (!raw) {
      raw = localStorage.getItem(localKey);
      if (raw) {
        try {
          localStorage.setItem(scoped, raw);
          localStorage.removeItem(localKey);
        } catch (_) {}
      }
    }
    if (!raw) raw = sessionStorage.getItem(scoped);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveScopedJson(localKey, obj) {
  const scoped = scopedStorageKey(localKey);
  const payload = JSON.stringify(obj);
  try {
    localStorage.setItem(scoped, payload);
    try {
      localStorage.removeItem(localKey);
    } catch (_) {}
  } catch (_) {
    try {
      sessionStorage.setItem(scoped, payload);
    } catch (_) {}
  }
}

const HEATMAP_STORAGE_KEY = "heatmapCellStates-v4";
const HEATMAP_MANUAL_KEY = "heatmapManualOverrides-v1";
const HEATMAP_MANUAL_MIGRATION_KEY = "heatmapManualMigration-v1";
const HEATMAP_SHARED_UPDATED_KEY = "heatmapSharedUpdatedAt-v1";
const KPI_STORAGE_KEY = "kpiCardStates";

let sharedHeatmapStates = null;
let sharedHeatmapManualOverrides = null;
let sharedKpiStates = null;

function getHeatmapStatesMap() {
  if (sharedHeatmapStates) return sharedHeatmapStates;
  sharedHeatmapStates = loadScopedJson(HEATMAP_STORAGE_KEY);
  return sharedHeatmapStates;
}

function getHeatmapManualOverrides() {
  if (sharedHeatmapManualOverrides) return sharedHeatmapManualOverrides;
  sharedHeatmapManualOverrides = loadScopedJson(HEATMAP_MANUAL_KEY);
  return sharedHeatmapManualOverrides;
}

function markHeatmapCellManual(cellId) {
  const overrides = getHeatmapManualOverrides();
  overrides[cellId] = true;
  saveScopedJson(HEATMAP_MANUAL_KEY, overrides);
}

function isHeatmapCellManual(cellId) {
  return !!getHeatmapManualOverrides()[cellId];
}

/** One-time: treat existing saved heatmap cells as user-owned so Jira does not overwrite them. */
function migrateExistingHeatmapToManual() {
  const migrationScoped = scopedStorageKey(HEATMAP_MANUAL_MIGRATION_KEY);
  try {
    if (localStorage.getItem(migrationScoped)) return;
  } catch (_) {
    return;
  }

  const saved = loadScopedJson(HEATMAP_STORAGE_KEY);
  const overrides = getHeatmapManualOverrides();
  Object.keys(saved).forEach(cellId => {
    overrides[cellId] = true;
  });
  saveScopedJson(HEATMAP_MANUAL_KEY, overrides);
  try {
    localStorage.setItem(migrationScoped, "1");
  } catch (_) {}
}

function getKpiStatesMap() {
  if (sharedKpiStates) return sharedKpiStates;
  sharedKpiStates = loadScopedJson(KPI_STORAGE_KEY);
  return sharedKpiStates;
}

function getHeatmapSharedUpdatedAt() {
  try {
    return localStorage.getItem(scopedStorageKey(HEATMAP_SHARED_UPDATED_KEY)) || "";
  } catch {
    return "";
  }
}

function setHeatmapSharedUpdatedAt(iso) {
  try {
    localStorage.setItem(scopedStorageKey(HEATMAP_SHARED_UPDATED_KEY), iso);
  } catch (_) {}
}

const HEATMAP_CELL_ORDER = (() => {
  const order = [];
  ["Content", "Media", "Streaming"].forEach(alliance => {
    for (let milestone = 0; milestone < 5; milestone += 1) {
      order.push(`${alliance}-${milestone}`);
    }
  });
  return order;
})();

function toBase64Url(bytes) {
  let binary = "";
  bytes.forEach(byte => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(encoded) {
  let b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** Pack 15 heatmap cells into ~8 URL-safe characters. */
function packHeatmapCompact(heatmap) {
  let bits = 0;
  HEATMAP_CELL_ORDER.forEach((cellId, index) => {
    const value = heatmap[cellId];
    const packed = value !== undefined && value >= 0 && value <= 4 ? value : 7;
    bits |= (packed & 7) << (index * 3);
  });

  const bytes = new Uint8Array(6);
  for (let i = 0; i < 6; i += 1) {
    bytes[i] = (bits >> (i * 8)) & 0xff;
  }
  return toBase64Url(bytes);
}

function unpackHeatmapCompact(encoded) {
  const heatmap = {};
  if (!encoded) return heatmap;

  const bytes = fromBase64Url(encoded);
  let bits = 0;
  for (let i = 0; i < bytes.length; i += 1) {
    bits |= bytes[i] << (i * 8);
  }

  HEATMAP_CELL_ORDER.forEach((cellId, index) => {
    const value = (bits >> (index * 3)) & 7;
    if (value <= 4) heatmap[cellId] = value;
  });
  return heatmap;
}

/** URL-safe readable UTC timestamp, e.g. 2026-06-08T18-33-00Z */
function formatShareTimestampForUrl(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";

  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}-${pad(d.getUTCMinutes())}-${pad(d.getUTCSeconds())}Z`;
}

function parseShareTimestampFromUrl(timestamp) {
  if (!timestamp) return "";

  const readable = timestamp.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2})-(\d{2})-(\d{2})Z$/
  );
  if (readable) {
    const iso = new Date(Date.UTC(
      +readable[1],
      +readable[2] - 1,
      +readable[3],
      +readable[4],
      +readable[5],
      +readable[6]
    )).toISOString();
    return Number.isNaN(Date.parse(iso)) ? "" : iso;
  }

  // Legacy unix seconds, e.g. 1781075629
  if (/^\d{10}$/.test(timestamp)) {
    const seconds = parseInt(timestamp, 10);
    if (!Number.isNaN(seconds) && seconds > 0) {
      return new Date(seconds * 1000).toISOString();
    }
  }

  return "";
}

function buildHeatmapShareToken(updatedIso, heatmap) {
  const stamp = formatShareTimestampForUrl(updatedIso);
  return `${stamp}.${packHeatmapCompact(heatmap)}`;
}

function parseHeatmapShareToken(token) {
  if (!token || typeof token !== "string") return null;
  const dot = token.indexOf(".");
  if (dot <= 0) return null;

  const timestamp = token.slice(0, dot);
  const data = token.slice(dot + 1);
  const updatedIso = parseShareTimestampFromUrl(timestamp);
  if (!updatedIso || !data) return null;

  const heatmap = unpackHeatmapCompact(data);
  if (!Object.keys(heatmap).length) return null;

  return { updatedIso, heatmap };
}

function applyHeatmapSharePayload(decoded, updatedIso) {
  sharedHeatmapStates = decoded;
  saveScopedJson(HEATMAP_STORAGE_KEY, decoded);

  const overrides = {};
  Object.keys(decoded).forEach(cellId => {
    overrides[cellId] = true;
  });
  sharedHeatmapManualOverrides = overrides;
  saveScopedJson(HEATMAP_MANUAL_KEY, overrides);
  setHeatmapSharedUpdatedAt(updatedIso);
}

function setHeatmapShareQuery(url, updatedIso, heatmap) {
  url.searchParams.set("s", buildHeatmapShareToken(updatedIso, heatmap));
  url.searchParams.delete("updated");
  url.searchParams.delete("hm");
}

function buildHeatmapShareUrl() {
  const heatmap = getHeatmapStatesMap();
  const base = window.location.href.split("?")[0];
  if (!Object.keys(heatmap).length) return base;

  const updated = getHeatmapSharedUpdatedAt() || new Date().toISOString();
  const url = new URL(base);
  setHeatmapShareQuery(url, updated, heatmap);
  return url.toString();
}

function getCleanSiteUrl() {
  return window.location.href.split("?")[0].split("#")[0];
}

/** Keep the browser address bar on the canonical site URL (no share query params). */
function restoreCleanSiteUrl() {
  try {
    const clean = getCleanSiteUrl();
    if (window.location.href !== clean && window.location.pathname + window.location.search !== clean) {
      history.replaceState(null, "", clean);
    } else if (window.location.search) {
      history.replaceState(null, "", clean);
    }
  } catch (_) {}
}

function applyHeatmapFromQueryString() {
  try {
    const params = new URLSearchParams(window.location.search);
    const compact = params.get("s");
    if (compact) {
      const parsed = parseHeatmapShareToken(compact);
      if (!parsed) return false;
      applyHeatmapSharePayload(parsed.heatmap, parsed.updatedIso);
      restoreCleanSiteUrl();
      return true;
    }

    // Legacy long URLs: ?updated=...&hm=...
    const hm = params.get("hm");
    const updated = params.get("updated");
    if (!hm || !updated || Number.isNaN(Date.parse(updated))) return false;

    const legacyHeatmap = {};
    hm.split(",").forEach(part => {
      const sep = part.lastIndexOf(":");
      if (sep <= 0) return;
      const cellId = part.slice(0, sep);
      const index = parseInt(part.slice(sep + 1), 10);
      if (!cellId || Number.isNaN(index) || index < 0 || index > 4) return;
      legacyHeatmap[cellId] = index;
    });
    if (!Object.keys(legacyHeatmap).length) return false;

    applyHeatmapSharePayload(legacyHeatmap, updated);
    restoreCleanSiteUrl();
    return true;
  } catch {
    return false;
  }
}

function formatHeatmapShareDate(iso) {
  if (!iso || Number.isNaN(Date.parse(iso))) return "Unknown";
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function updateHeatmapShareUpdatedLabel(iso) {
  const el = document.getElementById("heatmapShareUpdated");
  if (!el) return;
  const when = formatHeatmapShareDate(iso || getHeatmapSharedUpdatedAt());
  el.textContent = when ? `Last updated: ${when}` : "";
}

function persistDashboardSnapshot() {
  const heatmap = getHeatmapStatesMap();
  const kpi = getKpiStatesMap();
  saveScopedJson(HEATMAP_STORAGE_KEY, heatmap);
  saveScopedJson(KPI_STORAGE_KEY, kpi);

  if (Object.keys(heatmap).length) {
    const updated = new Date().toISOString();
    setHeatmapSharedUpdatedAt(updated);
    updateHeatmapShareUpdatedLabel(updated);
  }

  const shared = window.ContentFlowSharedState;
  if (shared && shared.isEnabled() && shared.canPublish()) {
    shared.schedulePublish({ heatmap, kpi });
  }
}

function applySharedPayload(payload) {
  if (!payload) return;
  if (payload.heatmap && Object.keys(payload.heatmap).length) {
    sharedHeatmapStates = { ...payload.heatmap };
    saveScopedJson(HEATMAP_STORAGE_KEY, sharedHeatmapStates);
  }
  if (payload.kpi && Object.keys(payload.kpi).length) {
    sharedKpiStates = { ...payload.kpi };
    saveScopedJson(KPI_STORAGE_KEY, sharedKpiStates);
  }
  refreshHeatmapFromState();
  refreshKpiFromState();
}

function refreshHeatmapFromState() {
  const statusCycle = [
    { class: "cell-green", text: "COMPLETED" },
    { class: "cell-amber", text: "IN‑PROGRESS" },
    { class: "cell-pending", text: "PENDING" },
    { class: "cell-red", text: "RISK" },
    { class: "cell-na", text: "N/A" }
  ];
  const saved = getHeatmapStatesMap();
  document.querySelectorAll("#heatmap .clickable-cell").forEach(cell => {
    const cellId = `${cell.dataset.alliance}-${cell.dataset.milestone}`;
    if (saved[cellId] === undefined) return;
    const savedStatus = statusCycle[saved[cellId]];
    if (!savedStatus) return;
    statusCycle.forEach(s => cell.classList.remove(s.class));
    cell.classList.add(savedStatus.class);
    cell.textContent = savedStatus.text;
    setHeatmapCellAccessibleName(cell);
  });
}

function refreshKpiFromState() {
  const statusCycle = [
    { class: "rag-green", circle: "green", color: "#22c55e" },
    { class: "rag-amber", circle: "amber", color: "#f59e0b" },
    { class: "rag-red", circle: "red", color: "#dc2626" }
  ];
  const saved = getKpiStatesMap();
  document.querySelectorAll(".kpi-card").forEach((card, index) => {
    const cardId = card.querySelector(".kpi-title")?.textContent?.trim() || `card-${index}`;
    if (saved[cardId] === undefined) return;
    applyCardStatus(card, statusCycle[saved[cardId]]);
  });
}

function updateSharingHint(isLive) {
  document.querySelectorAll(".heatmap-sharing-hint").forEach(el => {
    if (isLive) {
      el.innerHTML =
        "<strong>Sharing:</strong> Status is loaded from the team cloud. " +
        "Editors with the edit key publish changes for everyone; others see updates automatically.";
    } else {
      el.innerHTML =
        "<strong>Sharing:</strong> Your address bar stays on the normal site URL. " +
        "Click <strong>Copy share link</strong> to copy a short URL with <code>s=date-time.data</code> for colleagues. " +
        "Jira sync will not overwrite cells you have set.";
    }
  });
}

function setupHeatmapShareUI() {
  const copyBtn = document.getElementById("copyHeatmapShareLink");
  if (!copyBtn) return;

  const params = new URLSearchParams(window.location.search);
  const compact = params.get("s");
  const parsed = compact ? parseHeatmapShareToken(compact) : null;
  if (parsed) {
    updateHeatmapShareUpdatedLabel(parsed.updatedIso);
  } else if (params.has("updated")) {
    updateHeatmapShareUpdatedLabel(params.get("updated"));
  } else {
    updateHeatmapShareUpdatedLabel(getHeatmapSharedUpdatedAt());
  }

  copyBtn.addEventListener("click", async () => {
    const shareUrl = buildHeatmapShareUrl();
    try {
      await navigator.clipboard.writeText(shareUrl);
      const prev = copyBtn.textContent;
      copyBtn.textContent = "Link copied!";
      setTimeout(() => {
        copyBtn.textContent = prev;
      }, 2000);
    } catch {
      window.prompt("Copy this share link:", shareUrl);
    }
  });
}

function setupSharedSyncUI() {
  const host = document.querySelector(".header-actions");
  const shared = window.ContentFlowSharedState;
  if (!host || !shared) return;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.id = "sharedSyncControl";
  btn.className = "sync-pill sync-pill--local";
  btn.style.display = "none"; // Hide the sync status button
  btn.innerHTML = '<span class="sync-dot" aria-hidden="true"></span><span class="sync-label">Local only</span>';

  const labels = {
    local: "Local only",
    loading: "Syncing…",
    live: "Team view (read‑only)",
    "live-editor": "Team view (editing)",
    error: "Sync unavailable"
  };

  function paint(next) {
    const label = labels[next] || labels.local;
    btn.className = `sync-pill sync-pill--${next.replace(/[^a-z-]/g, "")}`;
    btn.querySelector(".sync-label").textContent = label;
    btn.title =
      next === "local"
        ? "Add Supabase URL and anon key in supabase-config.js to enable shared status"
        : next === "live-editor"
          ? "Changes publish to the team cloud"
          : next === "live"
            ? "Viewing shared status; enter edit key to publish"
            : label;
    updateSharingHint(next === "live" || next === "live-editor");
  }

  shared.onStatusChange(paint);

  btn.addEventListener("click", () => {
    if (!shared.isEnabled()) {
      window.alert(
        "Shared sync is not configured.\n\n" +
          "1. Create a Supabase project and run supabase/schema.sql\n" +
          "2. Set url and anonKey in supabase-config.js\n" +
          "3. Redeploy GitHub Pages"
      );
      return;
    }
    if (shared.canPublish()) {
      window.alert("You are publishing changes for everyone with the team edit key.");
      return;
    }
    if (shared.promptForEditKey()) {
      paint(shared.getStatus());
      persistDashboardSnapshot();
    }
  });

  host.insertBefore(btn, host.firstChild);
  paint(shared.getStatus());
}

async function initSharedDashboardState() {
  const shared = window.ContentFlowSharedState;
  if (!shared) return;

  setupSharedSyncUI();
  if (!shared.init()) return;

  const remote = await shared.fetchRemote();
  if (remote) applySharedPayload(remote);

  shared.subscribeRemote(applySharedPayload);
}

// Test case configuration - teams can update these values
const testCaseConfig = {
  "CPTR-68701": { // Content Platform
    completed: 34,
    total: 37,
    integrationPoints: { completed: 5, total: 5 }
  },
  "CPTR-68702": { // Media Platform
    completed: 28,
    total: 33,
    integrationPoints: { completed: 4, total: 5 }
  },
  "CPTR-68703": { // Data Alliance
    completed: 26,
    total: 32,
    integrationPoints: { completed: 4, total: 6 }
  },
  "CPTR-68705": { // Streaming/Client
    completed: 31,
    total: 33,
    integrationPoints: { completed: 5, total: 5 }
  }
};

// Calculate overall metrics
function calculateOverallMetrics() {
  let totalCompleted = 0;
  let totalTests = 0;
  let totalIntegrationPoints = 0;
  
  Object.values(testCaseConfig).forEach(config => {
    totalCompleted += config.completed;
    totalTests += config.total;
    totalIntegrationPoints += config.integrationPoints.total;
  });
  
  const overallCoverage = Math.round((totalCompleted / totalTests) * 100);
  
  return {
    coverage: overallCoverage,
    totalTests: totalTests,
    completedTests: totalCompleted,
    integrationPoints: totalIntegrationPoints
  };
}

const phaseData = {
  content: {
    title: "Content Platform Phase",
    description: "Initial content ingestion and metadata management",
    steps: [
      "Content Ingestion: Upload and validate source content files (video, audio, images)",
      "Metadata Creation: Define title, description, genre, cast, ratings, release dates",
      "Rights Management: Configure geographic availability and licensing windows",
      "Asset Management: Organize source files and related materials",
      "Localization: Add subtitles, dubbed audio tracks, and regional metadata"
    ],
    testPoints: [
      "Validate content file formats and specifications",
      "Verify metadata completeness and accuracy",
      "Check rights and availability rules",
      "Test localization asset associations"
    ]
  },
  media: {
    title: "Media Platform Phase",
    description: "Content transformation and preparation for delivery",
    steps: [
      "Content Transformation: Convert source files to streaming-ready formats",
      "Encoding & Packaging: Create multiple bitrate variants (ABR) for adaptive streaming",
      "DRM Application: Apply digital rights management (Widevine, PlayReady, FairPlay)",
      "Quality Control: Automated checks for audio/video sync, artifacts, compliance",
      "CDN Preparation: Package content for content delivery network distribution"
    ],
    testPoints: [
      "Verify encoding quality across all bitrates",
      "Test DRM encryption and key delivery",
      "Validate packaging formats (HLS, DASH)",
      "Check subtitle and audio track synchronization",
      "Performance testing for encoding pipelines"
    ]
  },
  data: {
    title: "Data Layer Phase",
    description: "Data aggregation and API exposure",
    steps: [
      "Data Aggregation: Collect content metadata from multiple sources",
      "Catalog Sync: Maintain synchronized content catalog across systems",
      "Search Indexing: Build and update search indices for content discovery",
      "API Gateway: Expose RESTful/GraphQL APIs for client consumption",
      "Recommendation Engine: Generate personalized content suggestions",
      "Analytics Integration: Track content performance and user engagement"
    ],
    testPoints: [
      "API endpoint functionality and response validation",
      "Data consistency across systems",
      "Search accuracy and performance",
      "API rate limiting and security",
      "Cache invalidation and refresh cycles"
    ]
  },
  streaming: {
    title: "Streaming/Client Phase",
    description: "End-user content delivery and playback",
    steps: [
      "Content Discovery: Browse, search, and recommendation interfaces",
      "Playback Engine: Video player with adaptive bitrate streaming",
      "Multi-device Support: Web, mobile, TV, gaming consoles",
      "Offline Playback: Download and local playback capabilities",
      "CDN Integration: Optimized content delivery from edge locations"
    ],
    testPoints: [
      "Playback functionality across all devices and browsers",
      "Adaptive bitrate switching behavior",
      "DRM playback and license acquisition",
      "Offline download and playback",
      "Error handling and recovery",
      "Performance metrics (startup time, buffering, quality)"
    ]
  },
  qa: {
    title: "QA & Testing Layer",
    description: "Team-specific integration testing with continuous feedback loops",
    steps: [
      "Content Platform Testing: Source content validation and metadata handoff verification",
      "Media Platform Testing: Encoding quality checks and package integrity validation",
      "Data Layer Testing: Catalog synchronization and search index validation",
      "Streaming/Client Testing: Playback integration and multi-device compatibility",
      "Cross-Team Integration: Contract testing between phase handoffs",
      "End-to-End Validation: Complete user journey testing across all phases"
    ],
    testPoints: [
      "Team-specific integration test coverage by phase",
      "Handoff validation between consecutive phases",
      "Cross-team contract adherence verification",
      "End-to-end flow validation and traceability"
    ]
  }
};

// Handshake (“between phases”) model – static for now.
// Later: load from JSON or Jira/Xray.
const handshakeData = {
  "content-media": {
    title: "Handshake: Content → Media",
    owner: "Media Platform Alliance",
    validations: [
      "Metadata transfer completeness",
      "Format & integrity validation",
      "API contract adherence"
    ],
    evidence: [
      { label: "Epic CPTR‑68587", url: "https://jira.disney.com/browse/CPTR-68587" },
      { label: "Integration Sheet (example)", url: "https://docs.google.com/spreadsheets/d/1twFm_Jmv2j6sVVkD2WOp2fv3AMEHJGDLqqlO9654u3Y/edit?pli=1&gid=1024354782#gid=1024354782" }
    ],
    risks: [
      "Schema drift between CP and MP",
      "Partial validation without evidence"
    ]
  },
  "media-data": {
    title: "Handshake: Media → Data",
    owner: "Data Alliance",
    validations: [
      "Ava entity / avail ID availability",
      "Entity merge & reconciliation",
      "Ratings & localization propagation checks"
    ],
    evidence: [
      { label: "Epic CPTR‑68587", url: "https://jira.disney.com/browse/CPTR-68587" }
    ],
    risks: [
      "Lower-env flow enablement required by upstream teams",
      "Avoid reliance on DMC media IDs"
    ]
  },
  "media-streaming": {
    title: "Handshake: Media → Streaming",
    owner: "Streaming / Client QA",
    validations: [
      "Packaged asset delivery validation",
      "Playback readiness across target devices",
      "Catalog and discovery integration checks"
    ],
    evidence: [
      { label: "Epic CPTR‑68587", url: "https://jira.disney.com/browse/CPTR-68587" }
    ],
    risks: [
      "Delayed propagation or caching can mask issues",
      "Downstream observability gaps"
    ]
  },
  "data-streaming": {
    title: "Handshake: Data → Streaming",
    owner: "Streaming / Client QA",
    validations: [
      "Catalog/API response consistency",
      "Search & discovery correctness",
      "Experience parity checks"
    ],
    evidence: [
      { label: "Epic CPTR‑68587", url: "https://jira.disney.com/browse/CPTR-68587" }
    ],
    risks: [
      "Delayed propagation or caching can mask issues",
      "Downstream observability gaps"
    ]
  }
};

// Evidence tab — test plans under program epic (Jira)
const EVIDENCE_PROGRAM_EPIC = {
  key: "CPTR-68587",
  url: "https://jira.disney.com/browse/CPTR-68587",
  label: "Epic CPTR‑68587"
};

const evidenceTestPlanCategories = [
  {
    title: "Content Platform",
    wide: true,
    issues: [
      { key: "DMEDNINJA-16594", url: "https://jira.disney.com/browse/DMEDNINJA-16594" },
      { key: "OMFG-18837", url: "https://jira.disney.com/browse/OMFG-18837" },
      { key: "EXP-4184", url: "https://jira.disney.com/browse/EXP-4184" },
      { key: "BOLTM-7048", url: "https://jira.disney.com/browse/BOLTM-7048" },
      { key: "GPLBELLE-3971", url: "https://jira.disney.com/browse/GPLBELLE-3971" },
      { key: "OMFG-19253", url: "https://jira.disney.com/browse/OMFG-19253" }
    ]
  },
  {
    title: "Media Platform",
    issues: [
      { key: "PRODREQ-88253", url: "https://jira.disney.com/browse/PRODREQ-88253" }
    ]
  },
  {
    title: "Streaming/Client QA",
    issues: [
      { key: "DPQA-6323", url: "https://jira.disney.com/browse/DPQA-6323" }
    ]
  },
  {
    title: "E2E Integration Traceability",
    wide: true,
    issues: [
      { key: "CPTR-68465", url: "https://jira.disney.com/browse/CPTR-68465" }
    ]
  }
];

// ===== Drawer helpers =====
function setupDrawer() {
  if (isReadOnly()) {
    return { openDrawer() {}, closeDrawer() {} };
  }

  const drawer = document.getElementById("drawer");
  const overlay = document.getElementById("drawerOverlay");
  const closeBtn = document.getElementById("drawerClose");

  const titleEl = document.getElementById("drawerTitle");
  const ownerEl = document.getElementById("drawerOwner");
  const validationsEl = document.getElementById("drawerValidations");
  const evidenceEl = document.getElementById("drawerEvidence");
  const risksEl = document.getElementById("drawerRisks");

  function openDrawer(payload) {
    titleEl.textContent = payload.title || "Details";
    ownerEl.textContent = payload.owner || "—";

    validationsEl.innerHTML = "";
    (payload.validations || []).forEach(v => {
      const li = document.createElement("li");
      li.textContent = v;
      validationsEl.appendChild(li);
    });

    evidenceEl.innerHTML = "";
    (payload.evidence || []).forEach(link => {
      if (isReadOnly()) {
        const span = document.createElement("span");
        span.className = "drawer-evidence-plain";
        span.textContent = link.label;
        evidenceEl.appendChild(span);
      } else {
        const a = document.createElement("a");
        a.href = link.url;
        a.target = "_blank";
        a.rel = "noreferrer";
        a.textContent = link.label;
        evidenceEl.appendChild(a);
      }
    });

    risksEl.innerHTML = "";
    (payload.risks || []).forEach(r => {
      const li = document.createElement("li");
      li.textContent = r;
      risksEl.appendChild(li);
    });

    overlay.hidden = false;
    drawer.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");

    // Update dynamic context based on selection
    const dynamicContext = document.getElementById("dynamicContext");
    if (dynamicContext) {
      if (payload.phaseType) {
        // Phase-specific context
        const phaseContexts = {
          content: {
            icon: "📥",
            focus: "Source Content Ingestion",
            critical: "Metadata completeness and rights validation are critical for downstream processing.",
            dependencies: "No upstream dependencies. Sets foundation for entire pipeline."
          },
          media: {
            icon: "🎬",
            focus: "Content Transformation & Encoding",
            critical: "DRM application and multi-bitrate encoding quality directly impact streaming experience.",
            dependencies: "Depends on Content Platform metadata and asset availability."
          },
          data: {
            icon: "🗄️",
            focus: "Catalog Management & API Exposure",
            critical: "Search indexing and API consistency enable content discovery and recommendations.",
            dependencies: "Requires Media Platform processed assets and metadata synchronization."
          },
          streaming: {
            icon: "📺",
            focus: "Content Delivery & Playback",
            critical: "Multi-device compatibility and CDN optimization ensure optimal user experience.",
            dependencies: "Requires Media Platform packaging and content discovery integration."
          }
        };
        
        const context = phaseContexts[payload.phaseType];
        if (context) {
          dynamicContext.innerHTML = `
            <div class="flow-dyn-block">
              <div class="flow-dyn-title">${context.icon} ${context.focus}</div>
              <p class="flow-dyn-text">${context.critical}</p>
              <p class="flow-dyn-meta"><strong>Dependencies:</strong> ${context.dependencies}</p>
            </div>
            <div class="flow-dyn-stats">
              <span class="stat-ok">✓ Validations: ${(payload.validations || []).length}</span>
              <span class="stat-info">📋 Evidence: ${(payload.evidence || []).length}</span>
              <span class="stat-risk">⚠ Risks: ${(payload.risks || []).length}</span>
            </div>
          `;
        }
      } else {
        // Handshake-specific context
        dynamicContext.innerHTML = `
          <div class="flow-dyn-block">
            <div class="flow-dyn-title">🔗 Integration Handshake: ${payload.title}</div>
            <p class="flow-dyn-text">Critical integration point requiring contract validation, data consistency checks, and ownership clarity.
              Failure at this handshake can cascade downstream and impact migration success.</p>
            <p class="flow-dyn-meta"><strong>Owner:</strong> ${payload.owner || "—"}</p>
          </div>
          <div class="flow-dyn-stats">
            <span class="stat-ok">✓ Validations: ${(payload.validations || []).length}</span>
            <span class="stat-info">📋 Evidence: ${(payload.evidence || []).length}</span>
            <span class="stat-risk">⚠ Risks: ${(payload.risks || []).length}</span>
          </div>
        `;
      }
    }
  }

  function closeDrawer() {
    drawer.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
    overlay.hidden = true;
  }

  overlay.addEventListener("click", closeDrawer);
  closeBtn.addEventListener("click", closeDrawer);

  return { openDrawer, closeDrawer };
}

// ===== Update Coverage Display =====
// Coverage functionality removed - no longer needed

// ===== Tabs =====
function setupTabs() {
  const buttons = document.querySelectorAll(".tab-btn");
  const panels = document.querySelectorAll(".tab-panel");

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("active"));
      panels.forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      const target = document.getElementById(`tab-${btn.dataset.tab}`);
      if (target) target.classList.add("active");
    });
  });
}

// ===== Heatmap (UI placeholder) =====
function heatmapEscAttr(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;");
}

function setHeatmapCellAccessibleName(cell) {
  const alliance = cell.dataset.alliance || "";
  const milestoneName = cell.dataset.milestoneName || "";
  const status = (cell.textContent || "").trim();
  cell.setAttribute(
    "aria-label",
    `${alliance}, ${milestoneName}: ${status}`
  );
}

function renderHeatmap() {
  const el = document.getElementById("heatmap");
  if (!el) return;

  // Simple, static heatmap placeholder
  const alliances = ["Content", "Media", "Streaming"];
  const milestones = ["Metadata/Artwork", "Avails/Rights", "AV Assets", "Title Planning & Exp.", "Live & Linear"];

  // Default snapshot: N/A only for Product-owned milestones (AV Assets, Title Planning).
  // First-time visitors (e.g. shared link) see this grid—not another user's local edits.
  const grid = {
    Content:           ["cell-green", "cell-amber", "cell-na", "cell-na", "cell-amber"],
    Media:             ["cell-amber", "cell-amber", "cell-na", "cell-na", "cell-green"],
    Streaming:         ["cell-amber", "cell-pending", "cell-na", "cell-na", "cell-amber"]
  };

  const heatmapCellTitle = isReadOnly()
    ? "Coverage cells: click to cycle status (saved in this browser only)"
    : "Click to cycle: COMPLETED → IN‑PROGRESS → PENDING → RISK → N/A";

  let html = `<table><thead><tr><th>Alliance \\ Milestone</th>`;
  milestones.forEach(m => html += `<th>${m}</th>`);
  html += `</tr></thead><tbody>`;

  alliances.forEach(a => {
    html += `<tr><th>${a}</th>`;
    grid[a].forEach((cls, i) => {
      const text =
        cls === "cell-green" ? "COMPLETED" :
        cls === "cell-amber" ? "IN‑PROGRESS" :
        cls === "cell-pending" ? "PENDING" :
        cls === "cell-red"   ? "RISK" :
        "N/A";
      const ms = heatmapEscAttr(milestones[i]);
      html += `<td class="${cls} clickable-cell" data-alliance="${heatmapEscAttr(a)}" data-milestone="${i}" data-milestone-name="${ms}" title="${heatmapCellTitle}">${text}</td>`;
    });
    html += `</tr>`;
  });

  html += `</tbody></table>`;
  el.innerHTML = html;

  // Add click functionality to heatmap cells
  setupHeatmapCells();
}

// ===== Heatmap Cell Status Cycling =====
function setupHeatmapCells() {
  const cells = document.querySelectorAll("#heatmap .clickable-cell");
  
  // Status cycle for heatmap: Green -> Amber -> Pending -> Red -> N/A -> Green
  const statusCycle = [
    { class: 'cell-green', text: 'COMPLETED' },
    { class: 'cell-amber', text: 'IN‑PROGRESS' },
    { class: 'cell-pending', text: 'PENDING' },
    { class: 'cell-red', text: 'RISK' },
    { class: 'cell-na', text: 'N/A' }
  ];
  
  const savedHeatmapStates = getHeatmapStatesMap();
  
  cells.forEach(cell => {
    // Create unique identifier for each cell
    const alliance = cell.dataset.alliance;
    const milestone = cell.dataset.milestone;
    const cellId = `${alliance}-${milestone}`;
    
    // Check if we have a saved state for this cell
    if (savedHeatmapStates[cellId] !== undefined) {
      const savedIndex = savedHeatmapStates[cellId];
      const savedStatus = statusCycle[savedIndex];
      if (savedStatus) {
        // Remove all status classes
        statusCycle.forEach(status => cell.classList.remove(status.class));
        // Apply saved status
        cell.classList.add(savedStatus.class);
        cell.textContent = savedStatus.text;
      }
    }

    setHeatmapCellAccessibleName(cell);
    
    // Heatmap is a personal snapshot: allow toggles even in read-only Pages builds
    cell.addEventListener('click', () => {
      let currentIndex = 0;
      statusCycle.forEach((status, index) => {
        if (cell.classList.contains(status.class)) {
          currentIndex = index;
        }
      });

      statusCycle.forEach(status => cell.classList.remove(status.class));

      const nextIndex = (currentIndex + 1) % statusCycle.length;
      const newStatus = statusCycle[nextIndex];

      cell.classList.add(newStatus.class);
      cell.textContent = newStatus.text;
      setHeatmapCellAccessibleName(cell);

      savedHeatmapStates[cellId] = nextIndex;
      markHeatmapCellManual(cellId);
      persistDashboardSnapshot();

      cell.style.transform = 'scale(0.95)';
      setTimeout(() => {
        cell.style.transform = 'scale(1)';
      }, 150);
    });

    cell.style.cursor = 'pointer';
    cell.style.transition = 'all 0.15s ease';
  });
}

// ===== KPI Card Status Cycling with Persistence =====
function setupKPICards() {
  const kpiCards = document.querySelectorAll('.kpi-card');
  
  // Status cycle: Green -> Amber -> Red -> Green
  const statusCycle = [
    { class: 'rag-green', circle: 'green', color: '#22c55e' },
    { class: 'rag-amber', circle: 'amber', color: '#f59e0b' },
    { class: 'rag-red', circle: 'red', color: '#dc2626' }
  ];
  
  const savedStates = getKpiStatesMap();
  
  kpiCards.forEach((card, index) => {
    // Create unique identifier for each card
    const cardId = card.querySelector('.kpi-title')?.textContent?.trim() || `card-${index}`;
    
    let currentStatusIndex = 0;
    
    // Check if we have a saved state for this card
    if (savedStates[cardId] !== undefined) {
      currentStatusIndex = savedStates[cardId];
    } else {
      // Initialize with current status (Green by default)
      const currentClass = card.classList.contains('rag-amber') ? 1 : 
                          card.classList.contains('rag-red') ? 2 : 0;
      currentStatusIndex = currentClass;
    }
    
    // Apply the current status
    applyCardStatus(card, statusCycle[currentStatusIndex]);

    if (isReadOnly()) {
      return;
    }

    card.addEventListener('click', () => {
      statusCycle.forEach(status => card.classList.remove(status.class));

      currentStatusIndex = (currentStatusIndex + 1) % statusCycle.length;
      const newStatus = statusCycle[currentStatusIndex];

      applyCardStatus(card, newStatus);

      savedStates[cardId] = currentStatusIndex;
      persistDashboardSnapshot();

      card.style.transform = 'scale(0.98)';
      setTimeout(() => {
        card.style.transform = 'scale(1)';
      }, 150);
    });

    card.style.cursor = 'pointer';
    card.style.transition = 'all 0.15s ease';

    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-2px)';
      card.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0)';
      card.style.boxShadow = 'var(--shadow)';
    });
  });
}

// Helper function to apply card status
function applyCardStatus(card, status) {
  // Apply new status class
  card.classList.add(status.class);
  
  // Update the circle color
  const circleEl = card.querySelector('.status-circle');
  if (circleEl) {
    // Remove all circle classes
    circleEl.classList.remove('green', 'amber', 'red');
    // Add new circle class
    circleEl.classList.add(status.circle);
  }
}
// ===== Evidence tab =====
function renderEvidence() {
  const el = document.getElementById("evidenceList");
  if (!el) return;

  const epic = EVIDENCE_PROGRAM_EPIC;
  const categoryBlocks = evidenceTestPlanCategories
    .map(cat => {
      const wideClass = cat.wide ? " evidence-category-wide" : "";
      const listItems = cat.issues
        .map(
          iss => `
        <li>
          <a href="${iss.url}" target="_blank" rel="noopener noreferrer">${iss.key}</a>
        </li>`
        )
        .join("");
      return `
      <section class="evidence-category${wideClass}" aria-labelledby="evidence-cat-${slugifyEvidenceTitle(cat.title)}">
        <h4 class="evidence-category-title" id="evidence-cat-${slugifyEvidenceTitle(cat.title)}">${cat.title}</h4>
        <ul class="evidence-plan-list">${listItems}</ul>
      </section>`;
    })
    .join("");

  const epicEl = `<a class="evidence-epic-link" href="${epic.url}" target="_blank" rel="noopener noreferrer">${epic.label}</a>`;

  el.innerHTML = `
    <div class="evidence-layout">
      <div class="evidence-epic">
        <p class="evidence-epic-label">Program epic</p>
        ${epicEl}
        <p class="muted evidence-epic-hint">All test plans below roll up to this epic for cross‑alliance content migration readiness.</p>
      </div>
      <div class="evidence-categories">
        ${categoryBlocks}
      </div>
    </div>
  `;
}

function slugifyEvidenceTitle(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ===== Tooltip hover + click =====
function setupTooltips(drawerApi) {
  const hoverZones = document.querySelectorAll(".integration-hover-zone");

  hoverZones.forEach(zone => {
    const integrationId = zone.getAttribute("data-integration");
    const tooltip = document.getElementById(`tooltip-${integrationId}`);

    // Hover tooltips (keep your existing behavior)
    if (tooltip) {
      let hoverTimeout;

      zone.addEventListener("mouseenter", () => {
        clearTimeout(hoverTimeout);
        document.querySelectorAll(".integration-tooltip").forEach(t => {
          t.classList.remove("show");
          t.style.display = "none";
        });
        tooltip.style.display = "block";
        setTimeout(() => tooltip.classList.add("show"), 10);
      });

      zone.addEventListener("mouseleave", () => {
        hoverTimeout = setTimeout(() => {
          tooltip.classList.remove("show");
          setTimeout(() => {
            if (!tooltip.classList.contains("show")) tooltip.style.display = "none";
          }, 250);
        }, 400);
      });

      tooltip.addEventListener("mouseenter", () => {
        clearTimeout(hoverTimeout);
        tooltip.classList.add("show");
      });

      tooltip.addEventListener("mouseleave", () => {
        tooltip.classList.remove("show");
        setTimeout(() => {
          if (!tooltip.classList.contains("show")) tooltip.style.display = "none";
        }, 250);
      });
    }

    if (!isReadOnly()) {
      zone.addEventListener("click", (e) => {
        e.stopPropagation();
        const h = handshakeData[integrationId];
        if (!h) return;

        drawerApi.openDrawer({
          title: h.title,
          owner: h.owner,
          validations: h.validations,
          evidence: h.evidence,
          risks: h.risks
        });
      });
    }
  });

  if (!isReadOnly()) {
    ["tooltip-media-data", "tooltip-data-streaming"].forEach(id => {
      const t = document.getElementById(id);
      if (!t) return;
      t.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const integrationId =
          id === "tooltip-media-data" ? "media-data" : "data-streaming";
        const h = handshakeData[integrationId];
        if (!h) return;

        drawerApi.openDrawer({
          title: h.title,
          owner: h.owner,
          validations: h.validations,
          evidence: h.evidence,
          risks: h.risks
        });
      });
    });
  }
}

// ===== Update Coverage and Risks tabs =====
function updateCoverageTab(data, type = 'phase') {
  // Coverage tab now shows comprehensive E2E coverage by default
  // Individual phase/handshake details are shown in the drawer and context
  console.log("Coverage tab maintains comprehensive E2E view - details shown in drawer");
  return;
}

// ===== Phases =====
function setupPhases(drawerApi) {
  const phases = document.querySelectorAll(".phase");

  phases.forEach(phase => {
    if (!isReadOnly()) {
      phase.addEventListener("click", () => {
        const phaseType = phase.getAttribute("data-phase");
        const data = phaseData[phaseType];

        if (!data) return;

        const owner =
          phaseType === "content" ? "Content Platform Alliance" :
          phaseType === "media" ? "Media Platform Alliance" :
          phaseType === "data" ? "Data Alliance" :
          phaseType === "streaming" ? "Streaming / Client QA" :
          "Cross‑Fleet QA";

        drawerApi.openDrawer({
          title: data.title,
          owner,
          phaseType: phaseType,
          validations: data.testPoints || [],
          evidence: [
            { label: "Epic CPTR‑68587", url: "https://jira.disney.com/browse/CPTR-68587" }
          ],
          risks: [
            "Ownership must remain explicit at the phase boundary",
            "Attach evidence per execution for traceability",
            "Downstream validation depends on upstream readiness"
          ]
        });

        phases.forEach(p => p.classList.remove("active"));
        phase.classList.add("active");
      });
    }

    phase.addEventListener("mouseenter", () => { phase.style.opacity = "0.9"; });
    phase.addEventListener("mouseleave", () => { phase.style.opacity = "1"; });
  });
}



// ===== App init =====
// Expose functions for Jira integration
window.getHeatmapStatesMap = getHeatmapStatesMap;
window.isHeatmapCellManual = isHeatmapCellManual;
window.refreshHeatmapFromState = refreshHeatmapFromState;
window.saveScopedJson = saveScopedJson;
window.persistDashboardSnapshot = persistDashboardSnapshot;

document.addEventListener("DOMContentLoaded", async () => {
  if (isReadOnly()) {
    applyReadOnlyShell();
    softenReadOnlyCopy();
  }

  setupTabs();

  migrateExistingHeatmapToManual();
  const loadedHeatmapFromUrl = applyHeatmapFromQueryString();
  await initSharedDashboardState();

  renderHeatmap();
  setupHeatmapShareUI();
  if (!loadedHeatmapFromUrl) {
    restoreCleanSiteUrl();
  }
  renderEvidence();
  setupKPICards();

  const drawerApi = setupDrawer();
  setupPhases(drawerApi);
  setupTooltips(drawerApi);

  console.log("Cross‑Alliance E2E Console Loaded");
  console.log("Reference: Epic CPTR‑68587");
});