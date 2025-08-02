"use client";

import { useAccount, useContract } from "@starknet-react/core";
import { useMemo } from "react";
import { stark } from "starknet";

const contractAddress = "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004854";

export default function Home() {
  const { account, address, status } = useAccount();
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
        inputs: [],
        outputs: [],
        state_mutability: "external",
      },
    ],
    address: contractAddress,
  });

  const calls = useMemo(() => {
    if (!address || !contract) return [];
    return contract.populate("predict", [1, 100]);
  }, [contract, address]);

  const { write, data, isPending } = useStarknetExecute({ calls });

  if (status === "disconnected") {
    return <button onClick={() => account.connect({ connector: undefined })}>Connect Wallet</button>;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Predict Tomorrow's Economy</h1>
      <div className="flex space-x-4 mb-8">
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => write()}
        >
          Predict Up
        </button>
        <button
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => write()}
        >
          Predict Down
        </button>
      </div>
      <button
        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mb-8"
        onClick={() => write()}
      >
        Determine Result
      </button>
      <div className="text-lg">
        <p>Your prediction: </p>
        <p>Total Up Stake: </p>
        <p>Total Down Stake: </p>
        <p>Result: </p>
      </div>
    </main>
  );
}
