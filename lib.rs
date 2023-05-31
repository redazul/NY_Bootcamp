use solana_program::{
    account_info::AccountInfo, entrypoint, entrypoint::ProgramResult, msg, pubkey::Pubkey,
};

entrypoint!(process_instruction);

fn process_instruction(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    data: &[u8],
) -> ProgramResult {
    // Log the message "Hello, World!"
    //msg!("Hello, World!");

    // Get the account to which data should be added
    let account_info = &accounts[0];
    
    // Check if the account is writable
    if !account_info.is_writable {
        return Err(solana_program::program_error::ProgramError::InvalidArgument.into());
    }

    // Add the provided data to the account
    let dest_data = &mut account_info.data.borrow_mut();
    if dest_data.len() < data.len() {
        return Err(solana_program::program_error::ProgramError::InvalidArgument.into());
    }
    dest_data[..data.len()].copy_from_slice(data);

    Ok(())
}
