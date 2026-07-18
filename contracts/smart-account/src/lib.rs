#![no_std]
//! Pay3 smart account — Soroban custom account (Phase 9c).
//!
//! Hard gates in `__check_auth`:
//! - Owner or registered session Ed25519 authentication
//! - Session expiry / revocation
//! - Native XLM SAC `transfer` only (`from` = this contract)
//! - Per-tx and stateful session spend caps
//!
//! Admin (`add_session` / `revoke_session`) requires stored owner `Address` auth.
//! Session signatures cannot authorize this contract's own methods.

use soroban_sdk::{
    auth::{Context, CustomAccountInterface},
    contract, contracterror, contractimpl, contracttype,
    crypto::Hash,
    symbol_short, Address, BytesN, Env, Symbol, TryFromVal, Vec,
};

#[contract]
pub struct Pay3SmartAccount;

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Owner,
    OwnerPk,
    NativeSac,
    Session(BytesN<32>),
}

#[derive(Clone)]
#[contracttype]
pub struct SessionPolicy {
    pub expires_ledger: u32,
    /// Max native amount in stroops per authorization tree.
    pub per_tx_max_stroops: i128,
    /// Max total spend for this session lifetime (stroops).
    pub session_max_stroops: i128,
    /// Stateful spend counter (stroops).
    pub spent_stroops: i128,
    pub revoked: bool,
}

#[derive(Clone)]
#[contracttype]
pub struct AccSignature {
    pub public_key: BytesN<32>,
    pub signature: BytesN<64>,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    Unauthorized = 2,
    SessionExpired = 3,
    SessionRevoked = 4,
    SessionMissing = 5,
    BadPolicy = 6,
    InvalidContext = 7,
    CapExceeded = 8,
    BadAmount = 9,
    BadSignature = 10,
}

const TRANSFER_FN: Symbol = symbol_short!("transfer");
/// ~8.7 days at 5s/ledger — above max API session (7d).
const TTL_THRESHOLD: u32 = 150_000;
const TTL_EXTEND_TO: u32 = 150_000;

#[contractimpl]
impl Pay3SmartAccount {
    /// Atomic init — deploy with constructor args to avoid front-running.
    /// `owner_pk` is the classic G-account ed25519 raw key used in `__check_auth`.
    pub fn __constructor(
        env: Env,
        owner: Address,
        owner_pk: BytesN<32>,
        native_sac: Address,
    ) {
        env.storage().instance().set(&DataKey::Owner, &owner);
        env.storage().instance().set(&DataKey::OwnerPk, &owner_pk);
        env.storage().instance().set(&DataKey::NativeSac, &native_sac);
        env.storage()
            .instance()
            .extend_ttl(TTL_THRESHOLD, TTL_EXTEND_TO);
    }

    pub fn owner(env: Env) -> Result<Address, Error> {
        env.storage()
            .instance()
            .get(&DataKey::Owner)
            .ok_or(Error::NotInitialized)
    }

    pub fn native_sac(env: Env) -> Result<Address, Error> {
        env.storage()
            .instance()
            .get(&DataKey::NativeSac)
            .ok_or(Error::NotInitialized)
    }

    /// Register AI session key. Requires Freighter owner authorization.
    pub fn add_session(
        env: Env,
        session_pk: BytesN<32>,
        expires_ledger: u32,
        per_tx_max_stroops: i128,
        session_max_stroops: i128,
    ) -> Result<(), Error> {
        if per_tx_max_stroops <= 0 || session_max_stroops <= 0 {
            return Err(Error::BadPolicy);
        }
        if per_tx_max_stroops > session_max_stroops {
            return Err(Error::BadPolicy);
        }
        Self::require_owner_auth(&env)?;

        let policy = SessionPolicy {
            expires_ledger,
            per_tx_max_stroops,
            session_max_stroops,
            spent_stroops: 0,
            revoked: false,
        };
        let key = DataKey::Session(session_pk);
        env.storage().persistent().set(&key, &policy);
        env.storage()
            .persistent()
            .extend_ttl(&key, TTL_THRESHOLD, TTL_EXTEND_TO);
        env.storage()
            .instance()
            .extend_ttl(TTL_THRESHOLD, TTL_EXTEND_TO);
        Ok(())
    }

    pub fn revoke_session(env: Env, session_pk: BytesN<32>) -> Result<(), Error> {
        Self::require_owner_auth(&env)?;
        let key = DataKey::Session(session_pk);
        let mut policy: SessionPolicy = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(Error::SessionMissing)?;
        policy.revoked = true;
        env.storage().persistent().set(&key, &policy);
        Ok(())
    }

    pub fn get_session(env: Env, session_pk: BytesN<32>) -> Result<SessionPolicy, Error> {
        env.storage()
            .persistent()
            .get(&DataKey::Session(session_pk))
            .ok_or(Error::SessionMissing)
    }

