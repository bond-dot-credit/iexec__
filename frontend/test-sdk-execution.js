#!/usr/bin/env node

async function testSDKExecution() {
  const testCases = [
    {
      name: "Test with Requester Secret",
      payload: {
        iAppAddress: '0x7E5313CA1E86d0050B2d25deB8b92b2c57E2Dd0d',
        useProtectedData: false,
        inputValue: '5',
        userAddress: '0x...' // Test address
      }
    },
    {
      name: "Test with Protected Data",
      payload: {
        iAppAddress: '0x7E5313CA1E86d0050B2d25deB8b92b2c57E2Dd0d',
        useProtectedData: true,
        protectedDataAddress: '0x1016cebd9CDFe9f4dF90e02ee5F9f319D82C1B4B',
        userAddress: '0x...' // Test address
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n=== ${testCase.name} ===`);
    
    try {
      console.log('Payload:', JSON.stringify(testCase.payload, null, 2));
      
      const response = await fetch('http://localhost:3000/api/execute-task-sdk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCase.payload)
      });
      
      const contentType = response.headers.get('content-type');
      let result;
      
      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
      } else {
        result = await response.text();
      }
      
      console.log('Status:', response.status);
      console.log('Response:', typeof result === 'string' ? result : JSON.stringify(result, null, 2));
      
      if (!response.ok) {
        console.error('❌ Request failed');
      } else if (result.error) {
        console.error('❌ API Error:', result.error);
        if (result.details) {
          console.error('Details:', result.details);
        }
      } else {
        console.log('✅ Success:', {
          deal: result.deal,
          task: result.task,
          txHash: result.txHash,
          status: result.status
        });
      }
      
    } catch (error) {
      console.error('❌ Network/Parse Error:', error.message);
    }
  }
}

// Use built-in fetch (Node 18+) or fallback
const fetch = globalThis.fetch || (() => {
  console.error('❌ fetch is not available. Please use Node 18+ or install node-fetch');
  process.exit(1);
})();

testSDKExecution().catch(console.error);