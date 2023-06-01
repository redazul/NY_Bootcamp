"use client"; // This is a client component 👈🏽

import React from 'react';
import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  Keypair,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from '@solana/web3.js';
import { mnemonicToSeedSync } from 'bip39';
import { createHash } from 'crypto-browserify';
import bs58 from 'bs58';

class Page extends React.Component {
  componentDidMount() {
    this.callProgram();
  }

  async callProgram() {
    // Connect to Solana devnet
    const connection = new Connection('https://api.devnet.solana.com');

    // Use a specific program id
    const programId = new PublicKey('5bzzMcr3sc8bMUfQPP6WuwYmJn6JCU2TuG4Hf4seFodd');

    // Provided mnemonic
    const feePayerMnemonic =
      'pill tomorrow foster begin walnut borrow virtual kick shift mutual shoe scatter';

    // Generate seed from mnemonic
    const seed = mnemonicToSeedSync(feePayerMnemonic).slice(0, 32);

    // Generate keypair for fee payer from seed
    const feePayerKeypair = Keypair.fromSeed(new Uint8Array(seed));

    // Fetch recent blockhash
    const { blockhash } = await connection.getRecentBlockhash();

    // Convert base58 pubkeys to buffer arrays
    const pubkey1 = bs58.decode('9JeizzjvGCk3fyPXPCPYJass2JhfhKHXVAv9NDDxSDTj');
    const pubkey2 = bs58.decode('GKCGKYHPYkcQHEwNtK2SXveup5kGSL74TPz18gnmS2cJ');
    const pubkey3 = bs58.decode('Fy93VrzyyfBCx5yZbhgujTvJpMoQuKLCUw38biPuZag');

    // Concatenate the buffer arrays
    const concatenatedArray = Uint8Array.from([
      ...pubkey1, //project
      ...pubkey2, //pub1
      ...pubkey3, //pub2
    ]);

    // Hash256 the concatenated array
    const hash = createHash('sha256').update(concatenatedArray).digest();

    console.log(hash)
    console.log(Buffer.from(hash))
    

    let pda;
    let my_bump = 32;
    while (my_bump > 0) {
      try {
        // Create a program-derived address (PDA) from the hash
        pda = PublicKey.findProgramAddressSync([hash.slice(0, my_bump)], programId)[0];
        console.log(pda.toBase58())
        break; // Exit the loop if the address is created successfully
      } catch (error) {
        // Handle the error
        console.log("bumping down")
        console.error('Error creating program-derived address:', error);
        my_bump--; // Reduce the bump value by 1
      }
    }
    
    if (my_bump === 0) {
      console.error('Failed to create program-derived address');
      return; // or perform any other error handling logic as needed
    }

    // Create a transaction
    const transaction = new Transaction({
      feePayer: feePayerKeypair.publicKey,
      recentBlockhash: blockhash,
    });

    // Assuming these are the provided public keys
    const publicKeys = [
      { pubkey: feePayerKeypair.publicKey, isSigner: true, isWritable: true }, // Fee payer
      { pubkey: pda, isSigner: false, isWritable: true }, // PDA
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },// Rent Sysvar
      { pubkey: new PublicKey('9JeizzjvGCk3fyPXPCPYJass2JhfhKHXVAv9NDDxSDTj'), isSigner: false, isWritable: false }, // Fee payer
      { pubkey: new PublicKey('GKCGKYHPYkcQHEwNtK2SXveup5kGSL74TPz18gnmS2cJ'), isSigner: false, isWritable: false }, // Fee payer
      { pubkey: new PublicKey('Fy93VrzyyfBCx5yZbhgujTvJpMoQuKLCUw38biPuZag'), isSigner: false, isWritable: false }, // Fee payer
    ];

    // Create an instruction with the 32-byte seed
    const instruction = new TransactionInstruction({
      keys: publicKeys,
      programId,
      data: Buffer.from([1, my_bump, ...hash.slice(0, my_bump)]), // Use the hash as the seed and my_bump as the offset
    });

    // Add the instruction to the transaction
    transaction.add(instruction);

    // Sign the transaction
    transaction.sign(feePayerKeypair);

    // Send the transaction
    const transactionId = await connection.sendTransaction(transaction, [feePayerKeypair]);

    // Confirm transaction
    const confirmed = await connection.confirmTransaction(transactionId);
    console.log('Transaction confirmed:', confirmed);

    // Log the transaction id (signature)
    console.log('Transaction signature:', transactionId);

    // Open the transaction in Solana explorer in a new tab
    window.open(`https://explorer.solana.com/tx/${transactionId}?cluster=devnet`, '_blank');
  }

  render() {
    return <div>Hello</div>;
  }
}

export default Page;
