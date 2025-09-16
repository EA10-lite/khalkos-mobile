use starknet::ContractAddress;
use starknet::class_hash::ClassHash;
use crate::types::structs::{SpendWithYield, WithdrawFromVault, RedeemFromVault};

#[starknet::interface]
pub trait IKhalkos<TContractState> {
    fn spend_with_yield(ref self: TContractState, token: ContractAddress, amount: u256, recipient: ContractAddress, yield_percentage: u256, vault: ContractAddress);
    fn withdraw_from_vault(ref self: TContractState, vault: ContractAddress, amount: u256);
    fn redeem_from_vault(ref self: TContractState, vault: ContractAddress, shares: u256);
    fn get_vault_assets_balance(self: @TContractState, vault: ContractAddress, user: ContractAddress) -> u256;
    fn get_vault_shares_balance(self: @TContractState, vault: ContractAddress, user: ContractAddress) -> u256;
    fn get_yield_transactions(self: @TContractState) -> Array<SpendWithYield>;
    fn get_withdraw_transactions(self: @TContractState) -> Array<WithdrawFromVault>;
    fn get_redeem_transactions(self: @TContractState) -> Array<RedeemFromVault>;
    fn preview_vault_withdraw(self: @TContractState, vault: ContractAddress, amount: u256) -> u256;
    fn preview_vault_redeem(self: @TContractState, vault: ContractAddress, shares: u256) -> u256;
    fn get_max_withdraw(self: @TContractState, vault: ContractAddress, user: ContractAddress) -> u256;
    fn get_max_redeem(self: @TContractState, vault: ContractAddress, user: ContractAddress) -> u256;
    fn get_owner(self: @TContractState) -> ContractAddress;
    fn change_owner(ref self: TContractState, new_owner: ContractAddress);
    fn upgrade(ref self: TContractState, impl_hash: ClassHash, new_version: u8);
    fn get_version(self: @TContractState) -> u8;
    fn pause(ref self: TContractState);
    fn unpause(ref self: TContractState);
    fn get_contract_status(self: @TContractState) -> bool;
    fn get_protocol_fee(self: @TContractState) -> u256;
    fn set_protocol_fee(ref self: TContractState, new_fee: u256);
}   

