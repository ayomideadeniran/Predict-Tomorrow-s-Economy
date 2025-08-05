"use client";

interface OwnerControlsProps {
    isDetermining: boolean;
    handleDetermine: (choice: number) => void;
}

export default function OwnerControls({ isDetermining, handleDetermine }: OwnerControlsProps) {

    return (
        <section className="w-full max-w-xl px-4 mb-16 animate-fade-in">
            <div className="bg-gradient-to-br from-blue-800/90 to-purple-900/90 rounded-3xl shadow-2xl p-10 flex flex-col items-center">
                <h2 className="text-3xl font-bold mb-6 text-white">Owner Controls</h2>
                <div className="flex gap-10 w-full justify-center">
                    <button
                        disabled={isDetermining}
                        className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 disabled:bg-gray-500 text-white py-4 px-10 rounded-xl text-2xl font-bold shadow-lg transition-transform transform hover:scale-105"
                        onClick={() => handleDetermine(1)}
                    >
                        Set Result to UP
                    </button>
                    <button
                        disabled={isDetermining}
                        className="bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 disabled:bg-gray-500 text-white py-4 px-10 rounded-xl text-2xl font-bold shadow-lg transition-transform transform hover:scale-105"
                        onClick={() => handleDetermine(2)}
                    >
                        Set Result to DOWN
                    </button>
                </div>
            </div>
        </section>
    )
}
