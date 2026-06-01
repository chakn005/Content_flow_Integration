#!/usr/bin/env node

/**
 * Manual Jira Update Helper
 * Interactive script to help you manually update Jira data
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const CONFIG_PATH = path.join(__dirname, '..', 'jira-config.json');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function loadConfig() {
  try {
    const data = fs.readFileSync(CONFIG_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading config:', error.message);
    process.exit(1);
  }
}

function saveConfig(config) {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
    console.log('\n✅ Configuration saved successfully!');
  } catch (error) {
    console.error('Error saving config:', error.message);
    process.exit(1);
  }
}

async function updateMainTicket(config) {
  console.log('\n📋 Updating CPTR-68587 Main Ticket');
  console.log('═'.repeat(50));
  
  const ticket = config.tickets[0];
  
  console.log('\nCurrent values (press Enter to keep):');
  
  const title = await question(`Title [${ticket.title}]: `);
  if (title) ticket.title = title;
  
  const status = await question(`Status [${ticket.status}]: `);
  if (status) ticket.status = status;
  
  const priority = await question(`Priority [${ticket.priority}]: `);
  if (priority) ticket.priority = priority;
  
  const assignee = await question(`Assignee [${ticket.assignee}]: `);
  if (assignee) ticket.assignee = assignee;
  
  const description = await question(`Description [${ticket.description.substring(0, 50)}...]: `);
  if (description) ticket.description = description;
  
  ticket.updated = new Date().toISOString();
  
  console.log('\n✓ Main ticket updated');
}

async function addExecution(config) {
  console.log('\n🧪 Add Test Execution');
  console.log('═'.repeat(50));
  
  const key = await question('Execution Key (e.g., CPTR-12345): ');
  if (!key) {
    console.log('Skipped - no key provided');
    return;
  }
  
  const summary = await question('Summary: ');
  const status = await question('Status (Done/In Progress/To Do/Blocked): ');
  const type = await question('Type [Test]: ') || 'Test';
  
  const execution = {
    key: key,
    summary: summary || 'Test execution',
    status: status || 'To Do',
    type: type,
    url: `https://jira.disney.com/browse/${key}`
  };
  
  config.tickets[0].executions.push(execution);
  console.log(`✓ Added execution: ${key}`);
}

async function removeExecution(config) {
  const executions = config.tickets[0].executions;
  
  if (executions.length === 0) {
    console.log('\nNo executions to remove');
    return;
  }
  
  console.log('\n🗑️  Remove Test Execution');
  console.log('═'.repeat(50));
  console.log('\nCurrent executions:');
  executions.forEach((exec, index) => {
    console.log(`${index + 1}. ${exec.key} - ${exec.summary} [${exec.status}]`);
  });
  
  const indexStr = await question('\nEnter number to remove (or press Enter to cancel): ');
  const index = parseInt(indexStr) - 1;
  
  if (index >= 0 && index < executions.length) {
    const removed = executions.splice(index, 1)[0];
    console.log(`✓ Removed: ${removed.key}`);
  }
}

async function viewCurrentData(config) {
  console.log('\n📊 Current Jira Data');
  console.log('═'.repeat(50));
  
  const ticket = config.tickets[0];
  
  console.log(`\n🎫 Main Ticket: ${ticket.key}`);
  console.log(`   Title: ${ticket.title}`);
  console.log(`   Status: ${ticket.status}`);
  console.log(`   Priority: ${ticket.priority}`);
  console.log(`   Assignee: ${ticket.assignee}`);
  console.log(`   Updated: ${ticket.updated}`);
  
  console.log(`\n🧪 Test Executions (${ticket.executions.length}):`);
  ticket.executions.forEach((exec, index) => {
    console.log(`   ${index + 1}. ${exec.key} - ${exec.summary}`);
    console.log(`      Status: ${exec.status}`);
  });
  
  console.log(`\n🔗 Linked Issues (${ticket.linkedIssues.length}):`);
  ticket.linkedIssues.forEach((issue, index) => {
    console.log(`   ${index + 1}. ${issue.key} (${issue.type})`);
  });
  
  console.log(`\n📦 Components (${ticket.components.length}):`);
  ticket.components.forEach((comp, index) => {
    console.log(`   ${index + 1}. ${comp}`);
  });
  
  console.log(`\n🏷️  Labels (${ticket.labels.length}):`);
  ticket.labels.forEach((label, index) => {
    console.log(`   ${index + 1}. ${label}`);
  });
}

async function quickUpdate(config) {
  console.log('\n⚡ Quick Status Update');
  console.log('═'.repeat(50));
  
  const ticket = config.tickets[0];
  
  console.log('\nSelect new status:');
  console.log('1. Open');
  console.log('2. In Progress');
  console.log('3. In Review');
  console.log('4. Done');
  console.log('5. Blocked');
  
  const choice = await question('\nChoice (1-5): ');
  
  const statuses = ['Open', 'In Progress', 'In Review', 'Done', 'Blocked'];
  const index = parseInt(choice) - 1;
  
  if (index >= 0 && index < statuses.length) {
    ticket.status = statuses[index];
    ticket.updated = new Date().toISOString();
    console.log(`✓ Status updated to: ${ticket.status}`);
  }
}

async function main() {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║   Manual Jira Update Helper                    ║');
  console.log('║   CPTR-68587 Data Management                   ║');
  console.log('╚════════════════════════════════════════════════╝');
  
  const config = loadConfig();
  
  while (true) {
    console.log('\n\n📋 Main Menu');
    console.log('═'.repeat(50));
    console.log('1. View current data');
    console.log('2. Update main ticket (CPTR-68587)');
    console.log('3. Quick status update');
    console.log('4. Add test execution');
    console.log('5. Remove test execution');
    console.log('6. Save and exit');
    console.log('7. Exit without saving');
    
    const choice = await question('\nSelect option (1-7): ');
    
    switch (choice) {
      case '1':
        await viewCurrentData(config);
        break;
      case '2':
        await updateMainTicket(config);
        break;
      case '3':
        await quickUpdate(config);
        break;
      case '4':
        await addExecution(config);
        break;
      case '5':
        await removeExecution(config);
        break;
      case '6':
        saveConfig(config);
        config.sync.lastSyncDate = new Date().toISOString();
        console.log('\n✅ All changes saved!');
        console.log('\nNext steps:');
        console.log('1. git add jira-config.json');
        console.log('2. git commit -m "Update Jira data"');
        console.log('3. git push origin main');
        console.log('\nYour site will update in 2-3 minutes! 🚀');
        rl.close();
        return;
      case '7':
        console.log('\n❌ Exiting without saving');
        rl.close();
        return;
      default:
        console.log('\n❌ Invalid option');
    }
  }
}

main().catch(error => {
  console.error('Error:', error.message);
  rl.close();
  process.exit(1);
});
