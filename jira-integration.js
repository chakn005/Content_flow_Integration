/**
 * Jira Integration Module
 * Automatically syncs data from CPTR-68587 and updates the page content
 */

let jiraConfig = null;

// Load Jira configuration and update page
async function loadJiraData() {
  try {
    const response = await fetch('jira-config.json');
    jiraConfig = await response.json();
    
    if (jiraConfig && jiraConfig.tickets && jiraConfig.tickets.length > 0) {
      updatePageWithJiraData(jiraConfig);
    }
  } catch (error) {
    console.warn('Could not load Jira data:', error.message);
  }
}

// Update page elements with Jira data
function updatePageWithJiraData(config) {
  const mainTicket = config.tickets[0]; // CPTR-68587
  
  // Update epic badge in header with status
  updateEpicBadge(mainTicket);
  
  // Update risks section with Jira data
  updateRisksFromJira(mainTicket);
  
  // Update evidence section with linked tickets
  updateEvidenceFromJira(mainTicket);
  
  // Update KPI cards based on Jira status
  updateKPIsFromJira(config);
  
  // Add sync indicator
  addSyncIndicator(config);
}

// Update the epic badge with current status
function updateEpicBadge(ticket) {
  const epicBadge = document.querySelector('.epic-badge');
  if (epicBadge && ticket.status) {
    const statusSpan = document.createElement('span');
    statusSpan.className = 'epic-status';
    statusSpan.textContent = ticket.status;
    statusSpan.style.cssText = `
      margin-left: 8px;
      padding: 2px 8px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
    `;
    
    // Remove existing status if present
    const existingStatus = epicBadge.querySelector('.epic-status');
    if (existingStatus) {
      existingStatus.remove();
    }
    
    epicBadge.appendChild(statusSpan);
  }
}

// Update risks section with Jira description and linked issues
function updateRisksFromJira(ticket) {
  const riskList = document.getElementById('riskList');
  if (!riskList) return;
  
  // Keep existing risks and add Jira-sourced ones
  const jiraRisks = [];
  
  if (ticket.description && ticket.description.toLowerCase().includes('risk')) {
    jiraRisks.push(`[From Jira] ${ticket.description.substring(0, 100)}...`);
  }
  
  if (ticket.linkedIssues && ticket.linkedIssues.length > 0) {
    const blockers = ticket.linkedIssues.filter(issue => 
      issue.type && issue.type.toLowerCase().includes('block')
    );
    if (blockers.length > 0) {
      jiraRisks.push(`${blockers.length} blocking issue(s) identified in Jira`);
    }
  }
  
  // Add Jira risks to the list
  jiraRisks.forEach(risk => {
    const li = document.createElement('li');
    li.textContent = risk;
    li.style.fontStyle = 'italic';
    riskList.appendChild(li);
  });
}

