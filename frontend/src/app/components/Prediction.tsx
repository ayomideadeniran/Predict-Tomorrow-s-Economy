"use client";

import { useMemo } from "react";

interface PredictionProps {
    hasPredicted: boolean;
    isPredicting: boolean;
    stakeAmount: number;
    setStakeAmount: (amount: number) => void;
    handlePredict: (choice: number) => void;
}

export default function Prediction({ hasPredicted, isPredicting, stakeAmount, setStakeAmount, handlePredict }: PredictionProps) {

    return (
        <section className="w-full max-w-xl px-4 mb-16 animate-fade-in">
            <div className="bg-gradient-to-br from-indigo-800/90 to-purple-900/90 rounded-3xl shadow-2xl p-10 flex flex-col items-center">
                <h2 className="text-3xl font-bold mb-6 text-white">Make Your Prediction</h2>
                <input
                    type="number"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(Number(e.target.value))}
                    placeholder="Enter stake amount"
                    className="p-4 rounded-xl text-black mb-8 w-full max-w-xs text-center bg-gray-200 border-2 border-indigo-400 focus:border-purple-500 focus:outline-none text-lg font-semibold"
                />
                <div className="flex gap-10 w-full justify-center">
                    <button
                        disabled={hasPredicted || isPredicting}
                        className="bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 disabled:bg-gray-500 text-white py-4 px-10 rounded-xl text-2xl font-bold shadow-lg transition-transform transform hover:scale-105"
                        onClick={() => handlePredict(1)}
                    >
                        📈 Predict Up
                    </button>
                    <button
                        disabled={hasPredicted || isPredicting}
                        className="bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 disabled:bg-gray-500 text-white py-4 px-10 rounded-xl text-2xl font-bold shadow-lg transition-transform transform hover:scale-105"
                        onClick={() => handlePredict(2)}
                    >
                        📉 Predict Down
                    </button>
                </div>
            </div>
        </section>
    )
}
