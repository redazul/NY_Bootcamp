import React, { Component } from 'react';
import { Connection, PublicKey, Keypair, Transaction, TransactionInstruction, SystemProgram } from "@solana/web3.js";
import { mnemonicToSeedSync } from 'bip39';
import { Buffer } from 'buffer';

window.Buffer = window.Buffer || require("buffer").Buffer;

class App extends Component {
  componentDidMount() {
    this.createAccountAndAddData();
  }

  createAccountAndAddData = async () => {
    // Connect to the Solana cluster
    const connection = new Connection('https://api.devnet.solana.com');

    // Provided mnemonic
    const feePayerMnemonic =
      'pill tomorrow foster begin walnut borrow virtual kick shift mutual shoe scatter';

    // Generate seed from mnemonic
    const seed = mnemonicToSeedSync(feePayerMnemonic).slice(0, 32);

    // Generate keypair from seed
    const feePayerKeypair = Keypair.fromSeed(new Uint8Array(seed));

    console.log('Generated public key:', feePayerKeypair.publicKey.toBase58());

    // Generate a new keypair for the account
    const accountKeypair = Keypair.generate();

    // Define the custom program ID
    const programId = new PublicKey('3NaksepYZH4N8caWceRUQHe4f95uHNwviNgCVBDvFjc7');

    // Define the three public keys
    const publicKey1 = new PublicKey('9JeizzjvGCk3fyPXPCPYJass2JhfhKHXVAv9NDDxSDTj');
    const publicKey2 = new PublicKey('GKCGKYHPYkcQHEwNtK2SXveup5kGSL74TPz18gnmS2cJ');
    const publicKey3 = new PublicKey('Fy93VrzyyfBCx5yZbhgujTvJpMoQuKLCUw38biPuZag');

    // Convert the public keys to buffer
    const publicKeysBuffer = Buffer.concat([
      publicKey1.toBuffer(),
      publicKey2.toBuffer(),
      publicKey3.toBuffer(),
    ]);

    // Calculate the rent exemption
    const rentExemption = await connection.getMinimumBalanceForRentExemption(publicKeysBuffer.length);

    // Create a new account instruction
    const createAccountInstruction = SystemProgram.createAccount({
      fromPubkey: feePayerKeypair.publicKey,
      newAccountPubkey: accountKeypair.publicKey,
      lamports: rentExemption + publicKeysBuffer.length,
      space: publicKeysBuffer.length,
      programId,
    });

    // Add data instruction to the new account
    const addDataInstruction = new TransactionInstruction({
      keys: [{ pubkey: accountKeypair.publicKey, isSigner: false, isWritable: true }],
      programId,
      data: publicKeysBuffer,
    });

    // Build the transaction containing both instructions
    const transaction = new Transaction().add(createAccountInstruction, addDataInstruction);

    // Get the recent blockhash
    const { blockhash } = await connection.getRecentBlockhash();

    // Set the recent blockhash
    transaction.recentBlockhash = blockhash;

    // Sign the transaction with the fee payer and account keypairs
    transaction.sign(feePayerKeypair, accountKeypair);

    console.log("Transaction Sent");

    // Send the transaction to the network
    const signature = await connection.sendTransaction(transaction, [
      feePayerKeypair,
      accountKeypair,
    ]);

    console.log('Account creation transaction sent');
    console.log('Public Key:', accountKeypair.publicKey.toString());

    // Open Solana Explorer in a new tab
    const solanaExplorerUrl = `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
    window.open(solanaExplorerUrl, '_blank');
  };

  render() {
    return <div>Creating account and adding data...</div>;
  }
}

export default App;