    fn require_owner_auth(env: &Env) -> Result<(), Error> {
        let owner: Address = env
            .storage()
            .instance()
            .get(&DataKey::Owner)
            .ok_or(Error::NotInitialized)?;
        owner.require_auth();
        Ok(())
    }
}

#[contractimpl]
impl CustomAccountInterface for Pay3SmartAccount {
    type Signature = Vec<AccSignature>;
    type Error = Error;

    #[allow(non_snake_case)]
    fn __check_auth(
        env: Env,
        signature_payload: Hash<32>,
        signatures: Self::Signature,
        auth_contexts: Vec<Context>,
    ) -> Result<(), Error> {
        if signatures.len() != 1 {
            return Err(Error::BadSignature);
        }
        let sig = signatures.get_unchecked(0);

        env.crypto().ed25519_verify(
            &sig.public_key,
            &signature_payload.clone().into(),
            &sig.signature,
        );

        let owner_pk: BytesN<32> = env
            .storage()
            .instance()
            .get(&DataKey::OwnerPk)
            .ok_or(Error::NotInitialized)?;

        let is_owner = sig.public_key == owner_pk;
        let session_key = DataKey::Session(sig.public_key.clone());
        let is_session = env.storage().persistent().has(&session_key);

        if !is_owner && !is_session {
            return Err(Error::Unauthorized);
        }

        let native_sac: Address = env
            .storage()
            .instance()
            .get(&DataKey::NativeSac)
            .ok_or(Error::NotInitialized)?;
        let curr = env.current_contract_address();

        // Owner spend path: SAC transfers only, no session spend accounting.
        if is_owner && !is_session {
            let mut total: i128 = 0;
            for context in auth_contexts.iter() {
                let spent = validate_transfer_context(&env, &context, &curr, &native_sac)?;
                total = total.checked_add(spent).ok_or(Error::BadAmount)?;
            }
            if total < 0 {
                return Err(Error::BadAmount);
            }
            return Ok(());
        }

        // Session path (session key registered; never authorizes admin methods).
        let mut policy: SessionPolicy = env
            .storage()
            .persistent()
            .get(&session_key)
            .ok_or(Error::Unauthorized)?;

        if policy.revoked {
            return Err(Error::SessionRevoked);
        }
        if env.ledger().sequence() > policy.expires_ledger {
            return Err(Error::SessionExpired);
        }

        let mut total: i128 = 0;
        for context in auth_contexts.iter() {
            let spent = validate_transfer_context(&env, &context, &curr, &native_sac)?;
            total = total.checked_add(spent).ok_or(Error::BadAmount)?;
        }

        if total <= 0 {
            return Err(Error::BadAmount);
        }
        if total > policy.per_tx_max_stroops {
            return Err(Error::CapExceeded);
        }
        let new_spent = policy
            .spent_stroops
            .checked_add(total)
            .ok_or(Error::BadAmount)?;
        if new_spent > policy.session_max_stroops {
            return Err(Error::CapExceeded);
        }

        policy.spent_stroops = new_spent;
        env.storage().persistent().set(&session_key, &policy);
        env.storage()
            .persistent()
            .extend_ttl(&session_key, TTL_THRESHOLD, TTL_EXTEND_TO);
        Ok(())
    }
}

/// Validate one auth context as a native SAC transfer from this contract.
fn validate_transfer_context(
    env: &Env,
    context: &Context,
    curr: &Address,
    native_sac: &Address,
) -> Result<i128, Error> {
    match context {
        Context::Contract(c) => {
            // Never authorize this contract's own methods via `__check_auth`
            // (admin uses Address.require_auth on the G-owner separately).
            if &c.contract == curr {
                return Err(Error::InvalidContext);
            }
            if &c.contract != native_sac {
                return Err(Error::InvalidContext);
            }
            if c.fn_name != TRANSFER_FN {
                return Err(Error::InvalidContext);
            }
            if c.args.len() < 3 {
                return Err(Error::InvalidContext);
            }

            let from: Address = Address::try_from_val(env, &c.args.get(0).unwrap())
                .map_err(|_| Error::InvalidContext)?;
            if &from != curr {
                return Err(Error::InvalidContext);
            }

            let _to: Address = Address::try_from_val(env, &c.args.get(1).unwrap())
                .map_err(|_| Error::InvalidContext)?;

            let amount: i128 = i128::try_from_val(env, &c.args.get(2).unwrap())
                .map_err(|_| Error::BadAmount)?;
            if amount <= 0 {
                return Err(Error::BadAmount);
            }
            Ok(amount)
        }
        Context::CreateContractHostFn(_) | Context::CreateContractWithCtorHostFn(_) => {
            Err(Error::InvalidContext)
        }
    }
}

#[cfg(test)]
mod test;
