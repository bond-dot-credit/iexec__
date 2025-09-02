import { IExecDataProtectorCore, getWeb3Provider } from '@iexec/dataprotector';

async function createProtectedData() {
  try {
    console.log('Creating protected data with encrypted integer A...');

    // Use the wallet private key from environment variable
    const privateKey = process.env.WALLET_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('WALLET_PRIVATE_KEY environment variable is required');
    }
    const web3Provider = getWeb3Provider(privateKey);
    
    // Initialize DataProtector Core
    const dataProtectorCore = new IExecDataProtectorCore(web3Provider);

    // Create protected data with integer A = 5
    const protectedData = await dataProtectorCore.protectData({
      data: {
        integerA: 5,
        description: "Encrypted integer for scoring algorithm testing",
        source: "iExec scoring algorithm demo"
      },
      name: 'Scoring Algorithm Input Data'
    });

    console.log('Protected data created successfully!');
    console.log('Protected Data Details:');
    console.log('  - Address:', protectedData.address);
    console.log('  - Owner:', protectedData.owner);
    console.log('  - Name:', protectedData.name);
    console.log('  - Schema:', JSON.stringify(protectedData.schema, null, 2));
    console.log('  - Transaction ID:', protectedData.txHash);

    console.log('Next steps:');
    console.log(`1. Grant access to iApp: ${protectedData.address}`);
    console.log('2. Run iApp with --protectedData parameter');

    return protectedData.address;

  } catch (error) {
    console.error('Error creating protected data:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run the script
createProtectedData();