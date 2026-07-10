#![no_std]
//! Pay3 Soroban smart account — on-chain session-key authorization and policy enforcement.

use soroban_sdk::{contract, contractimpl, Env};

#[contract]
pub struct SmartAccount;

#[contractimpl]
impl SmartAccount {
    pub fn version(_env: Env) -> u32 {
        1
    }
}
