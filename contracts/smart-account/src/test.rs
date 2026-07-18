#![cfg(test)]
extern crate std;

use ed25519_dalek::{Keypair, Signer};
use rand::thread_rng;
use soroban_sdk::{
    auth::{Context, ContractContext},
    symbol_short,
    testutils::{Address as _, BytesN as _, Ledger, LedgerInfo},
    vec, Address, BytesN, Env, IntoVal, InvokeError, Symbol, Val, Vec,
};

use crate::{
    AccSignature, Error, Pay3SmartAccount, Pay3SmartAccountClient, SessionPolicy,
};

fn generate_keypair() -> Keypair {
    Keypair::generate(&mut thread_rng())
}

fn signer_pk(e: &Env, signer: &Keypair) -> BytesN<32> {
    signer.public.to_bytes().into_val(e)
}

fn sign(e: &Env, signer: &Keypair, payload: &BytesN<32>) -> Val {
    AccSignature {
        public_key: signer_pk(e, signer),
        signature: signer
            .sign(payload.to_array().as_slice())
            .to_bytes()
            .into_val(e),
    }
    .into_val(e)
}

struct Fixture<'a> {
    env: &'a Env,
    client: Pay3SmartAccountClient<'a>,
    owner_kp: Keypair,
    session_kp: Keypair,
    native_sac: Address,
}

fn setup(env: &Env) -> Fixture<'_> {
    env.mock_all_auths();

    let owner_kp = generate_keypair();
    let session_kp = generate_keypair();
    let owner = Address::generate(env);
    let native_sac = Address::generate(env);

    let client = Pay3SmartAccountClient::new(
        env,
        &env.register(
            Pay3SmartAccount {},
            (
                owner.clone(),
                signer_pk(env, &owner_kp),
                native_sac.clone(),
            ),
        ),
    );

    Fixture {
        env,
        client,
        owner_kp,
        session_kp,
        native_sac,
    }
}

fn transfer_ctx(
    e: &Env,
    sac: &Address,
    from: &Address,
    to: &Address,
    amount: i128,
) -> Context {
    Context::Contract(ContractContext {
        contract: sac.clone(),
        fn_name: symbol_short!("transfer"),
        args: (from.clone(), to.clone(), amount).into_val(e),
    })
}

fn check_auth(
    f: &Fixture<'_>,
    signer: &Keypair,
    payload: &BytesN<32>,
    contexts: Vec<Context>,
) -> Result<(), Result<Error, InvokeError>> {
    f.env.try_invoke_contract_check_auth::<Error>(
        &f.client.address,
        payload,
        vec![f.env, sign(f.env, signer, payload)].into(),
        &contexts,
    )
}

#[test]
fn owner_can_authorize_native_transfer() {
    let env = Env::default();
    let f = setup(&env);
    let payload = BytesN::random(&env);
    let to = Address::generate(&env);

    check_auth(
        &f,
        &f.owner_kp,
        &payload,
        vec![
            &env,
            transfer_ctx(&env, &f.native_sac, &f.client.address, &to, 1_000_000),
        ],
    )
    .unwrap();
}

#[test]
fn session_valid_transfer_and_spend_accounting() {
    let env = Env::default();
    let f = setup(&env);
    let payload = BytesN::random(&env);
    let to = Address::generate(&env);

    f.client.add_session(
        &signer_pk(&env, &f.session_kp),
        &1_000_000,
        &5_000_000,
        &10_000_000,
    );

    check_auth(
        &f,
        &f.session_kp,
        &payload,
        vec![
            &env,
            transfer_ctx(&env, &f.native_sac, &f.client.address, &to, 2_000_000),
        ],
    )
    .unwrap();

    let policy: SessionPolicy = f.client.get_session(&signer_pk(&env, &f.session_kp));
    assert_eq!(policy.spent_stroops, 2_000_000);
}

#[test]
fn missing_session_rejected() {
    let env = Env::default();
    let f = setup(&env);
    let payload = BytesN::random(&env);
    let to = Address::generate(&env);

    let err = check_auth(
        &f,
        &f.session_kp,
        &payload,
        vec![
            &env,
            transfer_ctx(&env, &f.native_sac, &f.client.address, &to, 1),
        ],
    )
    .err()
    .unwrap()
    .unwrap();
    assert_eq!(err, Error::Unauthorized);
}

#[test]
fn revoked_session_rejected() {
    let env = Env::default();
    let f = setup(&env);
    let payload = BytesN::random(&env);
    let to = Address::generate(&env);
    let pk = signer_pk(&env, &f.session_kp);

    f.client.add_session(&pk, &1_000_000, &5_000_000, &10_000_000);
    f.client.revoke_session(&pk);

    let err = check_auth(
        &f,
        &f.session_kp,
        &payload,
        vec![
            &env,
            transfer_ctx(&env, &f.native_sac, &f.client.address, &to, 1),
        ],
    )
    .err()
    .unwrap()
    .unwrap();
    assert_eq!(err, Error::SessionRevoked);
}

