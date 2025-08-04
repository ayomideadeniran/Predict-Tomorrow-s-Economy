"use client";

import { useMemo, useState } from "react";
import {
  useAccount,
  useContract,
  useSendTransaction,
  useConnect,
  useReadContract,
} from "@starknet-react/core";

// Replace with your deployed contract address
const contractAddress =
  "0x04ddca13e1692e41d085a0d6ea370f43f771e67703130d5b297e6894d75ef06c";

// A utility to convert a number to a u256 for Starknet, handling larger numbers
function toU256(amount: number): { low: string; high: string } {
  const bigAmount = BigInt(amount);
  const low = bigAmount & 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFn;
  const high = bigAmount >> 128n;
  return {
    low: `0x${low.toString(16)}`,
    high: `0x${high.toString(16)}`,
  };
}

export default function Home() {
  const { address, status } = useAccount();
  const { connect, connectors } = useConnect();
  const [stakeAmount, setStakeAmount] = useState<number>(10); // Default stake
  const [predictionChoice, setPredictionChoice] = useState<number | null>(null);
  const [determinationChoice, setDeterminationChoice] = useState<number | null>(
    null
  );

  // Correct ABI matching the Cairo contract
  const { contract } = useContract({
    abi: [
      {
        type: "function",
        name: "predict",
        inputs: [
          { name: "prediction", type: "core::integer::u8" },
          { name: "amount", type: "core::integer::u256" },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "determine_result",
        inputs: [{ name: "result", type: "core::integer::u8" }],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "get_owner",
        inputs: [],
        outputs: [{ type: "core::starknet::contract_address::ContractAddress" }],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "get_total_up_stake",
        inputs: [],
        outputs: [{ type: "core::integer::u256" }],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "get_total_down_stake",
        inputs: [],
        outputs: [{ type: "core::integer::u256" }],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "get_result",
        inputs: [],
        outputs: [{ type: "core::integer::u8" }],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "get_prediction",
        inputs: [
          {
            name: "user",
            type: "core::starknet::contract_address::ContractAddress",
          },
        ],
        outputs: [{ type: "core::integer::u8" }],
        state_mutability: "view",
      },
    ],
    address: contractAddress,
  });

  // Fetching contract data
  const { data: owner } = useReadContract({
    functionName: "get_owner",
    abi: contract?.abi,
    address: contractAddress,
    watch: true,
  });

  const { data: totalUp, isLoading: isLoadingTotalUp } = useReadContract({
    functionName: "get_total_up_stake",
    abi: contract?.abi,
    address: contractAddress,
    watch: true,
  });

  const { data: totalDown, isLoading: isLoadingTotalDown } = useReadContract({
    functionName: "get_total_down_stake",
    abi: contract?.abi,
    address: contractAddress,
    watch: true,
  });

  const { data: result } = useReadContract({
    functionName: "get_result",
    abi: contract?.abi,
    address: contractAddress,
    watch: true,
  });

  const { data: userPrediction } = useReadContract({
    functionName: "get_prediction",
    args: address ? [address] : undefined,
    abi: contract?.abi,
    address: contractAddress,
    watch: true,
    enabled: !!address,
  });

  const hasPredicted = useMemo(
    () => userPrediction !== undefined && BigInt(userPrediction as any) !== 0n,
    [userPrediction]
  );
  const isOwner = useMemo(
    () => owner !== undefined && address === owner,
    [owner, address]
  );

  const readableTotalUp = useMemo(() => {
    if (isLoadingTotalUp || totalUp === undefined) return "Loading...";
    return BigInt(totalUp as any).toString();
  }, [totalUp, isLoadingTotalUp]);

  const readableTotalDown = useMemo(() => {
    if (isLoadingTotalDown || totalDown === undefined) return "Loading...";
    return BigInt(totalDown as any).toString();
  }, [totalDown, isLoadingTotalDown]);

  // Transaction for making a prediction
  const {
    send: sendPrediction,
    isPending: isPredicting,
    error: predictError,
  } = useSendTransaction({
    calls: useMemo(() => {
      if (!predictionChoice || !stakeAmount || !contract) return [];
      return contract.populate("predict", [
        predictionChoice,
        toU256(stakeAmount),
      ]);
    }, [predictionChoice, stakeAmount, contract]),
  });

  // Transaction for determining the result
  const {
    send: sendDetermination,
    isPending: isDetermining,
    error: determineError,
  } = useSendTransaction({
    calls: useMemo(() => {
      if (!determinationChoice || !contract) return [];
      return contract.populate("determine_result", [determinationChoice]);
    }, [determinationChoice, contract]),
  });

  // UI Handlers
  const handlePredict = (choice: number) => {
    setPredictionChoice(choice);
    setTimeout(() => sendPrediction(), 0);
  };

  const handleDetermine = (choice: number) => {
    setDeterminationChoice(choice);
    setTimeout(() => sendDetermination(), 0);
  };

  // Readable data for UI
  const readableResult =
    result === undefined || BigInt(result as any) === 0n
      ? "Pending"
      : BigInt(result as any) === 1n
      ? "Up"
      : "Down";

  const readablePrediction =
    !hasPredicted
      ? "None"
      : BigInt(userPrediction as any) === 1n
      ? "Up"
      : "Down";

  if (status === "disconnected") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
        <h1 className="text-3xl font-bold mb-6 text-white">
          Welcome to Predict Tomorrow's Economy
        </h1>
        {connectors.map((connector) => (
          <button
            key={connector.id}
            onClick={() => connect({ connector })}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg mb-3 hover:opacity-80 transition-opacity"
          >
            Connect {connector.name}
          </button>
        ))}
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold mb-4">📊 Predict Tomorrow's Economy</h1>
      <p className="text-gray-300 mb-6 text-lg text-center">
        Will the global economy be up or down tomorrow? Place your bet!
      </p>
      <p className="text-gray-400 mb-6 text-xs">Connected as: {address}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 w-full max-w-4xl">
        <div className="bg-green-800/50 p-5 rounded-lg shadow-lg text-center">
          <h2 className="text-xl font-bold">Total Up Stake</h2>
          <p className="text-2xl">{readableTotalUp}</p>
        </div>
        <div className="bg-red-800/50 p-5 rounded-lg shadow-lg text-center">
          <h2 className="text-xl font-bold">Total Down Stake</h2>
          <p className="text-2xl">{readableTotalDown}</p>
        </div>
      </div>

      <div className="bg-gray-800/50 p-5 rounded-lg shadow-lg mb-8 w-full max-w-4xl text-center">
        <p className="text-lg">
          Your Prediction:{" "}
          <span className="font-bold">{readablePrediction}</span>
        </p>
        <p className="text-lg">
          Result: <span className="font-bold">{readableResult}</span>
        </p>
      </div>

      {!hasPredicted && (
        <>
          <input
            type="number"
            value={stakeAmount}
            onChange={(e) => setStakeAmount(Number(e.target.value))}
            placeholder="Enter stake amount"
            className="p-3 rounded-lg text-black mb-6 w-full max-w-xs text-center bg-gray-200"
          />
          <div className="grid grid-cols-2 gap-6 w-full max-w-md mb-8">
            <button
              disabled={hasPredicted || isPredicting}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-500 text-white py-4 rounded-lg text-xl font-bold shadow-lg transition-transform transform hover:scale-105"
              onClick={() => handlePredict(1)}
            >
              📈 Predict Up
            </button>
            <button
              disabled={hasPredicted || isPredicting}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-500 text-white py-4 rounded-lg text-xl font-bold shadow-lg transition-transform transform hover:scale-105"
              onClick={() => handlePredict(2)}
            >
              📉 Predict Down
            </button>
          </div>
        </>
      )}

      {isOwner && BigInt(result as any) === 0n && (
        <div className="border-t border-gray-700 mt-8 pt-8 w-full max-w-4xl flex flex-col items-center">
          <h2 className="text-2xl font-bold mb-4">Owner Controls</h2>
          <div className="grid grid-cols-2 gap-6 w-full max-w-md">
            <button
              disabled={isDetermining}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 text-white px-6 py-3 rounded-lg shadow-lg"
              onClick={() => handleDetermine(1)}
            >
              Set Result to UP
            </button>
            <button
              disabled={isDetermining}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-500 text-white px-6 py-3 rounded-lg shadow-lg"
              onClick={() => handleDetermine(2)}
            >
              Set Result to DOWN
            </button>
          </div>
        </div>
      )}

      {(isPredicting || isDetermining) && (
        <p className="text-yellow-400 mt-4">Transaction pending...</p>
      )}
      {predictError && (
        <p className="text-red-400 mt-4">
          Prediction Error: {predictError.message}
        </p>
      )}
      {determineError && (
        <p className="text-red-400 mt-4">
          Determination Error: {determineError.message}
        </p>
      )}
    </main>
  );
}