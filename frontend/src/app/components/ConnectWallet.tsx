"use client";
import { useConnect } from "@starknet-react/core";

export default function ConnectWallet() {
    const { connect, connectors } = useConnect();

    return (
        <section className="flex flex-col items-center justify-center min-h-screen w-full bg-gradient-to-br from-indigo-900 via-purple-900 to-black animate-fade-in">
            <h1 className="text-5xl font-bold mb-10 text-white">Welcome to Predict Tomorrow's Economy</h1>
            {connectors.map((connector) => (
                <button
                    key={connector.id}
                    onClick={() => connect({ connector })}
                    className="bg-blue-600 text-white px-10 py-5 rounded-xl mb-4 hover:opacity-80 transition-opacity text-2xl font-semibold shadow-lg"
                >
                    Connect {connector.name}
                </button>
            ))}
        </section>
    )
}
