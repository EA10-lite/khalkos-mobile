#[starknet::contract]
pub mod KhalkosV1 {
    use core::num::traits::Zero;
    use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
    use interface::IVault::{IVaultDispatcher, IVaultDispatcherTrait}
    use starknet::class_hash::ClassHash;
    use starknet::storage::{
        Map, StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess,
        StoragePointerWriteAccess,
    };
    use crate::types::errors::{
        CLASS_HASH_CANNOT_BE_ZERO, CONTRACT_IS_ACTIVE_ALREADY, AMOUNT_MUST_BE_GREATER_THAN_0,
        CONTRACT_IS_PAUSED, CONTRACT_IS_PAUSED_ALREADY, INSUFFICIENT_ALLOWANCE, UNAUTHORIZED_CALLER, ZERO_ADDRESS_NOT_ALLOWED,  INVALID_TOKEN_ADDRESS 
    };
    use crate::types::structs::{SpendWithYield};
    use crate::types::events::{SpentWithYield, DepositedToVault, Upgraded, OwnerChanged, ContractPaused, ContractUnpaused, ProtocolFeeChanged};
    use starknet::{ContractAddress, get_block_timestamp, get_caller_address, get_contract_address};
    use crate::interface::IKhalkos::IKhalkos;

    #[storage]
    struct Storage {
        owner: ContractAddress,
        is_paused: bool,
        version: u16,
        protocol_fee: u256,
        transactions: Map<ContractAddress, SpendWithYield>,
        transaction_counter: u64,
        erc20_addr: IERC20Dispatcher,
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress, protocol_fee: ContractAddress, erc20_addr: ContractAddress) {
        self.owner.write(owner);
        self.protocol_fee.write(protocol_fee);
        self.version.write(1);
        self.transaction_counter.write(0);
        self.erc20_addr.write(IERC20Dispatcher { contract_address: erc20_addr });
    }

    #[abi(embed_v0)]
    impl KhalkosV1Impl of IKhalkosV1<ContractState> {

        fn spend_with_yield(ref self: TContractState, token: ContractAddress, amount: u256, recipient: ContractAddress, yield_percentage: u16, vault: ContractAddress) {
            let caller = get_caller_address();
            let contract_address = get_contract_address();

            assert(caller.is_non_zero() && token.is_non_zero() && recipient.is_non_zero() && vault.is_non_zero(), ZERO_ADDRESS_NOT_ALLOWED);
            assert(amount > 0, AMOUNT_MUST_BE_GREATER_THAN_0);
            
            let vault_contract = IVaultDispatcher { contract_address: vault };
            let vault_asset = vault_contract.asset();
            assert(vault_asset == token, INVALID_TOKEN_ADDRESS);
            
            let yield_amount = (amount * yield_percentage) / 10000;
            let spend_amount = amount - yield_amount;
            
            let contract_allowance = self.erc20_addr.read().allowance(caller, contract_address);
            assert(contract_allowance >= amount, INSUFFICIENT_ALLOWANCE);

            self.erc20_addr.read().transfer_from(caller, contract_address, recipient);

            let _shares = 0;
            // Deposit yield amount to specified vault
            if yield_amount > 0 {
                _shares = self._deposit_to_vault(token, vault, yield_amount, caller);
            }

            let txn_count = self.transaction_counter.read() + 1;
            self.transaction_counter.write(txn_count);

            let transaction = SpendWithYield {
                id: txn_count,
                vault: vault,
                token_addr: token,
                amount: spend_amount,
                recipient: recipient,
                yield_percentage: yield_percentage,
                shares: _shares,
                created_at: get_block_timestamp(),
            }

            self.transactions.write(caller, transaction);
            
            self.emit(SpentWithYield {
                user: caller,
                token,
                spent_amount: spend_amount,
                yield_amount,
                recipient,
                vault,
                shares: _shares,
                created_at: get_block_timestamp(),
                id: txn_count,
            });
        };
        fn withdraw_from_vault(ref self: TContractState, vault: ContractAddress, amount: u256) {

        };
        fn redeem_from_vault(ref self: TContractState, vault: ContractAddress, shares: u256) {

        };
        fn get_vault_assets_balance(self: @TContractState, vault: ContractAddress, user: ContractAddress) -> u256 {

        };
        fn get_vault_shares_balance(self: @TContractState, vault: ContractAddress, user: ContractAddress) -> u256 {

        };
        fn get_yield_transactions(self: @TContractState) -> Array<SpendWithYield> {

        };

        fn get_owner(self: @ContractState) -> ContractAddress {
            self.owner.read()
        }

        fn change_owner(ref self: ContractState, new_owner: ContractAddress) {
            self._only_owner();
            let old_owner = self.owner.read();
            self.owner.write(new_owner);
            self.emit(OwnerChanged { old_owner, new_owner });
        }
            
        fn upgrade(ref self: ContractState, impl_hash: ClassHash, new_version: u8) {
            self._only_owner();
            assert(impl_hash.is_non_zero(), CLASS_HASH_CANNOT_BE_ZERO);
            starknet::syscalls::replace_class_syscall(impl_hash).unwrap();
            self.version.write(new_version);
            self.emit(Upgraded { implementation: impl_hash });
        }

        fn get_version(self: @ContractState) -> u8 {
            self.version.read()
        }

        fn pause(ref self: ContractState) {
            self._only_owner();
            let status = self.is_paused.read();
            assert(!status, CONTRACT_IS_PAUSED_ALREADY);
            self.is_paused.write(true);
            self.emit(ContractPaused { timestamp: get_block_timestamp() });
        }

        fn unpause(ref self: ContractState) {
            self._only_owner();
            let status = self.is_paused.read();
            assert(status, CONTRACT_IS_ACTIVE_ALREADY);
            self.is_paused.write(false);
            self.emit(ContractUnpaused { timestamp: get_block_timestamp() });
        }

        fn get_contract_status(self: @ContractState) -> bool {
            self.is_paused.read()
        }
        fn get_protocol_fee(self: @ContractState) -> u256 {
            self.protocol_fee.read()
        }
        fn set_protocol_fee(ref self: ContractState, new_fee: u256) {
            self._only_owner();
            let old_fee = self.protocol_fee.read();
            self.protocol_fee.write(new_fee);
            self.emit(ProtocolFeeChanged { old_fee, new_fee });
        }
    
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn _only_owner(ref self: ContractState) {
            let caller = get_caller_address();
            assert(caller.is_non_zero(), ZERO_ADDRESS_NOT_ALLOWED);

            let owner = self.owner.read();
            assert(owner == caller, UNAUTHORIZED_CALLER);
        }

        fn _is_contract_paused(ref self: ContractState) {
            let paused = self.is_paused.read();
            assert(!paused, CONTRACT_IS_PAUSED);
        }

        fn _deposit_to_vault(
            ref self: ContractState,
            token: ContractAddress,
            vault: ContractAddress,
            amount: u256,
            user: ContractAddress,
        ) -> u256 {
            self.erc20_addr.read().approve(vault, amount);
            let vault_contract = IVaultDispatcher { contract_address: vault };
            
            let shares = vault_contract.deposit(amount, user);

            self.transactions.write(user, SpendWithYield {
                user,
                token,
                spent_amount: amount,
                yield_amount: 0,
                recipient: user,
                vault,
            });

            self.emit(DepositedToVault {
                user,
                vault,
                amount,
                shares,
            });

            shares
        }
    }
}
