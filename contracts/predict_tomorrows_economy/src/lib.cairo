#[starknet::contract]
mod PredictTomorrowsEconomy {
    use starknet::ContractAddress;
    use starknet::get_caller_address;
    use starknet::storage::Map;

    #[storage]
    struct Storage {
        owner: ContractAddress,
        result: u8, // 0: Not set, 1: Up, 2: Down
        predictions: Map<ContractAddress, u8>,
        staked_amounts: Map<ContractAddress, u256>,
        total_up_stake: u256,
        total_down_stake: u256,
        participants: Map<u32, ContractAddress>,
        participant_count: u32,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        Predicted: Predicted,
        ResultDetermined: ResultDetermined,
        PredictionCanceled: PredictionCanceled,
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

    #[derive(Drop, starknet::Event)]
    struct PredictionCanceled {
        user: ContractAddress,
        amount: u256,
    }

    #[starknet::interface]
    trait IPredictTomorrowsEconomy<TContractState> {
        fn predict(ref self: TContractState, prediction: u8, amount: u256);
        fn cancel_prediction(ref self: TContractState);
        fn determine_result(ref self: TContractState, result: u8);
        fn get_owner(self: @TContractState) -> ContractAddress;
        fn get_result(self: @TContractState) -> u8;
        fn get_prediction(self: @TContractState, user: ContractAddress) -> u8;
        fn get_total_up_stake(self: @TContractState) -> u256;
        fn get_total_down_stake(self: @TContractState) -> u256;
        fn get_participant(self: @TContractState, index: u32) -> ContractAddress;
        fn get_participant_count(self: @TContractState) -> u32;
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner_address: ContractAddress) {
        self.owner.write(owner_address);
        self.result.write(0);
        self.total_up_stake.write(0);
        self.total_down_stake.write(0);
    }

    #[abi(embed_v0)]
    impl PredictTomorrowsEconomyImpl of IPredictTomorrowsEconomy<ContractState> {
        fn predict(ref self: ContractState, prediction: u8, amount: u256) {
            let caller = get_caller_address();
            assert(prediction == 1 || prediction == 2, 'Invalid prediction');
            assert(self.result.read() == 0, 'Result already determined');
            assert(self.predictions.read(caller) == 0, 'Already predicted');

            self.predictions.write(caller, prediction);
            self.staked_amounts.write(caller, amount);

            if prediction == 1 {
                self.total_up_stake.write(self.total_up_stake.read() + amount);
            } else {
                self.total_down_stake.write(self.total_down_stake.read() + amount);
            }

            let count = self.participant_count.read();
            self.participants.write(count, caller);
            self.participant_count.write(count + 1);

            self.emit(Event::Predicted(Predicted { user: caller, prediction, amount }));
        }

        fn cancel_prediction(ref self: ContractState) {
            let caller = get_caller_address();
            assert(self.result.read() == 0, 'Result already determined');
            let prediction = self.predictions.read(caller);
            assert(prediction != 0, 'No prediction to cancel');

            let amount = self.staked_amounts.read(caller);

            if prediction == 1 {
                self.total_up_stake.write(self.total_up_stake.read() - amount);
            } else {
                self.total_down_stake.write(self.total_down_stake.read() - amount);
            }

            self.predictions.write(caller, 0);
            self.staked_amounts.write(caller, 0);

            self.emit(Event::PredictionCanceled(PredictionCanceled { user: caller, amount }));
        }

        fn determine_result(ref self: ContractState, result: u8) {
            assert(get_caller_address() == self.owner.read(), 'Not the owner');
            assert(self.result.read() == 0, 'Result already set');
            assert(result == 1 || result == 2, 'Invalid result');

            self.result.write(result);
            self.emit(Event::ResultDetermined(ResultDetermined { result }));
        }

        fn get_owner(self: @ContractState) -> ContractAddress {
            self.owner.read()
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

        fn get_participant(self: @ContractState, index: u32) -> ContractAddress {
            self.participants.read(index)
        }

        fn get_participant_count(self: @ContractState) -> u32 {
            self.participant_count.read()
        }
    }
}






