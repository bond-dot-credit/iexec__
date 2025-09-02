import { IExecDataProtectorCore, getWeb3Provider } from '@iexec/dataprotector';

async function grantAccess() {
  try {
    console.log('Granting access to protected data...');

    // Configuration
    const protectedDataAddress = process.env.PROTECTED_DATA_ADDRESS || '0x1016cebd9CDFe9f4dF90e02ee5F9f319D82C1B4B';
    const iAppAddress = process.env.IAPP_ADDRESS || '0x7E5313CA1E86d0050B2d25deB8b92b2c57E2Dd0d';
    const privateKey = process.env.WALLET_PRIVATE_KEY;
    const authorizedUser = process.env.AUTHORIZED_USER_ADDRESS || '0xa5ebd895c62fb917d97c6f3e39a4562f1be5ceee';

    if (!privateKey) {
      throw new Error('WALLET_PRIVATE_KEY environment variable is required');
    }

    const web3Provider = getWeb3Provider(privateKey);
    const dataProtectorCore = new IExecDataProtectorCore(web3Provider);

    console.log(`Protected Data: ${protectedDataAddress}`);
    console.log(`iApp Address: ${iAppAddress}`);

    // Grant access to the iApp
    const grantedAccess = await dataProtectorCore.grantAccess({
      protectedData: protectedDataAddress,
      authorizedApp: iAppAddress,
      authorizedUser: authorizedUser, // Your wallet address
      numberOfAccess: 10, // Allow 10 access attempts
      pricePerAccess: 0    // Free access
    });

    console.log('Access granted successfully!');
    console.log('Grant Details:');
    console.log('  - Grant Address:', grantedAccess.address);
    console.log('  - Protected Data:', grantedAccess.protectedData);
    console.log('  - Authorized App:', grantedAccess.authorizedApp);
    console.log('  - Authorized User:', grantedAccess.authorizedUser);
    console.log('  - Number of Access:', grantedAccess.numberOfAccess);
    console.log('  - Price per Access:', grantedAccess.pricePerAccess);
    console.log('  - Transaction Hash:', grantedAccess.txHash);

    console.log('Now you can run:');
    console.log(`iapp run ${iAppAddress} --protectedData ${protectedDataAddress}`);

    return grantedAccess;

  } catch (error) {
    console.error('Error granting access:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run the script
grantAccess();