#![no_std]
//! Pay3 smart account — Soroban custom account (Phase 9b).
//!
//! Pattern: Stellar simple_account + session keys (docs/TECHNICAL_VALIDATION.md).
//! Build: docs/SOROBAN_SETUP.md → `stellar contract build`

use soroban_sdk::{
    auth::Context, contract, contracterror, contractimpl, contracttype, BytesN, Env, Vec,
};

#[contract]
struct Pay3SmartAccount;

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Owner,
    Session(BytesN<32>),
}

#[derive(Clone)]
#[contracttype]
pub struct SessionPolicy {
    pub expires_ledger: u32,
    /// Max native amount in stroops per auth (1 XLM = 10_000_000).
    pub per_tx_max_stroops: i128,
    pub revoked: bool,
}

/// Signature envelope so `__check_auth` knows which key signed.
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
    AlreadyInitialized = 2,
    Unauthorized = 3,
    SessionExpired = 4,
    SessionRevoked = 5,
    SessionMissing = 6,
    BadPolicy = 7,
}

#[contractimpl]
impl Pay3SmartAccount {
    pub fn init(env: Env, owner_pk: BytesN<32>) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Owner) {
            return Err(Error::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Owner, &owner_pk);
        env.storage().instance().extend_ttl(100_000, 100_000);
        Ok(())
    }

    pub fn owner(env: Env) -> Result<BytesN<32>, Error> {
        env.storage()
            .instance()
            .get(&DataKey::Owner)
            .ok_or(Error::NotInitialized)
    }

    /// Register AI session key. Invoker must be the contract address (owner auth).
    pub fn add_session(
        env: Env,
        session_pk: BytesN<32>,
        expires_ledger: u32,
        per_tx_max_stroops: i128,
    ) -> Result<(), Error> {
        if per_tx_max_stroops <= 0 {
            return Err(Error::BadPolicy);
        }
        // Require this contract account to authorize admin changes.
        env.current_contract_address().require_auth();

        let policy = SessionPolicy {
            expires_ledger,
            per_tx_max_stroops,
            revoked: false,
        };
        let key = DataKey::Session(session_pk.clone());
        env.storage().persistent().set(&key, &policy);
        env.storage()
            .persistent()
            .extend_ttl(&key, 100_000, 100_000);
        Ok(())
    }

    pub fn revoke_session(env: Env, session_pk: BytesN<32>) -> Result<(), Error> {
        env.current_contract_address().require_auth();
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

    /// Host entry point for `require_auth` on this contract address.
    #[allow(non_snake_case)]
    pub fn __check_auth(
        env: Env,
        signature_payload: BytesN<32>,
        sig: AccSignature,
        _auth_contexts: Vec<Context>,
    ) -> Result<(), Error> {
        let owner: BytesN<32> = Self::owner(env.clone())?;

        // Owner path (Freighter / admin).
        if sig.public_key == owner {
            env.crypto().ed25519_verify(
                &sig.public_key,
                &signature_payload.clone().into(),
                &sig.signature,
            );
            return Ok(());
        }

        // Session path (AI backend key).
        let policy: SessionPolicy = env
            .storage()
            .persistent()
            .get(&DataKey::Session(sig.public_key.clone()))
            .ok_or(Error::Unauthorized)?;

        if policy.revoked {
            return Err(Error::SessionRevoked);
        }
        if env.ledger().sequence() > policy.expires_ledger {
            return Err(Error::SessionExpired);
        }

        env.crypto().ed25519_verify(
            &sig.public_key,
            &signature_payload.clone().into(),
            &sig.signature,
        );

        // ponytail: decode SAC/native transfer amounts from Context in a follow-up;
        // policy.per_tx_max_stroops is stored and readable off-chain for now.
        let _ = policy.per_tx_max_stroops;
        let _ = _auth_contexts;
        Ok(())
    }
}
