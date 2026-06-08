#!/usr/bin/env node

/**
 * Manual Jira Sync Workaround
 * When you can't access Jira API, manually update the config
 */

const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '..', 'jira-config.json');

console.log('📋 Manual Jira Sync Workaround\n');
console.log('Instructions:');
console.log('1. Go to https://jira.disney.com/browse/CPTR-68587');
console.log('2. Check the current status and linked issues');
console.log('3. Update this script with the current information\n');

// Load current config
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));

// Manual updates - EDIT THESE VALUES based on what you see in Jira
const manualUpdates = {
  status: 'In Progress', // Update this
  updated: new Date().toISOString(),
  // Add/update executions as you see them
  executionsToUpdate: [
    // Example: { key: 'RIGHTS-27423', status: 'Done' }
  ]
};

// Apply updates
if (config.tickets && config.tickets[0]) {
  if (manualUpdates.status) {
    config.tickets[0].status = manualUpdates.status;
  }
  config.tickets[0].updated = manualUpdates.updated;
  
  // Update execution statuses
  manualUpdates.executionsToUpdate.forEach(update => {
    const exec = config.tickets[0].executions.find(e => e.key === update.key);
    if (exec) {
      exec.status = update.status;
      console.log(`✓ Updated ${update.key} to ${update.status}`);
    }
  });
}

config.sync.lastSyncDate = new Date().toISOString();

fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
console.log('\n✅ Manual sync completed!');
console.log('Changes saved to jira-config.json');
