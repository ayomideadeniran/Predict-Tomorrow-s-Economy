"use client";

export default function Footer() {

    return (
        <footer className="w-full py-8 mt-auto text-center text-gray-400 text-lg bg-gradient-to-r from-indigo-900 via-purple-900 to-black rounded-t-3xl shadow-inner animate-fade-in">
            Powered by Starknet & Next.js | &copy; {new Date().getFullYear()} Predict Tomorrow's Economy
        </footer>
    )
}
