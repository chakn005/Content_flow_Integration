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
  "CPTR-68704": { // Localization
    completed: 21,
    total: 27,
    integrationPoints: { completed: 3, total: 4 }
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
  localization: {
    title: "UI Localization Phase",
    description: "UI strings, terminology, and language asset management",
    steps: [
      "Language Processing: Translate and adapt in-product UI copy",
      "Regional Adaptation: Market-specific presentation of UI strings",
      "Terminology & Language Asset Management: Glossaries, TMS, and string lifecycle",
      "Scope: UI strings only (excludes subtitles, dubbing, and metadata pipelines)"
    ],
    testPoints: [
      "String coverage and context accuracy in product UI",
      "Terminology consistency across client surfaces",
      "Language switching and locale behavior",
      "Regression checks for UI string updates"
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
      "UI Localization Testing: UI string, terminology, and language-asset checks",
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
  "data-localization": {
    title: "Handshake: Data → UI Localization",
    owner: "UI Localization Alliance",
    validations: [
      "Content metadata transfer for localization",
      "Regional availability rules validation",
      "Language-specific content routing"
    ],
    evidence: [
      { label: "Epic CPTR‑68587", url: "https://jira.disney.com/browse/CPTR-68587" }
    ],
    risks: [
      "Metadata completeness for localization workflows",
      "Regional content availability conflicts"
    ]
  },
  "localization-streaming": {
    title: "Handshake: UI Localization → Streaming",
    owner: "Streaming / Client QA",
    validations: [
      "Localized content delivery validation",
      "Language switching functionality",
      "Regional content discovery"
    ],
    evidence: [
      { label: "Epic CPTR‑68587", url: "https://jira.disney.com/browse/CPTR-68587" }
    ],
    risks: [
      "Localized content caching issues",
      "Language preference persistence"
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
          localization: {
            icon: "🌍",
            focus: "UI Strings & Language Asset Management",
            critical: "Accurate UI copy, terminology, and language assets drive consistent in-app experiences.",
            dependencies: "Needs Data Layer catalog sync and regional metadata routing."
          },
          streaming: {
            icon: "📺",
            focus: "Content Delivery & Playback",
            critical: "Multi-device compatibility and CDN optimization ensure optimal user experience.",
            dependencies: "Requires UI Localization processing and content discovery integration."
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
function renderHeatmap() {
  const el = document.getElementById("heatmap");
  if (!el) return;

  // Simple, static heatmap placeholder
  const alliances = ["Content", "Media", "Data", "UI Localization", "Streaming"];
  const milestones = ["Metadata/Artwork", "Avails/Rights", "AV Assets", "Title Planning & Exp.", "Live & Linear"];

  // Minimal placeholder statuses
  const grid = {
    Content:      ["cell-green", "cell-amber", "cell-amber", "cell-na", "cell-na"],
    Media:        ["cell-amber", "cell-amber", "cell-amber", "cell-na", "cell-na"],
    Data:         ["cell-amber", "cell-amber", "cell-na",    "cell-na", "cell-na"],
    "UI Localization": ["cell-na",    "cell-amber", "cell-amber", "cell-na", "cell-na"],
    Streaming:    ["cell-na",    "cell-na",    "cell-amber", "cell-na", "cell-amber"]
  };

  const heatmapCellTitle = isReadOnly()
    ? "Readiness snapshot (read-only)"
    : "Click to cycle: GOOD → IN‑PROGRESS → RISK → N/A";

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
        "N/A";
      html += `<td class="${cls} clickable-cell" data-alliance="${a}" data-milestone="${i}" title="${heatmapCellTitle}">${text}</td>`;
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
  const cells = document.querySelectorAll('.clickable-cell');
  
  // Status cycle for heatmap: Green -> Amber -> Red -> N/A -> Green
  const statusCycle = [
    { class: 'cell-green', text: 'GOOD' },
    { class: 'cell-amber', text: 'IN‑PROGRESS' },
    { class: 'cell-red', text: 'RISK' },
    { class: 'cell-na', text: 'N/A' }
  ];
  
  // v2: grid includes "Title Planning & Exp." column; prior keys would mis-align cells
  const savedHeatmapStates = JSON.parse(localStorage.getItem("heatmapCellStates-v3") || "{}");
  
  cells.forEach(cell => {
    // Create unique identifier for each cell
    const alliance = cell.dataset.alliance;
    const milestone = cell.dataset.milestone;
    const cellId = `${alliance}-${milestone}`;
    
    // Check if we have a saved state for this cell
    if (savedHeatmapStates[cellId] !== undefined) {
      const savedIndex = savedHeatmapStates[cellId];
      const savedStatus = statusCycle[savedIndex];
      
      // Remove all status classes
      statusCycle.forEach(status => cell.classList.remove(status.class));
      // Apply saved status
      cell.classList.add(savedStatus.class);
      cell.textContent = savedStatus.text;
    }
    
    if (!isReadOnly()) {
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

        savedHeatmapStates[cellId] = nextIndex;
        localStorage.setItem("heatmapCellStates-v3", JSON.stringify(savedHeatmapStates));

        cell.style.transform = 'scale(0.95)';
        setTimeout(() => {
          cell.style.transform = 'scale(1)';
        }, 150);
      });

      cell.style.cursor = 'pointer';
      cell.style.transition = 'all 0.15s ease';
    }
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
  
  // Load saved states from localStorage
  const savedStates = JSON.parse(localStorage.getItem('kpiCardStates') || '{}');
  
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
      localStorage.setItem('kpiCardStates', JSON.stringify(savedStates));

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
          phaseType === "localization" ? "UI Localization Alliance" :
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
document.addEventListener("DOMContentLoaded", () => {
  if (isReadOnly()) {
    applyReadOnlyShell();
    softenReadOnlyCopy();
  }

  setupTabs();

  renderHeatmap();
  renderEvidence();
  setupKPICards();

  const drawerApi = setupDrawer();
  setupPhases(drawerApi);
  setupTooltips(drawerApi);

  console.log("Cross‑Alliance E2E Console Loaded");
  console.log("Reference: Epic CPTR‑68587");
});