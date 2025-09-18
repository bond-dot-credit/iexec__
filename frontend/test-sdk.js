import fetch from 'node-fetch';

async function testSDKExecution() {
  try {
    console.log('Testing SDK-based task execution...');
    
    const response = await fetch('http://localhost:3000/api/execute-task-sdk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        iAppAddress: '0x7E5313CA1E86d0050B2d25deB8b92b2c57E2Dd0d',
        useProtectedData: false,
        inputValue: '5',
        userAddress: '0x...' // Test address
      })
    });
    
    const result = await response.json();
    console.log('SDK Response:', result);
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testSDKExecution();