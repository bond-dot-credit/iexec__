import fs from 'node:fs/promises';
import { IExecDataProtectorDeserializer } from '@iexec/dataprotector-deserializer';

const main = async () => {
  const { IEXEC_OUT, IEXEC_APP_DEVELOPER_SECRET, IEXEC_REQUESTER_SECRET_1 } = process.env;

  let computedJsonObj = {};

  try {
    console.log('Starting scoring algorithm...');

    let inputA = null;
    let result = null;

    // Try to get encrypted integer A from protected data using DataProtector
    try {
      const deserializer = new IExecDataProtectorDeserializer();
      
      // Get the MEDPRIVATE key from app developer secret
      const medPrivateKey = IEXEC_APP_DEVELOPER_SECRET;
      if (!medPrivateKey) {
        throw new Error('MEDPRIVATE key not found in app developer secret');
      }
      console.log('Found MEDPRIVATE key in app secret');

      console.log('Available deserializer methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(deserializer)));
      
      // Try different approaches to get the protected data
      let encryptedA = null;
      
      try {
        console.log('Attempting to get integerA as f64...');
        encryptedA = await deserializer.getValue('integerA', 'f64');
        console.log('✅ Successfully got integerA as f64:', encryptedA);
      } catch (f64Error) {
        console.log('❌ f64 failed:', f64Error.message);
        
        try {
          console.log('Attempting to get integerA as number...');
          encryptedA = await deserializer.getValue('integerA', 'number');
          console.log('✅ Successfully got integerA as number:', encryptedA);
        } catch (numberError) {
          console.log('❌ number failed:', numberError.message);
          
          try {
            console.log('Attempting to get integerA as string...');
            encryptedA = await deserializer.getValue('integerA', 'string');
            console.log('✅ Got integerA as string:', encryptedA);
            encryptedA = parseFloat(encryptedA);
          } catch (stringError) {
            console.log('❌ string failed:', stringError.message);
            throw new Error(`Could not retrieve integerA with any type: f64(${f64Error.message}), number(${numberError.message}), string(${stringError.message})`);
          }
        }
      }
      
      if (encryptedA !== null && !isNaN(encryptedA)) {
        console.log('Successfully decrypted integer A from protected data');
        inputA = Math.round(encryptedA); // Convert to integer
      } else {
        throw new Error('Retrieved protected data is not a valid number');
      }

    } catch (e) {
      console.log('Could not access protected data, trying requester secret:', e.message);
      
      // Fallback: try to get A from requester secret
      if (IEXEC_REQUESTER_SECRET_1) {
        inputA = parseInt(IEXEC_REQUESTER_SECRET_1);
        console.log('Using integer A from requester secret');
      } else {
        // Final fallback: use command line argument
        const args = process.argv.slice(2);
        if (args.length > 0) {
          inputA = parseInt(args[0]);
          console.log('Using integer A from command line argument');
        } else {
          throw new Error('No input A found in protected data, requester secret, or command line');
        }
      }
    }

    // Validate input
    if (inputA === null || isNaN(inputA)) {
      throw new Error('Invalid input A: must be a valid integer');
    }

    console.log(`Input A: ${inputA}`);

    // TEE SCORING LOGIC: result = A * 2
    result = inputA * 2;
    console.log(`Scoring result: ${inputA} * 2 = ${result}`);

    // Create detailed result object
    const scoringResult = {
      inputA: inputA,
      scoringFormula: 'A * 2',
      result: result,
      timestamp: new Date().toISOString(),
      confidentialComputing: true,
      teeProtected: true
    };

    // Write detailed result to JSON file
    await fs.writeFile(
      `${IEXEC_OUT}/scoring_result.json`,
      JSON.stringify(scoringResult, null, 2)
    );

    // Write simple result for easy access
    await fs.writeFile(`${IEXEC_OUT}/result.txt`, result.toString());

    console.log('Scoring computation completed successfully');

    // Build the "computed.json" object
    computedJsonObj = {
      'deterministic-output-path': `${IEXEC_OUT}/scoring_result.json`,
    };

  } catch (e) {
    console.log('Error in scoring algorithm:', e.message);
    console.log('Stack trace:', e.stack);

    // Create error result
    const errorResult = {
      error: e.message,
      timestamp: new Date().toISOString(),
      success: false
    };

    await fs.writeFile(
      `${IEXEC_OUT}/error_result.json`,
      JSON.stringify(errorResult, null, 2)
    );

    // Build the "computed.json" object with error
    computedJsonObj = {
      'deterministic-output-path': `${IEXEC_OUT}/error_result.json`,
      'error-message': e.message,
    };
  } finally {
    // Save the "computed.json" file
    await fs.writeFile(
      `${IEXEC_OUT}/computed.json`,
      JSON.stringify(computedJsonObj, null, 2)
    );
    
    console.log('Computation completed, computed.json saved');
  }
};

main();
