#!/usr/bin/env node

async function testCLIExecution() {
  console.log('=== Testing existing CLI approach ===');
  
  try {
    const response = await fetch('http://localhost:3000/api/execute-task', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        iAppAddress: '0x7E5313CA1E86d0050B2d25deB8b92b2c57E2Dd0d',
        useProtectedData: false,
        inputValue: '5',
        userAddress: '0x...'
      })
    });
    
    const contentType = response.headers.get('content-type');
    let result;
    
    if (contentType && contentType.includes('application/json')) {
      result = await response.json();
    } else {
      result = await response.text();
    }
    
    console.log('CLI Status:', response.status);
    console.log('CLI Response:', typeof result === 'string' ? result : JSON.stringify(result, null, 2));
    
    if (response.ok && !result.error) {
      console.log('✅ CLI approach works');
      console.log('Deal:', result.deal);
      console.log('Task:', result.task);
    } else {
      console.log('❌ CLI approach failed');
    }
    
  } catch (error) {
    console.error('❌ CLI Error:', error.message);
  }
}

// Use built-in fetch (Node 18+) or fallback
const fetch = globalThis.fetch || (() => {
  console.error('❌ fetch is not available. Please use Node 18+');
  process.exit(1);
})();

testCLIExecution().catch(console.error);