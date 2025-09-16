use starknet::ContractAddress;
use starknet::class_hash::ClassHash;

#[derive(Drop, starknet::Event)]
pub struct SpentWithYield {
    pub user: ContractAddress,
    pub token: ContractAddress,
    pub spent_amount: u256,
    pub yield_amount: u256,
    pub recipient: ContractAddress,
    pub vault: ContractAddress,
    pub shares: u256,
    pub created_at: u64,
    pub id: u64,
}

#[derive(Drop, starknet::Event)]
pub struct DepositedToVault {
    pub user: ContractAddress,
    pub vault: ContractAddress,
    pub amount: u256,
    pub shares: u256,
}

#[derive(Drop, starknet::Event)]
pub struct WithdrawnFromVault {
    pub user: ContractAddress,
    pub vault: ContractAddress,
    pub amount: u256,
    pub shares: u256,
}

#[derive(Drop, starknet::Event)]
pub struct RedeemedFromVault {
    pub user: ContractAddress,
    pub vault: ContractAddress,
    pub shares: u256,
    pub amount: u256,
}

#[derive(Drop, starknet::Event)]
pub struct OwnerChanged {
    pub old_owner: ContractAddress,
    pub new_owner: ContractAddress,
}

#[derive(Drop, starknet::Event)]
pub struct Upgraded {
    pub implementation: ClassHash,
}

#[derive(Drop, starknet::Event)]
pub struct ContractPaused {
    pub timestamp: u64,
}

#[derive(Drop, starknet::Event)]
pub struct ContractUnpaused {
    pub timestamp: u64,
}

#[derive(Drop, starknet::Event)]
pub struct ProtocolFeeChanged {
    pub old_fee: u256,
    pub new_fee: u256,
}

#[derive(Drop, starknet::Event)]
pub struct EmergencyWithdraw {
    pub token: ContractAddress,
    pub amount: u256,
    pub recipient: ContractAddress,
}
