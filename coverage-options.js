/**
 * Coverage options preview — loads jira-config.json and renders Options A–E
 */

const ALLIANCES = ['Content', 'Media', 'Streaming'];
const MILESTONES = ['Metadata/Artwork', 'Avails/Rights', 'AV Assets', 'Title Planning & Exp.', 'Live & Linear'];

const DONE_STATUSES = new Set(['done', 'completed', 'closed', 'complete']);
const PROGRESS_STATUSES = new Set(['in progress', 'in review', 'open']);
const PENDING_STATUSES = new Set(['to do', 'backlog', 'new']);

function categorizeExecution(exec) {
  const summary = (exec.summary || '').toLowerCase();
  const key = (exec.key || '').toLowerCase();

  if (summary.includes('fda') || summary.includes('metadata') || summary.includes('artwork') ||
      summary.includes('asset') || summary.includes('rights') || summary.includes('avail') ||
      summary.includes('content') || summary.includes('ingestion') ||
      key.includes('rights') || key.includes('cptr') || key.includes('omfg') ||
      key.includes('prodreq')) {
    return 'Content';
  }
  if (summary.includes('amp') || summary.includes('sip') || summary.includes('bolt') ||
      summary.includes('encoding') || summary.includes('drm') || summary.includes('package') ||
      summary.includes('media') || summary.includes('vibranium') ||
      key.includes('dmedninja') || key.includes('boltm')) {
    return 'Media';
  }
  if (summary.includes('client') || summary.includes('disney+') || summary.includes('xavier') ||
      summary.includes('belle') || summary.includes('streaming') || summary.includes('playback') ||
      key.includes('dpqa') || key.includes('exp') || key.includes('gplbelle')) {
    return 'Streaming';
  }
  if (summary.includes('integration') || summary.includes('crossfleet') ||
      summary.includes('cross fleet') || summary.includes('traceability')) {
    return 'Cross-Fleet';
  }
  return 'Other';
}

function categorizeMilestone(exec) {
  const summary = (exec.summary || '').toLowerCase();
  if (summary.includes('metadata') || summary.includes('artwork') || summary.includes('fda') ||
      summary.includes('ingestion')) {
    return 0;
  }
  if (summary.includes('avail') || summary.includes('rights') || summary.includes('asset')) {
    return 1;
  }
  if (summary.includes('av ') || summary.includes('audio') || summary.includes('subtitle')) {
    return 2;
  }
  if (summary.includes('title') || summary.includes('planning')) {
    return 3;
  }
  if (summary.includes('live') || summary.includes('linear')) {
    return 4;
  }
  return 0;
}

function statusBucket(status) {
  const s = (status || '').toLowerCase();
  if (DONE_STATUSES.has(s)) return 'done';
  if (PROGRESS_STATUSES.has(s)) return 'progress';
  if (PENDING_STATUSES.has(s)) return 'pending';
  return 'pending';
}

