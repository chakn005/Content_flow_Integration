/**
 * Test Coverage tab — Option A: execution status rollup from jira-config.json
 */

(function () {
  const ALLIANCES = ['Content', 'Media', 'Streaming'];

  const DONE_STATUSES = new Set(['done', 'completed', 'closed', 'complete']);
  const PROGRESS_STATUSES = new Set(['in progress', 'in review', 'open']);

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

  function statusBucket(status) {
    const s = (status || '').toLowerCase();
    if (DONE_STATUSES.has(s)) return 'done';
    if (PROGRESS_STATUSES.has(s)) return 'progress';
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
      groups[categorizeExecution(exec)].push(exec);
    });
    return groups;
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
      <p class="muted coverage-sync-note">Last Jira sync: ${escapeHtml(syncLabel)}</p>`;
  }

  function renderExecutionTable(executions) {
    if (!executions.length) {
      return '<p class="muted">No linked test plans or stories found.</p>';
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

  function renderTestCoverageTab(config) {
    const el = document.getElementById('testCoverageContent');
    if (!el) return;

    const ticket = config.tickets && config.tickets[0];
    if (!ticket || !ticket.executions || !ticket.executions.length) {
      el.innerHTML = '<p class="muted">No test coverage data available. Run Jira sync to populate jira-config.json.</p>';
      return;
    }

    const stats = computeStats(ticket.executions);
    const groups = groupByAlliance(ticket.executions);
    const syncDate = config.sync && config.sync.lastSyncDate;

    el.innerHTML = `
      <div class="coverage-epic-header">
        <a class="coverage-epic-link" href="${escapeHtml(ticket.url)}" target="_blank" rel="noopener noreferrer">
          ${escapeHtml(ticket.key)}
        </a>
        <span class="muted">— ${escapeHtml(ticket.title)}</span>
        ${ticket.status ? statusPill(ticket.status) : ''}
      </div>
      ${renderStatsBar(stats, syncDate)}
      ${renderAllianceSections(groups)}
      <div class="alliance-section">
        <h3 class="alliance-section-title">All executions</h3>
        ${renderExecutionTable(ticket.executions)}
      </div>`;
  }

  window.renderTestCoverageTab = renderTestCoverageTab;
})();
