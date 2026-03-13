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
      "Analytics & Monitoring: Real-time playback quality and error tracking",
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
    description: "Comprehensive testing across ALL phases with continuous feedback loops",
    steps: [
      "Content Validation: Verify source content meets specifications at ingestion",
      "Media Quality Check: Automated and manual QA during transformation",
      "Integration Testing: Contract testing + API testing across services",
      "E2E Playback Testing: Full user journey validation across clients",
      "Regression Testing: Ensure changes don’t break existing functionality",
      "Security Testing: Vulnerability scanning and penetration testing",
      "Accessibility Testing: WCAG compliance and assistive technology support"
    ],
    testPoints: [
      "Functional & Integration test coverage completeness",
      "Execution evidence attached to traceability plan",
      "Defect attribution by phase + handshake",
      "Release sign-off readiness checks"
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

// ===== Drawer helpers =====
function setupDrawer() {
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
      const a = document.createElement("a");
      a.href = link.url;
      a.target = "_blank";
      a.rel = "noreferrer";
      a.textContent = link.label;
      evidenceEl.appendChild(a);
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

    // Optional: update small in-page info box if present
    const phaseInfo = document.getElementById("phaseInfo");
    if (phaseInfo) {
      phaseInfo.innerHTML = `
        <p><strong>${payload.title || "Selection"}</strong></p>
        <p class="muted">Owner: ${payload.owner || "—"}</p>
        <p class="muted">Validations: ${(payload.validations || []).length} • Evidence: ${(payload.evidence || []).length}</p>
      `;
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
function renderHeatmap() {
  const el = document.getElementById("heatmap");
  if (!el) return;

  // Simple, static heatmap placeholder
  const alliances = ["Content", "Media", "Data", "Streaming"];
  const milestones = ["Metadata/Artwork", "Avails/Rights", "AV Assets", "Experience"];

  // Minimal placeholder statuses
  const grid = {
    Content:   ["cell-green", "cell-amber", "cell-amber", "cell-na"],
    Media:     ["cell-amber", "cell-amber", "cell-amber", "cell-na"],
    Data:      ["cell-amber", "cell-amber", "cell-na",    "cell-na"],
    Streaming: ["cell-na",    "cell-na",    "cell-amber", "cell-amber"]
  };

  let html = `<table><thead><tr><th>Alliance \\ Milestone</th>`;
  milestones.forEach(m => html += `<th>${m}</th>`);
  html += `</tr></thead><tbody>`;

  alliances.forEach(a => {
    html += `<tr><th>${a}</th>`;
    grid[a].forEach((cls, i) => {
      const text =
        cls === "cell-green" ? "GOOD" :
        cls === "cell-amber" ? "IN‑PROGRESS" :
        cls === "cell-red"   ? "RISK" :
        "—";
      html += `<td class="${cls}">${text}</td>`;
    });
    html += `</tr>`;
  });

  html += `</tbody></table>`;
  el.innerHTML = html;
}

// ===== Evidence tab =====
function renderEvidence() {
  const el = document.getElementById("evidenceList");
  if (!el) return;

  const items = Object.keys(handshakeData).map(key => {
    const h = handshakeData[key];
    const links = (h.evidence || [])
      .map(l => `<a href="${l.url}" target="_blank" rel="noreferrer">${l.label}</a>`)
      .join("");
    return `
      <div style="padding:12px;border:1px solid rgba(0,0,0,.08);border-radius:12px;margin-bottom:10px;background:#fff;">
        <div style="font-weight:800;">${h.title}</div>
        <div class="muted">Owner: ${h.owner}</div>
        <div style="margin-top:8px;">${links || "<span class='muted'>No links yet</span>"}</div>
      </div>
    `;
  });

  el.innerHTML = items.join("");
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
        }, 100);
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

    // Click on zone -> open drawer handshake details
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
  });

  // Keep your Google Sheet open behavior for Content→Media tooltip
  const contentMediaTooltip = document.getElementById("tooltip-content-media");
  if (contentMediaTooltip) {
    const clickArea = contentMediaTooltip.querySelector(".tooltip-click-area");
    const url = "https://docs.google.com/spreadsheets/d/1twFm_Jmv2j6sVVkD2WOp2fv3AMEHJGDLqqlO9654u3Y/edit?pli=1&gid=1024354782#gid=1024354782";

    const openLink = (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.open(url, "_blank");
    };

    contentMediaTooltip.addEventListener("click", openLink);
    if (clickArea) clickArea.addEventListener("click", openLink);
  }

  // Clicking Media→Data or Data→Streaming tooltip opens drawer too
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

// ===== Phases =====
function setupPhases(drawerApi) {
  const phases = document.querySelectorAll(".phase");

  phases.forEach(phase => {
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

      // Highlight active phase
      phases.forEach(p => p.classList.remove("active"));
      phase.classList.add("active");
    });

    // Light hover effect
    phase.addEventListener("mouseenter", () => { phase.style.opacity = "0.9"; });
    phase.addEventListener("mouseleave", () => { phase.style.opacity = "1"; });
  });
}

// ===== App init =====
document.addEventListener("DOMContentLoaded", () => {
  setupTabs();
  renderHeatmap();
  renderEvidence();

  const drawerApi = setupDrawer();
  setupPhases(drawerApi);
  setupTooltips(drawerApi);

  console.log("Cross‑Alliance E2E Console Loaded");
  console.log("Reference: Epic CPTR‑68587");
});