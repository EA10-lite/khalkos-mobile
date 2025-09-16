use starknet::ContractAddress;

#[derive(Drop, Serde, starknet::Store)]
pub struct SpendWithYield {
    pub id: u64,
    pub vault: ContractAddress,
    pub token_addr: ContractAddress,
    pub amount: u256,
    pub recipient: ContractAddress,
    pub yield_percentage: u256,
    pub shares: u256,
    pub created_at: u64,
}

#[derive(Drop, Serde, starknet::Store)]
pub struct WithdrawFromVault {
    pub id: u64,
    pub vault: ContractAddress,
    pub amount: u256,
    pub shares_burned: u256,
    pub created_at: u64,
}

#[derive(Drop, Serde, starknet::Store)]
pub struct RedeemFromVault {
    pub id: u64,
    pub vault: ContractAddress,
    pub shares: u256,
    pub assets_received: u256,
    pub created_at: u64,
}
    