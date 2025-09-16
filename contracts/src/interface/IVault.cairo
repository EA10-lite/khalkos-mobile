use starknet::ContractAddress;

#[starknet::interface]
pub trait IVault<TContractState> {
    fn asset(self: @TContractState) -> ContractAddress;
    fn deposit(ref self: TContractState, assets: u256, receiver: ContractAddress) -> u256;
    fn withdraw(ref self: TContractState, assets: u256, receiver: ContractAddress, owner: ContractAddress) -> u256;
    fn redeem(ref self: TContractState, shares: u256, receiver: ContractAddress, owner: ContractAddress) -> u256;
    fn balance_of(self: @TContractState, account: ContractAddress) -> u256;
    fn preview_withdraw(self: @TContractState, assets: u256) -> u256;
    fn convert_to_assets(self: @TContractState, shares: u256) -> u256;
    fn preview_redeem(self: @TContractState, shares: u256) -> u256;
    fn max_withdraw(self: @TContractState, user: ContractAddress) -> u256;
    fn max_redeem(self: @TContractState, user: ContractAddress) -> u256;
}