#[test]
fn expired_session_rejected() {
    let env = Env::default();
    let f = setup(&env);
    let payload = BytesN::random(&env);
    let to = Address::generate(&env);
    let pk = signer_pk(&env, &f.session_kp);

    f.client.add_session(&pk, &100, &5_000_000, &10_000_000);

    env.ledger().set(LedgerInfo {
        timestamp: 0,
        protocol_version: 22,
        sequence_number: 101,
        network_id: Default::default(),
        base_reserve: 10,
        min_temp_entry_ttl: 16,
        min_persistent_entry_ttl: 16,
        max_entry_ttl: 150_000,
    });

    let err = check_auth(
        &f,
        &f.session_kp,
        &payload,
        vec![
            &env,
            transfer_ctx(&env, &f.native_sac, &f.client.address, &to, 1),
        ],
    )
    .err()
    .unwrap()
    .unwrap();
    assert_eq!(err, Error::SessionExpired);
}

#[test]
fn exact_per_tx_cap_ok_one_stroop_over_fails() {
    let env = Env::default();
    let f = setup(&env);
    let payload = BytesN::random(&env);
    let to = Address::generate(&env);
    let pk = signer_pk(&env, &f.session_kp);

    f.client.add_session(&pk, &1_000_000, &1_000_000, &10_000_000);

    check_auth(
        &f,
        &f.session_kp,
        &payload,
        vec![
            &env,
            transfer_ctx(&env, &f.native_sac, &f.client.address, &to, 1_000_000),
        ],
    )
    .unwrap();

    let payload2 = BytesN::random(&env);
    let session2 = generate_keypair();
    f.client.add_session(
        &signer_pk(&env, &session2),
        &1_000_000,
        &1_000_000,
        &10_000_000,
    );

    let err = check_auth(
        &f,
        &session2,
        &payload2,
        vec![
            &env,
            transfer_ctx(&env, &f.native_sac, &f.client.address, &to, 1_000_001),
        ],
    )
    .err()
    .unwrap()
    .unwrap();
    assert_eq!(err, Error::CapExceeded);
}

#[test]
fn session_lifetime_cap_enforced() {
    let env = Env::default();
    let f = setup(&env);
    let to = Address::generate(&env);
    let pk = signer_pk(&env, &f.session_kp);

    f.client.add_session(&pk, &1_000_000, &600_000, &1_000_000);

    check_auth(
        &f,
        &f.session_kp,
        &BytesN::random(&env),
        vec![
            &env,
            transfer_ctx(&env, &f.native_sac, &f.client.address, &to, 600_000),
        ],
    )
    .unwrap();

    let err = check_auth(
        &f,
        &f.session_kp,
        &BytesN::random(&env),
        vec![
            &env,
            transfer_ctx(&env, &f.native_sac, &f.client.address, &to, 500_000),
        ],
    )
    .err()
    .unwrap()
    .unwrap();
    assert_eq!(err, Error::CapExceeded);
}

#[test]
fn wrong_sac_rejected() {
    let env = Env::default();
    let f = setup(&env);
    let to = Address::generate(&env);
    let pk = signer_pk(&env, &f.session_kp);
    f.client.add_session(&pk, &1_000_000, &5_000_000, &10_000_000);

    let other_sac = Address::generate(&env);
    let err = check_auth(
        &f,
        &f.session_kp,
        &BytesN::random(&env),
        vec![
            &env,
            transfer_ctx(&env, &other_sac, &f.client.address, &to, 1),
        ],
    )
    .err()
    .unwrap()
    .unwrap();
    assert_eq!(err, Error::InvalidContext);
}

#[test]
fn wrong_function_rejected() {
    let env = Env::default();
    let f = setup(&env);
    let to = Address::generate(&env);
    let pk = signer_pk(&env, &f.session_kp);
    f.client.add_session(&pk, &1_000_000, &5_000_000, &10_000_000);

    let ctx = Context::Contract(ContractContext {
        contract: f.native_sac.clone(),
        fn_name: Symbol::new(&env, "approve"),
        args: (f.client.address.clone(), to, 1_i128).into_val(&env),
    });

    let err = check_auth(
        &f,
        &f.session_kp,
        &BytesN::random(&env),
        vec![&env, ctx],
    )
    .err()
    .unwrap()
    .unwrap();
    assert_eq!(err, Error::InvalidContext);
}

#[test]
fn wrong_from_rejected() {
    let env = Env::default();
    let f = setup(&env);
    let to = Address::generate(&env);
    let other_from = Address::generate(&env);
    let pk = signer_pk(&env, &f.session_kp);
    f.client.add_session(&pk, &1_000_000, &5_000_000, &10_000_000);

    let err = check_auth(
        &f,
        &f.session_kp,
        &BytesN::random(&env),
        vec![
            &env,
            transfer_ctx(&env, &f.native_sac, &other_from, &to, 1),
        ],
    )
    .err()
    .unwrap()
    .unwrap();
    assert_eq!(err, Error::InvalidContext);
}

