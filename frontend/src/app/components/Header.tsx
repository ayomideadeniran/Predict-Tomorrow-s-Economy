"use client";

interface HeaderProps {
    readableTotalUp: string;
    readableTotalDown: string;
}

export default function Header({ readableTotalUp, readableTotalDown }: HeaderProps) {

    return (
        <section className="w-full py-20 px-4 flex flex-col items-center bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-900 shadow-2xl rounded-b-3xl">
            <h1 className="text-6xl font-extrabold mb-6 tracking-tight text-white drop-shadow-xl text-center animate-fade-in">Predict Tomorrow's Economy</h1>
            <p className="text-2xl text-gray-200 mb-10 text-center max-w-2xl animate-fade-in">Will the global economy rise or fall tomorrow? Stake your prediction and see if you can outsmart the market!</p>
            <div className="flex flex-col md:flex-row gap-10 w-full max-w-4xl justify-center items-center animate-fade-in">
                <div className="bg-gradient-to-br from-green-400/90 to-green-900/90 rounded-3xl shadow-2xl p-10 flex-1 text-center hover:scale-105 transition-transform">
                    <h2 className="text-3xl font-bold mb-4">Total Up Stake</h2>
                    <p className="text-4xl font-mono font-extrabold tracking-widest text-white animate-pulse">{readableTotalUp}</p>
                </div>
                <div className="bg-gradient-to-br from-red-400/90 to-red-900/90 rounded-3xl shadow-2xl p-10 flex-1 text-center hover:scale-105 transition-transform">
                    <h2 className="text-3xl font-bold mb-4">Total Down Stake</h2>
                    <p className="text-4xl font-mono font-extrabold tracking-widest text-white animate-pulse">{readableTotalDown}</p>
                </div>
            </div>
        </section>
    )
}
