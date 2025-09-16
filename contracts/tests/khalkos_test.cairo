// tests/test_khalkos.cairo
use starknet::{ContractAddress, contract_address_const, get_caller_address, testing};
use starknet::testing::{set_caller_address, set_contract_address, set_block_timestamp};
use snforge_std::{declare, ContractClassTrait, spy_events, SpyOn, EventSpy, EventAssertions};

use khalkos::contracts::KhalkosV1::{KhalkosV1, IKhalkosDispatcher, IKhalkosDispatcherTrait};
use khalkos::interface::IVault::{IVaultDispatcher, IVaultDispatcherTrait};
use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};

// Mock contracts for testing
#[starknet::contract]
mod MockERC20 {
    use openzeppelin::token::erc20::{ERC20Component, ERC20HooksEmptyImpl};
    use starknet::ContractAddress;

    component!(path: ERC20Component, storage: erc20, event: ERC20Event);

    #[abi(embed_v0)]
    impl ERC20Impl = ERC20Component::ERC20Impl<ContractState>;
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc20: ERC20Component::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC20Event: ERC20Component::Event,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        initial_supply: u256,
        recipient: ContractAddress
    ) {
        let name = "MockToken";
        let symbol = "MOCK";
        self.erc20.initializer(name, symbol);
        self.erc20._mint(recipient, initial_supply);
    }
}

#[starknet::contract]
mod MockVault {
    use starknet::ContractAddress;
    use khalkos::interface::IVault::IVault;

    #[storage]
    struct Storage {
        asset_token: ContractAddress,
        total_shares: u256,
        total_assets: u256,
        user_shares: LegacyMap::<ContractAddress, u256>,
    }

    #[constructor]
    fn constructor(ref self: ContractState, asset: ContractAddress) {
        self.asset_token.write(asset);
        self.total_shares.write(0);
        self.total_assets.write(0);
    }

    #[abi(embed_v0)]
    impl MockVaultImpl of IVault<ContractState> {
        fn asset(self: @ContractState) -> ContractAddress {
            self.asset_token.read()
        }

        fn deposit(ref self: ContractState, assets: u256, receiver: ContractAddress) -> u256 {
            // Simple 1:1 ratio for testing
            let shares = assets;
            let current_shares = self.user_shares.read(receiver);
            self.user_shares.write(receiver, current_shares + shares);
            self.total_shares.write(self.total_shares.read() + shares);
            self.total_assets.write(self.total_assets.read() + assets);
            shares
        }

        fn withdraw(ref self: ContractState, assets: u256, receiver: ContractAddress, owner: ContractAddress) -> u256 {
            let shares_to_burn = assets; // 1:1 for simplicity
            let current_shares = self.user_shares.read(owner);
            assert(current_shares >= shares_to_burn, 'Insufficient shares');
            self.user_shares.write(owner, current_shares - shares_to_burn);
            self.total_shares.write(self.total_shares.read() - shares_to_burn);
            self.total_assets.write(self.total_assets.read() - assets);
            shares_to_burn
        }

        fn redeem(ref self: ContractState, shares: u256, receiver: ContractAddress, owner: ContractAddress) -> u256 {
            let assets = shares; // 1:1 for simplicity
            let current_shares = self.user_shares.read(owner);
            assert(current_shares >= shares, 'Insufficient shares');
            self.user_shares.write(owner, current_shares - shares);
            self.total_shares.write(self.total_shares.read() - shares);
            self.total_assets.write(self.total_assets.read() - assets);
            assets
        }

        fn balance_of(self: @ContractState, account: ContractAddress) -> u256 {
            self.user_shares.read(account)
        }

        fn preview_withdraw(self: @ContractState, assets: u256) -> u256 {
            assets // 1:1 for simplicity
        }

        fn convert_to_assets(self: @ContractState, shares: u256) -> u256 {
            shares // 1:1 for simplicity
        }

        fn preview_redeem(self: @ContractState, shares: u256) -> u256 {
            shares // 1:1 for simplicity
        }

        fn max_withdraw(self: @ContractState, user: ContractAddress) -> u256 {
            self.user_shares.read(user)
        }

        fn max_redeem(self: @ContractState, user: ContractAddress) -> u256 {
            self.user_shares.read(user)
        }
    }
}

// Test setup functions
fn deploy_mock_erc20(initial_supply: u256, recipient: ContractAddress) -> ContractAddress {
    let contract = declare("MockERC20");
    let constructor_calldata = array![initial_supply.low.into(), initial_supply.high.into(), recipient.into()];
    contract.deploy(@constructor_calldata).unwrap()
}