#[test]
fn zero_and_negative_amount_rejected() {
    let env = Env::default();
    let f = setup(&env);
    let to = Address::generate(&env);
    let pk = signer_pk(&env, &f.session_kp);
    f.client.add_session(&pk, &1_000_000, &5_000_000, &10_000_000);

    let err0 = check_auth(
        &f,
        &f.session_kp,
        &BytesN::random(&env),
        vec![
            &env,
            transfer_ctx(&env, &f.native_sac, &f.client.address, &to, 0),
        ],
    )
    .err()
    .unwrap()
    .unwrap();
    assert_eq!(err0, Error::BadAmount);

    let err_neg = check_auth(
        &f,
        &f.session_kp,
        &BytesN::random(&env),
        vec![
            &env,
            transfer_ctx(&env, &f.native_sac, &f.client.address, &to, -1),
        ],
    )
    .err()
    .unwrap()
    .unwrap();
    assert_eq!(err_neg, Error::BadAmount);
}

#[test]
fn admin_escalation_via_session_rejected() {
    let env = Env::default();
    let f = setup(&env);
    let pk = signer_pk(&env, &f.session_kp);
    f.client.add_session(&pk, &1_000_000, &5_000_000, &10_000_000);

    let ctx = Context::Contract(ContractContext {
        contract: f.client.address.clone(),
        fn_name: Symbol::new(&env, "add_session"),
        args: (pk.clone(), 1_000_000_u32, 1_i128, 1_i128).into_val(&env),
    });

    let err = check_auth(
        &f,
        &f.session_kp,
        &BytesN::random(&env),
        vec![&env, ctx],
    )
    .err()
    .unwrap()
    .unwrap();
    assert_eq!(err, Error::InvalidContext);
}

#[test]
fn multiple_transfers_aggregate_before_cap() {
    let env = Env::default();
    let f = setup(&env);
    let to = Address::generate(&env);
    let pk = signer_pk(&env, &f.session_kp);
    f.client.add_session(&pk, &1_000_000, &1_000_000, &10_000_000);

    check_auth(
        &f,
        &f.session_kp,
        &BytesN::random(&env),
        vec![
            &env,
            transfer_ctx(&env, &f.native_sac, &f.client.address, &to, 400_000),
            transfer_ctx(&env, &f.native_sac, &f.client.address, &to, 600_000),
        ],
    )
    .unwrap();

    let policy: SessionPolicy = f.client.get_session(&pk);
    assert_eq!(policy.spent_stroops, 1_000_000);

    let session2 = generate_keypair();
    f.client.add_session(
        &signer_pk(&env, &session2),
        &1_000_000,
        &1_000_000,
        &10_000_000,
    );
    let err = check_auth(
        &f,
        &session2,
        &BytesN::random(&env),
        vec![
            &env,
            transfer_ctx(&env, &f.native_sac, &f.client.address, &to, 600_000),
            transfer_ctx(&env, &f.native_sac, &f.client.address, &to, 500_000),
        ],
    )
    .err()
    .unwrap()
    .unwrap();
    assert_eq!(err, Error::CapExceeded);
}

#[test]
fn failed_auth_does_not_persist_spend() {
    let env = Env::default();
    let f = setup(&env);
    let to = Address::generate(&env);
    let pk = signer_pk(&env, &f.session_kp);
    f.client.add_session(&pk, &1_000_000, &500_000, &1_000_000);

    check_auth(
        &f,
        &f.session_kp,
        &BytesN::random(&env),
        vec![
            &env,
            transfer_ctx(&env, &f.native_sac, &f.client.address, &to, 400_000),
        ],
    )
    .unwrap();
    assert_eq!(f.client.get_session(&pk).spent_stroops, 400_000);

    let _ = check_auth(
        &f,
        &f.session_kp,
        &BytesN::random(&env),
        vec![
            &env,
            transfer_ctx(&env, &f.native_sac, &f.client.address, &to, 700_000),
        ],
    );
    assert_eq!(f.client.get_session(&pk).spent_stroops, 400_000);

    check_auth(
        &f,
        &f.session_kp,
        &BytesN::random(&env),
        vec![
            &env,
            transfer_ctx(&env, &f.native_sac, &f.client.address, &to, 100_000),
        ],
    )
    .unwrap();
    assert_eq!(f.client.get_session(&pk).spent_stroops, 500_000);
}

#[test]
fn bad_policy_rejected_on_add_session() {
    let env = Env::default();
    let f = setup(&env);
    let pk = signer_pk(&env, &f.session_kp);

    let err = f
        .client
        .try_add_session(&pk, &1_000_000, &0, &10)
        .err()
        .unwrap()
        .unwrap();
    assert_eq!(err, Error::BadPolicy);

    let err2 = f
        .client
        .try_add_session(&pk, &1_000_000, &100, &50)
        .err()
        .unwrap()
        .unwrap();
    assert_eq!(err2, Error::BadPolicy);
}
