#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    token::{StellarAssetClient, TokenClient},
    Address, Env,
};

fn setup() -> (Env, Address, Address, Address, Address, SmartAccountClient<'static>) {
    let env = Env::default();
    env.mock_all_auths();

    let owner = Address::generate(&env);
    let session = Address::generate(&env);
    let recipient = Address::generate(&env);

    let token_admin = Address::generate(&env);
    let sac = env.register_stellar_asset_contract_v2(token_admin.clone());
    let token_id = sac.address();
    let token_admin_client = StellarAssetClient::new(&env, &token_id);
    token_admin_client.mint(&owner, &1_000_000_0000);

    let contract_id = env.register(SmartAccount, ());
    let client = SmartAccountClient::new(&env, &contract_id);
    client.initialize(&owner, &token_id).unwrap();

    (env, owner, session, recipient, token_id, client)
}

#[test]
fn transfer_within_limits_succeeds() {
    let (env, owner, session, recipient, token_id, client) = setup();
    let token = TokenClient::new(&env, &token_id);

    client.deposit(&owner, &500_000_0000).unwrap();
    assert_eq!(client.get_balance().unwrap(), 500_000_0000);

    let expires = env.ledger().timestamp() + 86_400;
    client
        .add_session(&session, &expires, &100_000_0000, &300_000_0000)
        .unwrap();

    client
        .transfer(&session, &recipient, &50_000_0000)
        .unwrap();

    assert_eq!(token.balance(&recipient), 50_000_0000);
    assert_eq!(client.get_balance().unwrap(), 450_000_0000);

    let s = client.get_session(&session).unwrap();
    assert_eq!(s.daily_spent, 50_000_0000);
}

#[test]
fn per_tx_limit_rejects() {
    let (env, owner, session, recipient, _token_id, client) = setup();
    client.deposit(&owner, &500_000_0000).unwrap();
    let expires = env.ledger().timestamp() + 86_400;
    client
        .add_session(&session, &expires, &10_000_0000, &300_000_0000)
        .unwrap();

    let err = client
        .transfer(&session, &recipient, &20_000_0000)
        .unwrap_err();
    assert_eq!(err, Error::PerTxLimitExceeded);
}

#[test]
fn expired_session_rejects() {
    let (env, owner, session, recipient, _token_id, client) = setup();
    client.deposit(&owner, &500_000_0000).unwrap();
    let expires = env.ledger().timestamp() + 10;
    client
        .add_session(&session, &expires, &100_000_0000, &300_000_0000)
        .unwrap();

    env.ledger().set_timestamp(expires + 1);

    let err = client
        .transfer(&session, &recipient, &5_000_0000)
        .unwrap_err();
    assert_eq!(err, Error::SessionExpired);
}

#[test]
fn revoked_session_rejects() {
    let (env, owner, session, recipient, _token_id, client) = setup();
    client.deposit(&owner, &500_000_0000).unwrap();
    let expires = env.ledger().timestamp() + 86_400;
    client
        .add_session(&session, &expires, &100_000_0000, &300_000_0000)
        .unwrap();
    client.revoke_session(&session).unwrap();

    let err = client
        .transfer(&session, &recipient, &5_000_0000)
        .unwrap_err();
    assert_eq!(err, Error::SessionRevoked);
}

#[test]
fn daily_limit_rejects() {
    let (env, owner, session, recipient, _token_id, client) = setup();
    client.deposit(&owner, &500_000_0000).unwrap();
    let expires = env.ledger().timestamp() + 86_400;
    client
        .add_session(&session, &expires, &100_000_0000, &80_000_0000)
        .unwrap();

    client
        .transfer(&session, &recipient, &50_000_0000)
        .unwrap();
    let err = client
        .transfer(&session, &recipient, &40_000_0000)
        .unwrap_err();
    assert_eq!(err, Error::DailyLimitExceeded);
}
