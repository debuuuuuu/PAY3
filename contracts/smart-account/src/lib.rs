#![no_std]
//! Pay3 Soroban smart-account vault — session-authorized USDC transfers.
//!
//! Owner funds the vault; AI session G-addresses authorize limited transfers
//! via `require_auth` with on-chain expiry / per-tx / daily caps.

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, token, Address, Env, Symbol,
};

const DAY_LEDGERS: u32 = 17_280; // ~24h at 5s ledgers

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    SessionNotFound = 4,
    SessionExpired = 5,
    SessionRevoked = 6,
    PerTxLimitExceeded = 7,
    DailyLimitExceeded = 8,
    InvalidAmount = 9,
}

#[contracttype]
#[derive(Clone)]
pub struct Session {
    pub expires_at: u64,
    pub per_tx_max: i128,
    pub daily_max: i128,
    pub daily_spent: i128,
    pub day_start: u64,
    pub revoked: bool,
}

#[contracttype]
#[derive(Clone)]
enum DataKey {
    Owner,
    Token,
    Session(Address),
}

#[contract]
pub struct SmartAccount;

#[contractimpl]
impl SmartAccount {
    pub fn version(_env: Env) -> u32 {
        1
    }

    pub fn initialize(env: Env, owner: Address, usdc_token: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Owner) {
            return Err(Error::AlreadyInitialized);
        }
        owner.require_auth();
        env.storage().instance().set(&DataKey::Owner, &owner);
        env.storage().instance().set(&DataKey::Token, &usdc_token);
        env.storage()
            .instance()
            .extend_ttl(DAY_LEDGERS, DAY_LEDGERS);
        Ok(())
    }

    pub fn deposit(env: Env, from: Address, amount: i128) -> Result<(), Error> {
        Self::require_init(&env)?;
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        from.require_auth();
        let token = Self::token_client(&env);
        token.transfer(&from, &env.current_contract_address(), &amount);
        Ok(())
    }

    pub fn withdraw(env: Env, to: Address, amount: i128) -> Result<(), Error> {
        let owner = Self::require_init(&env)?;
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        owner.require_auth();
        let token = Self::token_client(&env);
        token.transfer(&env.current_contract_address(), &to, &amount);
        Ok(())
    }

    pub fn add_session(
        env: Env,
        session: Address,
        expires_at: u64,
        per_tx_max: i128,
        daily_max: i128,
    ) -> Result<(), Error> {
        let owner = Self::require_init(&env)?;
        owner.require_auth();
        if per_tx_max <= 0 || daily_max <= 0 {
            return Err(Error::InvalidAmount);
        }
        let now = env.ledger().timestamp();
        let record = Session {
            expires_at,
            per_tx_max,
            daily_max,
            daily_spent: 0,
            day_start: now,
            revoked: false,
        };
        env.storage()
            .persistent()
            .set(&DataKey::Session(session.clone()), &record);
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::Session(session), DAY_LEDGERS, DAY_LEDGERS);
        Ok(())
    }

    pub fn revoke_session(env: Env, session: Address) -> Result<(), Error> {
        let owner = Self::require_init(&env)?;
        owner.require_auth();
        let key = DataKey::Session(session);
        let mut record: Session = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(Error::SessionNotFound)?;
        record.revoked = true;
        env.storage().persistent().set(&key, &record);
        Ok(())
    }

    pub fn transfer(
        env: Env,
        session: Address,
        to: Address,
        amount: i128,
    ) -> Result<(), Error> {
        Self::require_init(&env)?;
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        session.require_auth();

        let key = DataKey::Session(session.clone());
        let mut record: Session = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(Error::SessionNotFound)?;

        if record.revoked {
            return Err(Error::SessionRevoked);
        }
        let now = env.ledger().timestamp();
        if now > record.expires_at {
            return Err(Error::SessionExpired);
        }
        if amount > record.per_tx_max {
            return Err(Error::PerTxLimitExceeded);
        }

        // Reset daily window every 86400 seconds.
        if now.saturating_sub(record.day_start) >= 86_400 {
            record.day_start = now;
            record.daily_spent = 0;
        }
        if record.daily_spent.saturating_add(amount) > record.daily_max {
            return Err(Error::DailyLimitExceeded);
        }

        record.daily_spent = record.daily_spent.saturating_add(amount);
        env.storage().persistent().set(&key, &record);

        let token = Self::token_client(&env);
        token.transfer(&env.current_contract_address(), &to, &amount);

        env.events().publish(
            (Symbol::new(&env, "transfer"), session),
            (to, amount),
        );
        Ok(())
    }

    pub fn get_balance(env: Env) -> Result<i128, Error> {
        Self::require_init(&env)?;
        let token = Self::token_client(&env);
        Ok(token.balance(&env.current_contract_address()))
    }

    pub fn get_session(env: Env, session: Address) -> Result<Session, Error> {
        Self::require_init(&env)?;
        env.storage()
            .persistent()
            .get(&DataKey::Session(session))
            .ok_or(Error::SessionNotFound)
    }

    pub fn get_owner(env: Env) -> Result<Address, Error> {
        Self::require_init(&env)
    }

    fn require_init(env: &Env) -> Result<Address, Error> {
        env.storage()
            .instance()
            .get(&DataKey::Owner)
            .ok_or(Error::NotInitialized)
    }

    fn token_client(env: &Env) -> token::Client<'_> {
        let token: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        token::Client::new(env, &token)
    }
}

#[cfg(test)]
mod test;
