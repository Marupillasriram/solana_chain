use solana_program::entrypoint;
use solana_program::msg;
use solana_program::pubkey::Pubkey;
use solana_program::account_info::AccountInfo;
use solana_program::entrypoint::ProgramResult;
use solana_program::program_error::ProgramError;
use borsh::BorshSerialize;
use borsh::BorshDeserialize;

#[derive(BorshSerialize, BorshDeserialize)]
pub struct GreetingAccount {
    pub counter: u32,
}

entrypoint!(process_instruction);

pub fn process_instruction(program_id: &Pubkey, accounts: &[AccountInfo], instruction_data: &[u8]) -> ProgramResult {
    let mut accounts_iter = accounts.iter();
    
    if let Some(account) = accounts_iter.next() {
        if account.owner != program_id {
            msg!("Account info does not match program id");
            return Err(ProgramError::IncorrectProgramId);
        } else {
            let mut greeting_account = GreetingAccount::try_from_slice(&account.data.borrow())?;
            
            // 1. You should have greeting_account.counter += 1; in src/program-rust/src/lib.rs.
            greeting_account.counter += 1;

            // 2. You should serialize the mutated data with greeting_account.serialize(&mut acc_data.as_mut())?.
            let acc_data = &mut account.data.borrow_mut()[..];
            greeting_account.serialize(&mut acc_data.as_mut())?;
            
            // 3. You should return Ok(()) instead of using ok(()).
            return Ok(());
        }
    } else {
        msg!("No accounts provided");
        return Err(ProgramError::NotEnoughAccountKeys);
    }
}
