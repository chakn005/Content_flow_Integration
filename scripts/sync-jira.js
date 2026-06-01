#!/usr/bin/env node

/**
 * Jira Sync Script
 * Fetches ticket data from Jira and updates local configuration
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { URL } = require('url');

// Load configuration files
const CONFIG_PATH = path.join(__dirname, '..', 'jira-config.json');
const CREDENTIALS_PATH = path.join(__dirname, '..', 'jira-credentials.json');

function loadJSON(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading ${filePath}:`, error.message);
    process.exit(1);
  }
}

function saveJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`✓ Saved to ${filePath}`);
  } catch (error) {
    console.error(`Error saving ${filePath}:`, error.message);
    process.exit(1);
  }
}

function makeJiraRequest(url, credentials) {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${credentials.jiraUsername}:${credentials.jiraToken}`).toString('base64');
    
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    };

    https.get(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(new Error(`Failed to parse JSON: ${error.message}`));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

async function fetchJiraTicket(ticketKey, config, credentials) {
  const url = `${config.jiraBaseUrl}/rest/api/2/issue/${ticketKey}`;
  
  console.log(`Fetching ${ticketKey}...`);
  
  try {
    const issue = await makeJiraRequest(url, credentials);
    
    return {
      key: issue.key,
      url: `${config.jiraBaseUrl}/browse/${issue.key}`,
      title: issue.fields.summary,
      description: issue.fields.description || '',
      status: issue.fields.status.name,
      priority: issue.fields.priority ? issue.fields.priority.name : 'None',
      assignee: issue.fields.assignee ? issue.fields.assignee.displayName : 'Unassigned',
      reporter: issue.fields.reporter ? issue.fields.reporter.displayName : 'Unknown',
      created: issue.fields.created,
      updated: issue.fields.updated,
      labels: issue.fields.labels || [],
      components: issue.fields.components ? issue.fields.components.map(c => c.name) : [],
      linkedIssues: issue.fields.issuelinks ? issue.fields.issuelinks.map(link => ({
        key: link.outwardIssue ? link.outwardIssue.key : link.inwardIssue.key,
        type: link.type.name,
        direction: link.outwardIssue ? 'outward' : 'inward'
      })) : [],
      executions: []
    };
  } catch (error) {
    console.error(`Error fetching ${ticketKey}:`, error.message);
    throw error;
  }
}

async function fetchExecutions(ticketKey, config, credentials) {
  // Attempt to fetch test executions and linked tickets
  console.log(`Checking for executions and linked tickets for ${ticketKey}...`);
  
  try {
    // Search for linked test executions and related tickets
    const jql = encodeURIComponent(`issue = ${ticketKey} OR "Epic Link" = ${ticketKey} OR issueFunction in linkedIssuesOf("key = ${ticketKey}")`);
    const url = `${config.jiraBaseUrl}/rest/api/2/search?jql=${jql}&fields=key,summary,status,issuetype&maxResults=100`;
    
    const result = await makeJiraRequest(url, credentials);
    
    const executions = result.issues
      .filter(issue => 
        issue.fields.issuetype.name.toLowerCase().includes('test') || 
        issue.fields.issuetype.name.toLowerCase().includes('execution') ||
        issue.fields.issuetype.name.toLowerCase().includes('story') ||
        issue.fields.issuetype.name.toLowerCase().includes('task')
      )
      .map(issue => ({
        key: issue.key,
        summary: issue.fields.summary,
        status: issue.fields.status.name,
        type: issue.fields.issuetype.name,
        url: `${config.jiraBaseUrl}/browse/${issue.key}`
      }));
    
    return executions;
  } catch (error) {
    console.warn(`Could not fetch executions: ${error.message}`);
    return [];
  }
}

async function main() {
  console.log('🔄 Starting Jira sync...\n');
  
  // Load configuration
  const config = loadJSON(CONFIG_PATH);
  const credentials = loadJSON(CREDENTIALS_PATH);
  
  // Validate credentials
  if (credentials.jiraUsername === 'YOUR_JIRA_USERNAME_OR_EMAIL' || 
      credentials.jiraToken === 'YOUR_JIRA_API_TOKEN') {
    console.error('❌ Please update jira-credentials.json with your actual credentials');
    process.exit(1);
  }
  
  // Fetch all tickets
  const updatedTickets = [];
  
  for (const ticket of config.tickets) {
    try {
      const ticketData = await fetchJiraTicket(ticket.key, config, credentials);
      const executions = await fetchExecutions(ticket.key, config, credentials);
      
      ticketData.executions = executions;
      updatedTickets.push(ticketData);
      
      console.log(`✓ Synced ${ticket.key}: ${ticketData.title}`);
      console.log(`  Status: ${ticketData.status}`);
      console.log(`  Executions: ${executions.length}`);
      console.log('');
    } catch (error) {
      console.error(`✗ Failed to sync ${ticket.key}`);
      updatedTickets.push(ticket); // Keep old data
    }
  }
  
  // Update config
  config.tickets = updatedTickets;
  config.sync.lastSyncDate = new Date().toISOString();
  config.sync.enabled = true;
  
  saveJSON(CONFIG_PATH, config);
  
  console.log('\n✅ Jira sync completed!');
  console.log(`Last sync: ${config.sync.lastSyncDate}`);
}

// Run the script
main().catch(error => {
  console.error('❌ Sync failed:', error.message);
  process.exit(1);
});
