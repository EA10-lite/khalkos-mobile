use starknet::ContractAddress;

#[derive(Drop, Serde, starknet::Store)]
pub struct SpendWithYield {
    pub id: u64,
    pub vault: ContractAddress,
    pub token_addr: ContractAddress,
    pub amount: u256,
    pub recipient: ContractAddress,
    pub yield_percentage: u16,
    pub shares: u256,
    pub created_at: u64,
}
    