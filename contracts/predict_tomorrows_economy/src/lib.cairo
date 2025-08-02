#[starknet::contract]
mod PredictTomorrowsEconomy {
    use starknet::ContractAddress;
    use starknet::get_caller_address;

    #[storage]
    struct Storage {
        oracle: ContractAddress,
        result: u8, // 0: Not set, 1: Up, 2: Down
        predictions: LegacyMap<ContractAddress, u8>,
        total_up_stake: u256,
        total_down_stake: u256,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        Predicted: Predicted,
        ResultDetermined: ResultDetermined,
    }

    #[derive(Drop, starknet::Event)]
    struct Predicted {
        user: ContractAddress,
        prediction: u8,
        amount: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct ResultDetermined {
        result: u8,
    }

    #[starknet::interface]
    trait IPredictTomorrowsEconomy<TContractState> {
        fn predict(ref self: TContractState, prediction: u8, amount: u256);
        fn determine_result(ref self: TContractState);
        fn get_oracle(self: @TContractState) -> ContractAddress;
        fn get_result(self: @TContractState) -> u8;
        fn get_prediction(self: @TContractState, user: ContractAddress) -> u8;
        fn get_total_up_stake(self: @TContractState) -> u256;
        fn get_total_down_stake(self: @TContractState) -> u256;
    }

    #[constructor]
    fn constructor(ref self: ContractState, oracle_address: ContractAddress) {
        self.oracle.write(oracle_address);
        self.result.write(0);
        self.total_up_stake.write(0);
        self.total_down_stake.write(0);
    }

    #[external(v0)]
    impl PredictTomorrowsEconomyImpl of IPredictTomorrowsEconomy<ContractState> {
        fn predict(ref self: ContractState, prediction: u8, amount: u256) {
            let caller = get_caller_address();
            assert(prediction == 1 || prediction == 2, 'Invalid prediction');
            assert(self.result.read() == 0, 'Result already determined');
            assert(self.predictions.read(caller) == 0, 'Already predicted');

            self.predictions.write(caller, prediction);

            if prediction == 1 {
                self.total_up_stake.write(self.total_up_stake.read() + amount);
            } else {
                self.total_down_stake.write(self.total_down_stake.read() + amount);
            }

            self.emit(Predicted { user: caller, prediction, amount });
        }

        fn determine_result(ref self: ContractState) {
            assert(get_caller_address() == self.oracle.read(), 'Not the oracle');
            assert(self.result.read() == 0, 'Result already set');

            let random_number = starknet::get_block_timestamp();
            let result = if random_number % 2 == 0 { 1 } else { 2 };

            self.result.write(result);
            self.emit(ResultDetermined { result });
        }

        fn get_oracle(self: @ContractState) -> ContractAddress {
            self.oracle.read()
        }

        fn get_result(self: @ContractState) -> u8 {
            self.result.read()
        }

        fn get_prediction(self: @ContractState, user: ContractAddress) -> u8 {
            self.predictions.read(user)
        }

        fn get_total_up_stake(self: @ContractState) -> u256 {
            self.total_up_stake.read()
        }

        fn get_total_down_stake(self: @ContractState) -> u256 {
            self.total_down_stake.read()
        }
    }
}
