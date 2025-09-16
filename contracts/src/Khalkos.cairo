#[starknet::contract]
pub mod KhalkosV1 {
    use core::num::traits::Zero;
    use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
    use crate::interface::IVault::{IVaultDispatcher, IVaultDispatcherTrait};
    use starknet::class_hash::ClassHash;
    use starknet::storage::{
        Map, StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess,
        StoragePointerWriteAccess,
    };
    use crate::types::errors::{
        CLASS_HASH_CANNOT_BE_ZERO, CONTRACT_IS_ACTIVE_ALREADY, AMOUNT_MUST_BE_GREATER_THAN_0,
        CONTRACT_IS_PAUSED, CONTRACT_IS_PAUSED_ALREADY, INSUFFICIENT_ALLOWANCE, UNAUTHORIZED_CALLER, ZERO_ADDRESS_NOT_ALLOWED,  INVALID_TOKEN_ADDRESS 
    };
    use crate::types::structs::{SpendWithYield, WithdrawFromVault, RedeemFromVault};
    use crate::types::events::{SpentWithYield, DepositedToVault, Upgraded, OwnerChanged, ContractPaused, ContractUnpaused, ProtocolFeeChanged, WithdrawnFromVault, RedeemedFromVault};
    use starknet::{ContractAddress, get_block_timestamp, get_caller_address, get_contract_address};
    use crate::interface::IKhalkos::IKhalkos;

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        SpentWithYield: SpentWithYield,
        DepositedToVault: DepositedToVault,
        Upgraded: Upgraded,
        OwnerChanged: OwnerChanged,
        ContractPaused: ContractPaused,
        ContractUnpaused: ContractUnpaused,
        ProtocolFeeChanged: ProtocolFeeChanged,
        WithdrawnFromVault: WithdrawnFromVault,
        RedeemedFromVault: RedeemedFromVault,
    }

    #[storage]
    struct Storage {
        owner: ContractAddress,
        erc20_addr: IERC20Dispatcher,
        is_paused: bool,
        version: u8,
        protocol_fee: u256,

        transactions: Map<u64, SpendWithYield>,
        transaction_counter: u64,
        user_transactions: Map<(ContractAddress, u64), u64>, // (user, user_sequence) -> global_txn_id
        user_transaction_count: Map<ContractAddress, u64>, // user -> count of transactions

        withdrawals: Map<u64, WithdrawFromVault>,
        withdrawal_counter: u64,
        user_withdrawals: Map<(ContractAddress, u64), u64>, // (user, user_sequence) -> global_withdrawal_id
        user_withdrawal_count: Map<ContractAddress, u64>, // user -> count of withdrawals

        redeemals: Map<u64, RedeemFromVault>,
        redeemal_counter: u64,
        user_redeemals: Map<(ContractAddress, u64), u64>, // (user, user_sequence) -> global_redeemal_id
        user_redeemal_count: Map<ContractAddress, u64>, // user -> count of redeemals
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress, protocol_fee: u256, erc20_addr: ContractAddress) {
        self.owner.write(owner);
        self.protocol_fee.write(protocol_fee);
        self.version.write(1);
        self.transaction_counter.write(0);
        self.withdrawal_counter.write(0);
        self.redeemal_counter.write(0);
        self.erc20_addr.write(IERC20Dispatcher { contract_address: erc20_addr });
    }

    #[abi(embed_v0)]
    impl KhalkosV1Impl of IKhalkos<ContractState> {

        fn spend_with_yield(ref self: ContractState, token: ContractAddress, amount: u256, recipient: ContractAddress, yield_percentage: u256, vault: ContractAddress) {
            self._is_contract_paused();
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

            self.erc20_addr.read().transfer_from(caller, recipient, spend_amount);

            let mut shares = 0;

            // Deposit yield amount to specified vault
            if yield_amount > 0 {
                shares = self._deposit_to_vault(token, vault, yield_amount, caller);
            }

            let txn_count = self.transaction_counter.read() + 1;
            self.transaction_counter.write(txn_count);
            
            let user_txn_count = self.user_transaction_count.read(caller) + 1;
            self.user_transaction_count.write(caller, user_txn_count);

            let transaction = SpendWithYield {
                id: txn_count,
                vault: vault,
                token_addr: token,
                amount: spend_amount,
                recipient: recipient,
                yield_percentage: yield_percentage,
                shares: shares,
                created_at: get_block_timestamp(),
            };

            self.transactions.write(txn_count, transaction);
            self.user_transactions.write((caller, user_txn_count), txn_count);
            
            self.emit(SpentWithYield {
                user: caller,
                token,
                spent_amount: spend_amount,
                yield_amount,
                recipient,
                vault,
                shares: shares,
                created_at: get_block_timestamp(),
                id: txn_count,
            });
        }

        fn withdraw_from_vault(ref self: ContractState, vault: ContractAddress, amount: u256) {
            self._is_contract_paused();
            let caller = get_caller_address();
            
            assert(caller.is_non_zero() && vault.is_non_zero(), ZERO_ADDRESS_NOT_ALLOWED);
            assert(amount > 0, AMOUNT_MUST_BE_GREATER_THAN_0);
            
            let vault_contract = IVaultDispatcher { contract_address: vault };
            
            // Withdraw exact amount of assets from vault
            // This burns the required shares and gives exact asset amount
            let shares_burned = vault_contract.withdraw(amount, caller, caller);

            let withdraw_count = self.withdrawal_counter.read() + 1;
            let user_withdrawal_count = self.user_withdrawal_count.read(caller) + 1;
            self.user_withdrawal_count.write(caller, user_withdrawal_count);
            self.withdrawal_counter.write(withdraw_count);

            let withdraw = WithdrawFromVault {
                id: withdraw_count,
                vault: vault,
                amount: amount,
                shares_burned: shares_burned,
                created_at: get_block_timestamp(),
            };

            self.withdrawals.write(withdraw_count, withdraw);
            self.user_withdrawals.write((caller, user_withdrawal_count), withdraw_count);
            
            self.emit(WithdrawnFromVault {
                user: caller,
                vault,
                amount,
                shares: shares_burned,
                timestamp: get_block_timestamp(),
            });
        }
        
        fn redeem_from_vault(ref self: ContractState, vault: ContractAddress, shares: u256) {
            self._is_contract_paused();
            let caller = get_caller_address();
            
            assert(caller.is_non_zero() && vault.is_non_zero(), ZERO_ADDRESS_NOT_ALLOWED);
            assert(shares > 0, AMOUNT_MUST_BE_GREATER_THAN_0);
    
            let vault_contract = IVaultDispatcher { contract_address: vault };
    
            // Redeem exact shares for whatever assets they're worth
            // This burns exact shares and gives calculated asset amount
            let assets_received = vault_contract.redeem(shares, caller, caller);
            let redeem_count = self.redeemal_counter.read() + 1;
            let user_redeemal_count = self.user_redeemal_count.read(caller) + 1;
            self.user_redeemal_count.write(caller, user_redeemal_count);
            self.redeemal_counter.write(redeem_count);

            let redeem = RedeemFromVault {
                id: redeem_count,
                vault: vault,
                shares: shares,
                assets_received: assets_received,
                created_at: get_block_timestamp(),
            };

            self.redeemals.write(redeem_count, redeem);
            self.user_redeemals.write((caller, user_redeemal_count), redeem_count);
            
            self.emit(RedeemedFromVault {
                user: caller,
                vault,
                amount: assets_received,
                shares: shares,
                timestamp: get_block_timestamp(),
            });
    
    
        }

        fn get_vault_assets_balance(self: @ContractState, vault: ContractAddress, user: ContractAddress) -> u256 {
            assert(user.is_non_zero() && vault.is_non_zero(), ZERO_ADDRESS_NOT_ALLOWED);
    
            let vault_contract = IVaultDispatcher { contract_address: vault };
            
            // Get user's shares in the vault
            let user_shares = vault_contract.balance_of(user);
            
            // Convert shares to underlying assets value
            vault_contract.convert_to_assets(user_shares)
        }

        fn get_vault_shares_balance(self: @ContractState, vault: ContractAddress, user: ContractAddress) -> u256 {
            assert(user.is_non_zero() && vault.is_non_zero(), ZERO_ADDRESS_NOT_ALLOWED);
    
            let vault_contract = IVaultDispatcher { contract_address: vault };
            
            // Get user's shares directly from vault
            vault_contract.balance_of(user)
        }

        fn get_yield_transactions(self: @ContractState) -> Array<SpendWithYield> {
            let caller = get_caller_address();
            assert(caller.is_non_zero(), ZERO_ADDRESS_NOT_ALLOWED);
        
            let mut transactions = ArrayTrait::new();
            let max_transactions: u64 = 20;
            
            let user_txn_count = self.user_transaction_count.read(caller);
            
            if user_txn_count == 0 {
                return transactions;
            }
            
            let mut i = user_txn_count;
            let mut count: u64 = 0;
            
            loop {
                let global_txn_id = self.user_transactions.read((caller, i));
                if global_txn_id != 0 {
                    let transaction = self.transactions.read(global_txn_id);
                    ArrayTrait::append(ref transactions, transaction);
                    count += 1;
                    
                    if count >= max_transactions {
                        break;
                    }
                }
                
                if i == 1 {
                    break;
                }
                i -= 1;
            }
            
            transactions
        }

        fn get_withdraw_transactions(self: @ContractState) -> Array<WithdrawFromVault> {
            let caller = get_caller_address();
            assert(caller.is_non_zero(), ZERO_ADDRESS_NOT_ALLOWED);
        
            let mut transactions = ArrayTrait::new();
            let max_transactions: u64 = 20;
            
            let user_txn_count = self.user_withdrawal_count.read(caller);
            
            if user_txn_count == 0 {
                return transactions;
            }
            
            let mut i = user_txn_count;
            let mut count: u64 = 0;
            
            loop {
                let global_txn_id = self.user_withdrawals.read((caller, i));
                if global_txn_id != 0 {
                    let transaction = self.withdrawals.read(global_txn_id);
                    ArrayTrait::append(ref transactions, transaction);
                    count += 1;
                    
                    if count >= max_transactions {
                        break;
                    }
                }
                
                if i == 1 {
                    break;
                }
                i -= 1;
            }
            
            transactions
        }

        fn get_redeem_transactions(self: @ContractState) -> Array<RedeemFromVault> {
            let caller = get_caller_address();
            assert(caller.is_non_zero(), ZERO_ADDRESS_NOT_ALLOWED);
        
            let mut transactions = ArrayTrait::new();
            let max_transactions: u64 = 20;
            
            let user_txn_count = self.user_redeemal_count.read(caller);
            
            if user_txn_count == 0 {
                return transactions;
            }
            
            let mut i = user_txn_count;
            let mut count: u64 = 0;
            
            loop {
                let global_txn_id = self.user_redeemals.read((caller, i));
                if global_txn_id != 0 {
                    let transaction = self.redeemals.read(global_txn_id);
                    ArrayTrait::append(ref transactions, transaction);
                    count += 1;
                    
                    if count >= max_transactions {
                        break;
                    }
                }
                
                if i == 1 {
                    break;
                }
                i -= 1;
            }
            
            transactions
        }

        fn preview_vault_withdraw(self: @ContractState, vault: ContractAddress, amount: u256) -> u256 {
            assert(vault.is_non_zero(), ZERO_ADDRESS_NOT_ALLOWED);
            assert(amount > 0, AMOUNT_MUST_BE_GREATER_THAN_0);
            
            let vault_contract = IVaultDispatcher { contract_address: vault };
            
            vault_contract.preview_withdraw(amount)
        }
        
        fn preview_vault_redeem(self: @ContractState, vault: ContractAddress, shares: u256) -> u256 {
            assert(vault.is_non_zero(), ZERO_ADDRESS_NOT_ALLOWED);
            assert(shares > 0, AMOUNT_MUST_BE_GREATER_THAN_0);
            
            let vault_contract = IVaultDispatcher { contract_address: vault };
            
            vault_contract.preview_redeem(shares)
        }
        
        fn get_max_withdraw(self: @ContractState, vault: ContractAddress, user: ContractAddress) -> u256 {
            assert(user.is_non_zero() && vault.is_non_zero(), ZERO_ADDRESS_NOT_ALLOWED);
            
            let vault_contract = IVaultDispatcher { contract_address: vault };

            vault_contract.max_withdraw(user)
        }
        
        fn get_max_redeem(self: @ContractState, vault: ContractAddress, user: ContractAddress) -> u256 {
            assert(user.is_non_zero() && vault.is_non_zero(), ZERO_ADDRESS_NOT_ALLOWED);
            
            let vault_contract = IVaultDispatcher { contract_address: vault };
            
            vault_contract.max_redeem(user)
        }

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