fn deploy_mock_vault(asset: ContractAddress) -> ContractAddress {
    let contract = declare("MockVault");
    let constructor_calldata = array![asset.into()];
    contract.deploy(@constructor_calldata).unwrap()
}

fn deploy_khalkos(owner: ContractAddress, protocol_fee: u256, erc20_addr: ContractAddress) -> ContractAddress {
    let contract = declare("KhalkosV1");
    let constructor_calldata = array![
        owner.into(),
        protocol_fee.low.into(),
        protocol_fee.high.into(),
        erc20_addr.into()
    ];
    contract.deploy(@constructor_calldata).unwrap()
}

fn setup() -> (ContractAddress, ContractAddress, ContractAddress, ContractAddress, ContractAddress) {
    let owner = contract_address_const::<'owner'>();
    let user = contract_address_const::<'user'>();
    let recipient = contract_address_const::<'recipient'>();
    
    // Deploy mock ERC20 with initial supply to user
    let initial_supply = 1000000_u256;
    let erc20_addr = deploy_mock_erc20(initial_supply, user);
    
    // Deploy mock vault
    let vault_addr = deploy_mock_vault(erc20_addr);
    
    // Deploy Khalkos contract
    let protocol_fee = 100_u256; // 1%
    let khalkos_addr = deploy_khalkos(owner, protocol_fee, erc20_addr);
    
    (owner, user, recipient, erc20_addr, vault_addr)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_constructor() {
        let (owner, _, _, erc20_addr, _) = setup();
        let protocol_fee = 100_u256;
        let khalkos_addr = deploy_khalkos(owner, protocol_fee, erc20_addr);
        
        let khalkos = IKhalkosDispatcher { contract_address: khalkos_addr };
        
        assert(khalkos.get_owner() == owner, 'Wrong owner');
        assert(khalkos.get_protocol_fee() == protocol_fee, 'Wrong protocol fee');
        assert(khalkos.get_version() == 1, 'Wrong version');
        assert(!khalkos.get_contract_status(), 'Should not be paused');
    }

    #[test]
    fn test_spend_with_yield_success() {
        let (owner, user, recipient, erc20_addr, vault_addr) = setup();
        let khalkos_addr = deploy_khalkos(owner, 500, erc20_addr); // 5%
        
        let khalkos = IKhalkosDispatcher { contract_address: khalkos_addr };
        let erc20 = IERC20Dispatcher { contract_address: erc20_addr };
        
        // Setup: approve khalkos to spend tokens
        set_caller_address(user);
        let spend_amount = 1000_u256;
        erc20.approve(khalkos_addr, spend_amount);
        
        // Approve vault to spend from khalkos (for deposit)
        set_caller_address(khalkos_addr);
        erc20.approve(vault_addr, spend_amount);
        
        set_caller_address(user);
        set_block_timestamp(123456789);
        
        // Execute spend_with_yield
        let mut spy = spy_events(SpyOn::One(khalkos_addr));
        khalkos.spend_with_yield(erc20_addr, spend_amount, recipient, 500, vault_addr); // 5% yield
        
        // Verify balances
        let expected_spend = 950_u256; // 95% to recipient
        let expected_yield = 50_u256;  // 5% to vault
        
        assert(erc20.balance_of(recipient) == expected_spend, 'Wrong recipient balance');
        
        // Check vault shares
        let vault = IVaultDispatcher { contract_address: vault_addr };
        assert(vault.balance_of(user) == expected_yield, 'Wrong vault shares');
        
        // Verify event was emitted
        spy.assert_emitted(@array![
            (khalkos_addr, KhalkosV1::Event::SpentWithYield(
                KhalkosV1::SpentWithYield {
                    user: user,
                    token: erc20_addr,
                    spent_amount: expected_spend,
                    yield_amount: expected_yield,
                    recipient: recipient,
                    vault: vault_addr,
                    shares: expected_yield,
                    created_at: 123456789,
                    id: 1,
                }
            ))
        ]);
    }

    #[test]
    #[should_panic(expected: ('Contract is paused',))]
    fn test_spend_with_yield_when_paused() {
        let (owner, user, recipient, erc20_addr, vault_addr) = setup();
        let khalkos_addr = deploy_khalkos(owner, 500, erc20_addr);
        let khalkos = IKhalkosDispatcher { contract_address: khalkos_addr };
        
        // Pause contract
        set_caller_address(owner);
        khalkos.pause();
        
        // Try to spend - should fail
        set_caller_address(user);
        khalkos.spend_with_yield(erc20_addr, 1000, recipient, 500, vault_addr);
    }

    #[test]
    #[should_panic(expected: ('Zero address not allowed',))]
    fn test_spend_with_yield_zero_addresses() {
        let (_, user, _, erc20_addr, vault_addr) = setup();
        let khalkos_addr = deploy_khalkos(user, 500, erc20_addr);
        let khalkos = IKhalkosDispatcher { contract_address: khalkos_addr };
        
        set_caller_address(user);
        khalkos.spend_with_yield(
            contract_address_const::<0>(), // zero token address
            1000,
            user,
            500,
            vault_addr
        );
    }

    #[test]
    #[should_panic(expected: ('Amount must be greater than 0',))]
    fn test_spend_with_yield_zero_amount() {
        let (_, user, recipient, erc20_addr, vault_addr) = setup();
        let khalkos_addr = deploy_khalkos(user, 500, erc20_addr);
        let khalkos = IKhalkosDispatcher { contract_address: khalkos_addr };
        
        set_caller_address(user);
        khalkos.spend_with_yield(erc20_addr, 0, recipient, 500, vault_addr);
    }

    #[test]
    #[should_panic(expected: ('Invalid token address',))]
    fn test_spend_with_yield_wrong_token_for_vault() {
        let (_, user, recipient, erc20_addr, _) = setup();
        let khalkos_addr = deploy_khalkos(user, 500, erc20_addr);
        let khalkos = IKhalkosDispatcher { contract_address: khalkos_addr };
        
        // Create vault with different token
        let wrong_token = deploy_mock_erc20(1000000, user);
        let wrong_vault = deploy_mock_vault(wrong_token);
        
        set_caller_address(user);
        khalkos.spend_with_yield(erc20_addr, 1000, recipient, 500, wrong_vault);
    }

    #[test]
    fn test_withdraw_from_vault() {
        let (owner, user, recipient, erc20_addr, vault_addr) = setup();
        let khalkos_addr = deploy_khalkos(owner, 500, erc20_addr);
        let khalkos = IKhalkosDispatcher { contract_address: khalkos_addr };
        let erc20 = IERC20Dispatcher { contract_address: erc20_addr };
        
        // First, do a spend_with_yield to get some vault shares
        set_caller_address(user);
        erc20.approve(khalkos_addr, 1000);
        set_caller_address(khalkos_addr);
        erc20.approve(vault_addr, 1000);
        set_caller_address(user);
        
        khalkos.spend_with_yield(erc20_addr, 1000, recipient, 500, vault_addr); // 50 to vault
        
        // Now withdraw from vault
        set_block_timestamp(123456790);
        let mut spy = spy_events(SpyOn::One(khalkos_addr));
        
        khalkos.withdraw_from_vault(vault_addr, 25); // withdraw 25 assets
        
        // Check vault balance decreased
        let vault = IVaultDispatcher { contract_address: vault_addr };
        assert(vault.balance_of(user) == 25, 'Wrong remaining shares'); // 50 - 25 = 25
        
        // Verify event
        spy.assert_emitted(@array![
            (khalkos_addr, KhalkosV1::Event::WithdrawnFromVault(
                KhalkosV1::WithdrawnFromVault {
                    user: user,
                    vault: vault_addr,
                    amount: 25,
                    shares: 25, // 1:1 ratio in mock
                    timestamp: 123456790,
                }
            ))
        ]);
    }

    #[test]
    fn test_redeem_from_vault() {
        let (owner, user, recipient, erc20_addr, vault_addr) = setup();
        let khalkos_addr = deploy_khalkos(owner, 500, erc20_addr);
        let khalkos = IKhalkosDispatcher { contract_address: khalkos_addr };
        let erc20 = IERC20Dispatcher { contract_address: erc20_addr };
        
        // First, do a spend_with_yield to get vault shares
        set_caller_address(user);
        erc20.approve(khalkos_addr, 1000);
        set_caller_address(khalkos_addr);
        erc20.approve(vault_addr, 1000);
        set_caller_address(user);
        
        khalkos.spend_with_yield(erc20_addr, 1000, recipient, 500, vault_addr); // 50 to vault
        
        // Now redeem shares
        set_block_timestamp(123456791);
        let mut spy = spy_events(SpyOn::One(khalkos_addr));
        
        khalkos.redeem_from_vault(vault_addr, 20); // redeem 20 shares
        
        // Check remaining shares
        let vault = IVaultDispatcher { contract_address: vault_addr };
        assert(vault.balance_of(user) == 30, 'Wrong remaining shares'); // 50 - 20 = 30
        
        // Verify event
        spy.assert_emitted(@array![
            (khalkos_addr, KhalkosV1::Event::RedeemedFromVault(
                KhalkosV1::RedeemedFromVault {
                    user: user,
                    vault: vault_addr,
                    amount: 20, // 1:1 ratio in mock
                    shares: 20,
                    timestamp: 123456791,
                }
            ))
        ]);
    }

    #[test]
    fn test_get_vault_balances() {
        let (owner, user, recipient, erc20_addr, vault_addr) = setup();
        let khalkos_addr = deploy_khalkos(owner, 500, erc20_addr);
        let khalkos = IKhalkosDispatcher { contract_address: khalkos_addr };
        let erc20 = IERC20Dispatcher { contract_address: erc20_addr };
        
        // Do spend_with_yield first
        set_caller_address(user);
        erc20.approve(khalkos_addr, 1000);
        set_caller_address(khalkos_addr);
        erc20.approve(vault_addr, 1000);
        set_caller_address(user);
        
        khalkos.spend_with_yield(erc20_addr, 1000, recipient, 500, vault_addr); // 50 to vault
        
        // Test balance queries
        assert(khalkos.get_vault_shares_balance(vault_addr, user) == 50, 'Wrong shares balance');
        assert(khalkos.get_vault_assets_balance(vault_addr, user) == 50, 'Wrong assets balance');
    }

    #[test]
    fn test_preview_functions() {
        let (owner, user, _, erc20_addr, vault_addr) = setup();
        let khalkos_addr = deploy_khalkos(owner, 500, erc20_addr);
        let khalkos = IKhalkosDispatcher { contract_address: khalkos_addr };
        
        // Test preview functions (mock vault has 1:1 ratios)
        assert(khalkos.preview_vault_withdraw(vault_addr, 100) == 100, 'Wrong withdraw preview');
        assert(khalkos.preview_vault_redeem(vault_addr, 100) == 100, 'Wrong redeem preview');
    }

    #[test]
    fn test_get_transactions_history() {
        let (owner, user, recipient, erc20_addr, vault_addr) = setup();
        let khalkos_addr = deploy_khalkos(owner, 500, erc20_addr);
        let khalkos = IKhalkosDispatcher { contract_address: khalkos_addr };
        let erc20 = IERC20Dispatcher { contract_address: erc20_addr };
        
        set_caller_address(user);
        erc20.approve(khalkos_addr, 2000);
        set_caller_address(khalkos_addr);
        erc20.approve(vault_addr, 2000);
        set_caller_address(user);
        
        // Make 2 transactions
        khalkos.spend_with_yield(erc20_addr, 1000, recipient, 500, vault_addr);
        khalkos.spend_with_yield(erc20_addr, 500, recipient, 1000, vault_addr);
        
        // Check transaction history
        let transactions = khalkos.get_yield_transactions();
        assert(transactions.len() == 2, 'Wrong transaction count');
        
        // Most recent should be first
        let latest = transactions.at(0);
        assert(*latest.amount == 450, 'Wrong latest amount'); // 500 * 90% = 450
    }

    #[test]
    fn test_admin_functions() {
        let (owner, user, _, erc20_addr, _) = setup();
        let khalkos_addr = deploy_khalkos(owner, 500, erc20_addr);
        let khalkos = IKhalkosDispatcher { contract_address: khalkos_addr };
        
        set_caller_address(owner);
        
        // Test pause/unpause
        khalkos.pause();
        assert(khalkos.get_contract_status(), 'Should be paused');
        
        khalkos.unpause();
        assert(!khalkos.get_contract_status(), 'Should be unpaused');
        
        // Test protocol fee change
        khalkos.set_protocol_fee(200);
        assert(khalkos.get_protocol_fee() == 200, 'Wrong new protocol fee');
        
        // Test owner change
        let new_owner = contract_address_const::<'new_owner'>();
        khalkos.change_owner(new_owner);
        assert(khalkos.get_owner() == new_owner, 'Wrong new owner');
    }

    #[test]
    #[should_panic(expected: ('Only owner',))]
    fn test_admin_functions_unauthorized() {
        let (owner, user, _, erc20_addr, _) = setup();
        let khalkos_addr = deploy_khalkos(owner, 500, erc20_addr);
        let khalkos = IKhalkosDispatcher { contract_address: khalkos_addr };
        
        // Try admin function as non-owner
        set_caller_address(user);
        khalkos.pause();
    }
}