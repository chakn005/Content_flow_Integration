#!/usr/bin/env node

/**
 * Jira Access Diagnostic Tool
 * Tests what you can access with your token
 */

const https = require('https');
const { URL } = require('url');
const fs = require('fs');
const path = require('path');

const CREDENTIALS_PATH = path.join(__dirname, '..', 'jira-credentials.json');

function loadCredentials() {
  try {
    const data = fs.readFileSync(CREDENTIALS_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading credentials:', error.message);
    process.exit(1);
  }
}

function makeRequest(url, credentials) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${credentials.jiraToken}`,
        'Accept': 'application/json'
      }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode, data: data });
      });
    }).on('error', reject);
  });
}

async function testEndpoint(name, url, credentials) {
  console.log(`\nTesting: ${name}`);
  console.log(`URL: ${url}`);
  
  try {
    const result = await makeRequest(url, credentials);
    console.log(`Status: ${result.status}`);
    
    if (result.status === 200) {
      try {
        const json = JSON.parse(result.data);
        console.log('✅ SUCCESS');
        return { success: true, data: json };
      } catch (e) {
        console.log('✅ SUCCESS (non-JSON response)');
        return { success: true, data: result.data.substring(0, 200) };
      }
    } else {
      console.log(`❌ FAILED: ${result.status}`);
      return { success: false, status: result.status };
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║   Jira Access Diagnostic Tool                  ║');
  console.log('╚════════════════════════════════════════════════╝');
  
  const credentials = loadCredentials();
  console.log(`\nTesting with token authentication`);
  console.log('═'.repeat(50));
  
  const tests = [
    {
      name: 'Current User Info',
      url: 'https://jira.disney.com/rest/api/2/myself'
    },
    {
      name: 'Server Info',
      url: 'https://jira.disney.com/rest/api/2/serverInfo'
    },
    {
      name: 'My Permissions',
      url: 'https://jira.disney.com/rest/api/2/mypermissions'
    },
    {
      name: 'CPTR-68587 (Direct)',
      url: 'https://jira.disney.com/rest/api/2/issue/CPTR-68587'
    },
    {
      name: 'CPTR-68587 (Search)',
      url: 'https://jira.disney.com/rest/api/2/search?jql=key=CPTR-68587'
    },
    {
      name: 'CPTR Project',
      url: 'https://jira.disney.com/rest/api/2/project/CPTR'
    },
    {
      name: 'My Issues',
      url: 'https://jira.disney.com/rest/api/2/search?jql=assignee=currentUser()&maxResults=5'
    },
    {
      name: 'Recent Issues',
      url: 'https://jira.disney.com/rest/api/2/search?jql=updated>=-7d&maxResults=5'
    }
  ];
  
  const results = [];
  
  for (const test of tests) {
    const result = await testEndpoint(test.name, test.url, credentials);
    results.push({ name: test.name, ...result });
    await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
  }
  
  console.log('\n\n╔════════════════════════════════════════════════╗');
  console.log('║   Summary                                      ║');
  console.log('╚════════════════════════════════════════════════╝\n');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful: ${successful.length}/${results.length}`);
  successful.forEach(r => console.log(`   - ${r.name}`));
  
  console.log(`\n❌ Failed: ${failed.length}/${results.length}`);
  failed.forEach(r => console.log(`   - ${r.name} (${r.status || r.error})`));
  
  console.log('\n\n📋 Recommendations:\n');
  
  if (successful.some(r => r.name === 'Current User Info')) {
    console.log('✅ Your token is valid and working');
  } else {
    console.log('❌ Your token is not working - regenerate it');
  }
  
  if (failed.some(r => r.name.includes('CPTR-68587'))) {
    console.log('❌ You don\'t have API access to CPTR-68587');
    console.log('   Solutions:');
    console.log('   1. Ask project admin to grant you access');
    console.log('   2. Check if you need to be added to a specific group');
    console.log('   3. Use manual sync instead (jira-update-form.html)');
  }
  
  if (successful.some(r => r.name === 'My Issues')) {
    console.log('✅ You can access your own issues');
    console.log('   Try syncing a ticket you created or are assigned to');
  }
  
  console.log('\n');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
