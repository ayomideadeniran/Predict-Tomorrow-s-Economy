"use client";

import { useMemo, useState } from "react";
import {
  useAccount,
  useContract,
  useSendTransaction,
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

export function useEconomyContract() {
    const { address, status } = useAccount();
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
                    { name: "prediction", type: "felt" },
                    { name: "amount_low", type: "felt" },
                    { name: "amount_high", type: "felt" }
                ],
                outputs: [],
                state_mutability: "external"
            },
            {
                type: "function",
                name: "determine_result",
                inputs: [{ name: "result", type: "felt" }],
                outputs: [],
                state_mutability: "external"
            },
            {
                type: "function",
                name: "get_owner",
                inputs: [],
                outputs: [{ type: "felt" }],
                state_mutability: "view"
            },
            {
                type: "function",
                name: "get_total_up_stake",
                inputs: [],
                outputs: [{ type: "felt" }],
                state_mutability: "view"
            },
            {
                type: "function",
                name: "get_total_down_stake",
                inputs: [],
                outputs: [{ type: "felt" }],
                state_mutability: "view"
            },
            {
                type: "function",
                name: "get_result",
                inputs: [],
                outputs: [{ type: "felt" }],
                state_mutability: "view"
            },
            {
                type: "function",
                name: "get_prediction",
                inputs: [{ name: "user", type: "felt" }],
                outputs: [{ type: "felt" }],
                state_mutability: "view"
            }
        ],
        address: contractAddress
    });

    // Fetching contract data
    const { data: owner } = useReadContract({
        functionName: "get_owner",
        abi: contract?.abi,
        address: contractAddress,
        watch: true,
        enabled: !!contract,
    });

    const { data: totalUp, isLoading: isLoadingTotalUp } = useReadContract({
        functionName: "get_total_up_stake",
        abi: contract?.abi,
        address: contractAddress,
        watch: true,
        enabled: !!contract,
    });

    const { data: totalDown, isLoading: isLoadingTotalDown } = useReadContract({
        functionName: "get_total_down_stake",
        abi: contract?.abi,
        address: contractAddress,
        watch: true,
        enabled: !!contract,
    });

    const { data: result, isLoading: isLoadingResult } = useReadContract({
        functionName: "get_result",
        abi: contract?.abi,
        address: contractAddress,
        watch: true,
        enabled: !!contract,
    });

    const { data: userPrediction, isLoading: isLoadingUserPrediction } = useReadContract({
        functionName: "get_prediction",
        args: address ? [address] : undefined,
        abi: contract?.abi,
        address: contractAddress,
        watch: true,
        enabled: !!contract && !!address,
    });

    const hasPredicted = useMemo(
        () => userPrediction !== undefined && BigInt(userPrediction as any) !== BigInt("0"),
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
            const u256 = toU256(stakeAmount);
            return [contract.populate('predict', [String(predictionChoice), String(u256.low), String(u256.high)]) as any];
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
            return [contract.populate('determine_result', [String(determinationChoice)]) as any];
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
        isLoadingResult || result === undefined
            ? "Pending"
            : BigInt(result as any) === BigInt("0")
                ? "Pending"
                : BigInt(result as any) === BigInt("1")
                    ? "Up"
                    : "Down";

    const readablePrediction =
        isLoadingUserPrediction || userPrediction === undefined
            ? "None"
            : BigInt(userPrediction as any) === BigInt("1")
                ? "Up"
                : "Down";

    return {
        address,
        status,
        stakeAmount,
        setStakeAmount,
        hasPredicted,
        isOwner,
        readableTotalUp,
        readableTotalDown,
        isPredicting,
        predictError,
        isDetermining,
        determineError,
        handlePredict,
        handleDetermine,
        readableResult,
        readablePrediction
    };
}
