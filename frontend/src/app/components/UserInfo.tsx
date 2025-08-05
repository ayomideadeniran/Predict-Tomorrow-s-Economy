"use client";

interface UserInfoProps {
    address: string | undefined;
    readablePrediction: string;
    readableResult: string;
    isPredicting: boolean;
    isDetermining: boolean;
    predictError: Error | null;
    determineError: Error | null;
}

export default function UserInfo({ address, readablePrediction, readableResult, isPredicting, isDetermining, predictError, determineError }: UserInfoProps) {

    return (
        <section className="w-full max-w-2xl mt-16 mb-12 px-4 animate-fade-in">
            <div className="bg-gradient-to-br from-gray-900/90 to-purple-900/80 rounded-3xl shadow-2xl p-10 flex flex-col items-center">
                <div className="mb-6 w-full flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="mb-2 md:mb-0 text-center md:text-left">
                        <span className="text-lg text-gray-400">Connected as:</span>
                        <span className="ml-2 font-bold text-indigo-300 break-all">{address}</span>
                    </div>
                    <div className="text-center">
                        <span className="text-lg text-gray-400">Your Prediction:</span>
                        <span className="ml-2 font-bold text-green-300">{readablePrediction}</span>
                    </div>
                    <div className="text-center">
                        <span className="text-lg text-gray-400">Result:</span>
                        <span className="ml-2 font-bold text-yellow-300">{readableResult}</span>
                    </div>
                </div>
                {(isPredicting || isDetermining) && (
                    <p className="text-yellow-400 mt-2 animate-pulse">Transaction pending...</p>
                )}
                {predictError && (
                    <p className="text-red-400 mt-2">Prediction Error: {predictError.message}</p>
                )}
                {determineError && (
                    <p className="text-red-400 mt-2">Determination Error: {determineError.message}</p>
                )}
            </div>
        </section>
    )
}
