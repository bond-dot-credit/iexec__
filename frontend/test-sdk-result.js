// Test SDK-based task result retrieval
const testTaskId = '0x2a0d078805cc3678b79430f3a5549d35136407869c4b7d40431b7374cfa0412b'; // From our protected data test

async function testSDKResult() {
  console.log('=== Testing SDK Result Retrieval ===');
  
  try {
    const response = await fetch(`http://localhost:3000/api/get-task-result-sdk?taskId=${testTaskId}`);
    
    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ SDK result retrieval successful');
      if (data.completed && data.results) {
        console.log('✅ Task completed with results');
      } else if (data.completed) {
        console.log('⚠️ Task completed but no results downloaded');
      } else {
        console.log('⏳ Task still in progress');
      }
    } else {
      console.log('❌ SDK result retrieval failed');
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

// Test with multiple task IDs from our previous executions
async function testMultipleTasks() {
  const taskIds = [
    '0x2a0d078805cc3678b79430f3a5549d35136407869c4b7d40431b7374cfa0412b', // Protected data test
    '0xdbb6aec06329e20cb9fa1e8c56c26f7b29d1591209577723c450147e6dee06ec'  // Requester secret test
  ];
  
  for (const taskId of taskIds) {
    console.log(`\n=== Testing Task ${taskId} ===`);
    
    try {
      const response = await fetch(`http://localhost:3000/api/get-task-result-sdk?taskId=${taskId}`);
      console.log('Status:', response.status);
      const data = await response.json();
      
      if (data.error) {
        console.log('❌ Error:', data.error);
      } else {
        console.log('Task Status:', data.status);
        console.log('Completed:', data.completed);
        if (data.results) {
          console.log('✅ Results available');
          console.log('Result preview:', JSON.stringify(data.results).substring(0, 200) + '...');
        } else {
          console.log('⚠️ No results available');
        }
      }
      
    } catch (error) {
      console.error('❌ Request failed:', error.message);
    }
  }
}

// Run the test
testMultipleTasks();