function statusPill(status) {
  const bucket = statusBucket(status);
  const cls = bucket === 'done' ? 'status-pill--done'
    : bucket === 'progress' ? 'status-pill--progress'
    : 'status-pill--pending';
  return `<span class="status-pill ${cls}">${escapeHtml(status)}</span>`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function computeStats(executions) {
  const total = executions.length;
  let done = 0;
  let progress = 0;
  let pending = 0;
  executions.forEach(e => {
    const b = statusBucket(e.status);
    if (b === 'done') done++;
    else if (b === 'progress') progress++;
    else pending++;
  });
  const pct = total ? Math.round((done / total) * 100) : 0;
  return { total, done, progress, pending, pct };
}

function groupByAlliance(executions) {
  const groups = { Content: [], Media: [], Streaming: [], 'Cross-Fleet': [], Other: [] };
  executions.forEach(exec => {
    const alliance = categorizeExecution(exec);
    groups[alliance].push(exec);
  });
  return groups;
}

function buildMatrix(executions) {
  const matrix = {};
  ALLIANCES.forEach(a => {
    matrix[a] = MILESTONES.map(() => []);
  });
  executions.forEach(exec => {
    let alliance = categorizeExecution(exec);
    if (alliance === 'Cross-Fleet') {
      ALLIANCES.forEach(a => {
        matrix[a][0].push(exec);
      });
      return;
    }
    if (alliance === 'Other') alliance = 'Content';
    if (!matrix[alliance]) return;
    const col = categorizeMilestone(exec);
    matrix[alliance][col].push(exec);
  });
  return matrix;
}

function renderStatsBar(stats, syncDate) {
  const syncLabel = syncDate
    ? new Date(syncDate).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    : 'Unknown';
  return `
    <div class="coverage-stats">
      <div class="coverage-stat">
        <div class="coverage-stat-value">${stats.total}</div>
        <div class="coverage-stat-label">Test plans</div>
      </div>
      <div class="coverage-stat">
        <div class="coverage-stat-value">${stats.done}</div>
        <div class="coverage-stat-label">Complete</div>
      </div>
      <div class="coverage-stat">
        <div class="coverage-stat-value">${stats.progress}</div>
        <div class="coverage-stat-label">In progress</div>
      </div>
      <div class="coverage-stat">
        <div class="coverage-stat-value">${stats.pending}</div>
        <div class="coverage-stat-label">Pending</div>
      </div>
      <div class="coverage-stat">
        <div class="coverage-stat-value">${stats.pct}%</div>
        <div class="coverage-stat-label">Plan coverage</div>
      </div>
    </div>
    <p class="muted" style="margin:0 0 16px;">Last Jira sync: ${escapeHtml(syncLabel)}</p>`;
}

function renderExecutionTable(executions) {
  if (!executions.length) {
    return '<p class="muted">No executions found.</p>';
  }
  const rows = executions.map(exec => `
    <tr>
      <td><a href="${escapeHtml(exec.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(exec.key)}</a></td>
      <td>${escapeHtml(exec.summary)}</td>
      <td>${escapeHtml(exec.type || '—')}</td>
      <td>${statusPill(exec.status)}</td>
      <td>${escapeHtml(categorizeExecution(exec))}</td>
    </tr>`).join('');

  return `
    <div class="coverage-table-wrap">
      <table class="coverage-table">
        <thead>
          <tr>
            <th>Key</th>
            <th>Summary</th>
            <th>Type</th>
            <th>Status</th>
            <th>Alliance</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function renderAllianceSections(groups) {
  return ALLIANCES.map(alliance => {
    const items = groups[alliance] || [];
    if (!items.length) return '';
    const rows = items.map(exec => `
      <tr>
        <td><a href="${escapeHtml(exec.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(exec.key)}</a></td>
        <td>${escapeHtml(exec.summary)}</td>
        <td>${statusPill(exec.status)}</td>
      </tr>`).join('');
    return `
      <div class="alliance-section">
        <h3 class="alliance-section-title">${alliance} Platform</h3>
        <div class="coverage-table-wrap">
          <table class="coverage-table">
            <thead><tr><th>Key</th><th>Summary</th><th>Status</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>`;
  }).join('');
}

function renderMatrix(matrix) {
  const header = MILESTONES.map(m => `<th>${escapeHtml(m)}</th>`).join('');
  const body = ALLIANCES.map(alliance => {
    const cells = matrix[alliance].map(tickets => {
      if (!tickets.length) return '<td><span class="matrix-empty">—</span></td>';
      const items = tickets.map(t => `
        <span class="matrix-ticket">
          <a href="${escapeHtml(t.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(t.key)}</a>
          ${statusPill(t.status)}
        </span>`).join('');
      return `<td>${items}</td>`;
    }).join('');
    return `<tr><th>${alliance}</th>${cells}</tr>`;
  }).join('');

  return `
    <div class="coverage-matrix">
      <table>
        <thead><tr><th>Alliance \\ Milestone</th>${header}</tr></thead>
        <tbody>${body}</tbody>
      </table>
    </div>`;
}

// Sample Xray-style data for Option D preview only
const SAMPLE_XRAY = [
  { key: 'OMFG-18837', passed: 41, total: 50, pct: 82 },
  { key: 'BOLTM-7048', passed: 28, total: 32, pct: 88 },
  { key: 'RIGHTS-27423', passed: 19, total: 22, pct: 86 },
  { key: 'DPQA-6323', passed: 3, total: 25, pct: 12 },
  { key: 'PRODREQ-93064', passed: 0, total: 18, pct: 0 }
];

function renderOptionA(ticket, stats, groups, syncDate) {
  return `
    ${renderStatsBar(stats, syncDate)}
    ${renderAllianceSections(groups)}
    <div class="alliance-section">
      <h3 class="alliance-section-title">All executions</h3>
      ${renderExecutionTable(ticket.executions)}
    </div>`;
}

function renderOptionB(ticket, stats, groups, syncDate) {
  const epic = ticket;
  const categoryBlocks = ALLIANCES.map(alliance => {
    const items = groups[alliance] || [];
    if (!items.length) return '';
    const listItems = items.map(iss => `
      <li>
        <a href="${escapeHtml(iss.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(iss.key)}</a>
        ${statusPill(iss.status)}
        <span class="muted" style="margin-left:6px;">${escapeHtml(iss.summary.slice(0, 60))}${iss.summary.length > 60 ? '…' : ''}</span>
      </li>`).join('');
    return `
      <section class="evidence-category">
        <h4 class="evidence-category-title">${alliance} Platform</h4>
        <ul class="evidence-plan-list">${listItems}</ul>
      </section>`;
  }).join('');

  return `
    ${renderStatsBar(stats, syncDate)}
    <div class="evidence-layout">
      <div class="evidence-epic">
        <p class="evidence-epic-label">Program epic (live from Jira)</p>
        <a class="evidence-epic-link" href="${escapeHtml(epic.url)}" target="_blank" rel="noopener noreferrer">
          ${escapeHtml(epic.key)} — ${escapeHtml(epic.status)}
        </a>
        <p class="muted evidence-epic-hint">${escapeHtml(epic.title)}</p>
      </div>
      <div class="evidence-categories">${categoryBlocks}</div>
    </div>`;
}

function renderOptionC(ticket, stats, matrix, syncDate) {
  return `
    ${renderStatsBar(stats, syncDate)}
    <div class="card" style="margin-bottom:16px;">
      <div class="card-header"><h3 class="card-title">Execution list</h3></div>
      <div class="card-content">${renderExecutionTable(ticket.executions)}</div>
    </div>
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Milestone coverage matrix</h3>
        <p class="muted">Same rows/columns as the heatmap — which plans cover each cell</p>
      </div>
      <div class="card-content">${renderMatrix(matrix)}</div>
    </div>`;
}

function renderOptionD(stats) {
  const bars = SAMPLE_XRAY.map(item => `
    <div class="progress-row">
      <div class="progress-row-header">
        <a href="https://jira.disney.com/browse/${escapeHtml(item.key)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.key)}</a>
        <span>${item.passed}/${item.total} passed (${item.pct}%)</span>
      </div>
      <div class="progress-bar">
        <div class="progress-bar-fill progress-bar-fill--sample" style="width:${item.pct}%"></div>
      </div>
    </div>`).join('');

  return `
    <div class="sample-notice">
      <strong>Sample data</strong> — Option D requires Xray API sync (test case pass/fail counts).
      Bars below are illustrative; real values would come from an extended <code>sync-jira.js</code>.
    </div>
    <div class="coverage-stats">
      <div class="coverage-stat">
        <div class="coverage-stat-value">${stats.pct}%</div>
        <div class="coverage-stat-label">Plan status (live)</div>
      </div>
      <div class="coverage-stat">
        <div class="coverage-stat-value">~64%</div>
        <div class="coverage-stat-label">Test cases passed (sample)</div>
      </div>
      <div class="coverage-stat">
        <div class="coverage-stat-value">91</div>
        <div class="coverage-stat-label">Tests executed (sample)</div>
      </div>
      <div class="coverage-stat">
        <div class="coverage-stat-value">147</div>
        <div class="coverage-stat-label">Total test cases (sample)</div>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><h3 class="card-title">Test case coverage by plan</h3></div>
      <div class="card-content">${bars}</div>
    </div>`;
}

function renderOptionE(ticket, stats, syncDate) {
  const compactRows = ticket.executions.slice(0, 8).map(exec => `
    <tr>
      <td><a href="${escapeHtml(exec.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(exec.key)}</a></td>
      <td>${statusPill(exec.status)}</td>
    </tr>`).join('');

  return `
    <p class="muted" style="margin:0 0 12px;">Added to Overview tab — no new navigation.</p>
    <div class="option-e-grid">
      <div class="donut-wrap">
        <div class="donut" style="--pct:${stats.pct}">
          <span class="donut-label">${stats.pct}%</span>
        </div>
        <div class="donut-caption">${stats.done} of ${stats.total} plans complete<br>Synced ${escapeHtml(new Date(syncDate || Date.now()).toLocaleDateString())}</div>
      </div>
      <div class="coverage-table-wrap">
        <table class="coverage-table">
          <thead><tr><th>Plan</th><th>Status</th></tr></thead>
          <tbody>${compactRows}</tbody>
        </table>
        ${ticket.executions.length > 8 ? `<p class="muted" style="padding:8px 12px;margin:0;">+ ${ticket.executions.length - 8} more plans</p>` : ''}
      </div>
    </div>`;
}

const OPTION_META = {
  a: {
    title: 'Option A — New Coverage tab',
    desc: 'Dedicated tab with epic rollup stats and alliance-grouped execution tables. Plan-level coverage from live Jira sync.',
    effort: 'low',
    effortLabel: 'Low effort · 1–2 days'
  },
  b: {
    title: 'Option B — Enhance Evidence tab',
    desc: 'Rename to Evidence & Coverage. Replace static ticket lists with live jira-config.json data plus status badges.',
    effort: 'low',
    effortLabel: 'Low effort · no new tab'
  },
  c: {
    title: 'Option C — Coverage tab + milestone matrix',
    desc: 'Execution list plus a matrix aligned to the heatmap (alliance × milestone). Shows which plans back each cell.',
    effort: 'med',
    effortLabel: 'Medium effort · best heatmap alignment'
  },
  d: {
    title: 'Option D — Xray test case coverage',
    desc: 'Pass/fail progress bars per test plan. Requires extended Jira/Xray API sync for real test case counts.',
    effort: 'high',
    effortLabel: 'High effort · true QA coverage'
  },
  e: {
    title: 'Option E — Overview summary card',
    desc: 'Donut chart and compact plan table added below the heatmap on Overview. Minimal navigation change.',
    effort: 'low',
    effortLabel: 'Low effort · landing page widget'
  }
};

async function initCoveragePreview() {
  const content = document.getElementById('optionContent');
  try {
    const res = await fetch('jira-config.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const config = await res.json();
    const ticket = config.tickets && config.tickets[0];
    if (!ticket || !ticket.executions) throw new Error('No CPTR-68587 executions in jira-config.json');

    const stats = computeStats(ticket.executions);
    const groups = groupByAlliance(ticket.executions);
    const matrix = buildMatrix(ticket.executions);
    const syncDate = config.sync && config.sync.lastSyncDate;

    document.getElementById('epicTitle').textContent =
      `${ticket.key}: ${ticket.title}`;

    const renderers = {
      a: () => renderOptionA(ticket, stats, groups, syncDate),
      b: () => renderOptionB(ticket, stats, groups, syncDate),
      c: () => renderOptionC(ticket, stats, matrix, syncDate),
      d: () => renderOptionD(stats),
      e: () => renderOptionE(ticket, stats, syncDate)
    };

    function showOption(id) {
      const meta = OPTION_META[id];
      document.querySelectorAll('.option-tab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.option === id);
      });
      content.innerHTML = `
        <div class="option-meta">
          <h2>${escapeHtml(meta.title)}</h2>
          <p>${escapeHtml(meta.desc)}</p>
          <span class="option-tag option-tag--${meta.effort}">${escapeHtml(meta.effortLabel)}</span>
        </div>
        ${renderers[id]()}`;
    }

    document.querySelectorAll('.option-tab').forEach(btn => {
      btn.addEventListener('click', () => showOption(btn.dataset.option));
    });

    showOption('a');
  } catch (err) {
    content.innerHTML = `<div class="preview-error">Could not load jira-config.json: ${escapeHtml(err.message)}<br><br>Run a local server from the project root (e.g. <code>python3 -m http.server 8080</code>).</div>`;
  }
}

document.addEventListener('DOMContentLoaded', initCoveragePreview);