// Update evidence section with linked tickets and executions
function updateEvidenceFromJira(ticket) {
  const evidenceList = document.getElementById('evidenceList');
  if (!evidenceList) return;
  
  // Create Jira evidence section
  const jiraSection = document.createElement('div');
  jiraSection.className = 'jira-evidence-section';
  jiraSection.style.cssText = `
    margin-top: 20px;
    padding: 20px;
    background: #f8f9fa;
    border-radius: 8px;
    border-left: 4px solid #0A2A66;
  `;
  
  const heading = document.createElement('h4');
  heading.textContent = `Epic: ${ticket.key} - ${ticket.title || 'Loading...'}`;
  heading.style.cssText = 'margin: 0 0 12px 0; color: #0A2A66;';
  jiraSection.appendChild(heading);
  
  if (ticket.status) {
    const statusDiv = document.createElement('div');
    statusDiv.innerHTML = `<strong>Status:</strong> ${ticket.status}`;
    statusDiv.style.marginBottom = '8px';
    jiraSection.appendChild(statusDiv);
  }
  
  if (ticket.assignee) {
    const assigneeDiv = document.createElement('div');
    assigneeDiv.innerHTML = `<strong>Assignee:</strong> ${ticket.assignee}`;
    assigneeDiv.style.marginBottom = '8px';
    jiraSection.appendChild(assigneeDiv);
  }
  
  // Add linked issues
  if (ticket.linkedIssues && ticket.linkedIssues.length > 0) {
    const linkedHeading = document.createElement('h5');
    linkedHeading.textContent = 'Linked Issues:';
    linkedHeading.style.cssText = 'margin: 16px 0 8px 0;';
    jiraSection.appendChild(linkedHeading);
    
    const linkedList = document.createElement('ul');
    linkedList.style.cssText = 'margin: 0; padding-left: 20px;';
    ticket.linkedIssues.forEach(issue => {
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.href = `https://jira.disney.com/browse/${issue.key}`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = `${issue.key} (${issue.type})`;
      link.style.color = '#0A2A66';
      li.appendChild(link);
      linkedList.appendChild(li);
    });
    jiraSection.appendChild(linkedList);
  }
  
  // Add executions
  if (ticket.executions && ticket.executions.length > 0) {
    const execHeading = document.createElement('h5');
    execHeading.textContent = `Test Executions (${ticket.executions.length}):`;
    execHeading.style.cssText = 'margin: 16px 0 8px 0;';
    jiraSection.appendChild(execHeading);
    
    const execList = document.createElement('ul');
    execList.style.cssText = 'margin: 0; padding-left: 20px;';
    ticket.executions.forEach(exec => {
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.href = exec.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = `${exec.key}: ${exec.summary}`;
      link.style.color = '#0A2A66';
      
      const statusSpan = document.createElement('span');
      statusSpan.textContent = ` [${exec.status}]`;
      statusSpan.style.cssText = 'font-weight: 600; margin-left: 4px;';
      
      li.appendChild(link);
      li.appendChild(statusSpan);
      execList.appendChild(li);
    });
    jiraSection.appendChild(execList);
  }
  
  // Add link to Jira
  const jiraLink = document.createElement('div');
  jiraLink.style.cssText = 'margin-top: 16px;';
  jiraLink.innerHTML = `
    <a href="${ticket.url}" target="_blank" rel="noopener noreferrer" 
       style="color: #0A2A66; font-weight: 600; text-decoration: none;">
      → View in Jira
    </a>
  `;
  jiraSection.appendChild(jiraLink);
  
  evidenceList.appendChild(jiraSection);
}

// Update KPI cards based on Jira component status
function updateKPIsFromJira(config) {
  const ticket = config.tickets[0];
  
  if (!ticket.components || ticket.components.length === 0) return;
  
  // Map Jira components to KPI cards
  const componentMap = {
    'Content Platform': '.kpi-card:nth-child(1)',
    'Media Platform': '.kpi-card:nth-child(2)',
    'UI Localization': '.kpi-card:nth-child(3)',
    'Streaming': '.kpi-card:nth-child(4)'
  };
  
  ticket.components.forEach(component => {
    const selector = componentMap[component];
    if (selector) {
      const card = document.querySelector(selector);
      if (card) {
        // Add a small indicator that this is synced from Jira
        const indicator = document.createElement('div');
        indicator.textContent = '● Synced';
        indicator.style.cssText = `
          font-size: 10px;
          color: #10b981;
          margin-top: 4px;
        `;
        card.appendChild(indicator);
      }
    }
  });
}

// Add sync indicator to show last sync time
function addSyncIndicator(config) {
  if (!config.sync || !config.sync.lastSyncDate) return;
  
  const header = document.querySelector('.header-container');
  if (!header) return;
  
  const syncIndicator = document.createElement('div');
  syncIndicator.className = 'jira-sync-indicator';
  syncIndicator.style.cssText = `
    position: absolute;
    top: 12px;
    right: 200px;
    font-size: 11px;
    color: #6b7280;
    display: flex;
    align-items: center;
    gap: 6px;
  `;
  
  const lastSync = new Date(config.sync.lastSyncDate);
  const timeAgo = getTimeAgo(lastSync);
  
  syncIndicator.innerHTML = `
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
    </svg>
    <span>Jira synced ${timeAgo}</span>
  `;
  
  header.style.position = 'relative';
  header.appendChild(syncIndicator);
}

// Helper function to get time ago string
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadJiraData);
} else {
  loadJiraData();
}

// Export for use in other scripts
window.jiraIntegration = {
  loadJiraData,
  getConfig: () => jiraConfig
};
