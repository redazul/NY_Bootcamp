use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    program_error::ProgramError,
    pubkey::Pubkey,
    rent::Rent,
    system_instruction,
    sysvar::Sysvar,
    msg,
};

use std::convert::TryInto;
use sha2::{Digest, Sha256};

entrypoint!(process_instruction);

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    if instruction_data.len() < 3 {
        return Err(ProgramError::InvalidInstructionData);
    }

    let instruction_type = instruction_data[0];
    let offset = instruction_data[1] as usize;

    if offset > instruction_data.len() - 2 {
        return Err(ProgramError::InvalidInstructionData);
    }

    let seed = &instruction_data[2..offset + 2];

    match instruction_type {
        0 => create_pda_instruction(program_id, accounts, seed),
        1 => crank_pda_instruction(program_id, accounts, offset, seed),
        _ => Err(ProgramError::InvalidInstructionData),
    }
}

fn create_pda_instruction(program_id: &Pubkey, accounts: &[AccountInfo], seed: &[u8]) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    // Getting required accounts
    let funding_account = next_account_info(accounts_iter)?;
    let pda_account = next_account_info(accounts_iter)?;
    let system_program = next_account_info(accounts_iter)?;

    // Check if the PDA account already exists
    if pda_account.lamports() > 0 {
        msg!("PDA account already exists");
        return Ok(());
    }

    // Assessing required lamports and creating transaction instruction
    let rent = Rent::get()?;
    let lamports_required = rent.minimum_balance(pda_account.data_len());
    let create_pda_account_ix = system_instruction::create_account(
        &funding_account.key,
        &pda_account.key,
        lamports_required,
        pda_account.data_len().try_into().unwrap(),
        &program_id,
    );
    // Invoking the instruction but with PDAs as additional signer
    solana_program::program::invoke_signed(
        &create_pda_account_ix,
        &[
            funding_account.clone(),
            pda_account.clone(),
            system_program.clone(),
        ],
        &[&[seed]],
    )?;

    Ok(())
}

fn crank_pda_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    offset: usize,
    seed: &[u8],
) -> ProgramResult {

    let accounts_iter = &mut accounts.iter();
    // Getting required accounts
    let funding_account = next_account_info(accounts_iter)?;
    let pda_account = next_account_info(accounts_iter)?;
    let system_program = next_account_info(accounts_iter)?;

    //sha-256 this
    let pub1 = next_account_info(accounts_iter)?;
    let pub2 = next_account_info(accounts_iter)?;
    let pub3 = next_account_info(accounts_iter)?;

    // Concatenate the account keys for hashing
    let mut data = vec![];
    data.extend_from_slice(&pub1.key.to_bytes());
    data.extend_from_slice(&pub2.key.to_bytes());
    data.extend_from_slice(&pub3.key.to_bytes());

    // Calculate the SHA-256 hash
    let hash = Sha256::digest(&data);

    // Assuming `offset` specifies the number of bytes (or bits) to include in the result
    let result_bytes = hash[..offset].to_vec();

    // Log the hash value
    msg!("Program Seed {:?}", result_bytes);

    // Combine the seed, result bytes, and program ID to create a PDA
    let pda = Pubkey::find_program_address(&[&result_bytes], program_id);

    // MSG PDA SEED
    msg!("Passed seed: {:?}", seed);

    // Log the PDA
    msg!("Program-Derived Address (PDA): {:?}", pda);

    // Log the PDA
    msg!("Passed in (PDA): {:?}", pda_account);

    //TODO
    //Validate that gen PDA and Passed PDA are exact 

    //Send SOL to child nodes. <-- this process happens on every crank untill received by user pubkey.

    Ok(())
}
