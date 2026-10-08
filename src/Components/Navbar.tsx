
"use client";

import { useSession, signIn, signOut } from "next-auth/react";

export default function Navbar() {
    const { data: session } = useSession();

    return (
        <nav className="bg-white shadow-sm p-4 flex justify-between items-center px-8 sticky top-0 z-50">
            <h1 className="text-2xl font-black text-red-600 tracking-tighter">⚡ FlashCart</h1>
            <div>
                {session ? (
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-gray-600 hidden md:block">
                            Hi, {session.user?.name}
                        </span>
                        <button
                            onClick={() => signOut()}
                            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md font-semibold hover:bg-gray-200"
                        >
                            Logout
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => signIn("google")}
                        className="bg-black text-white px-5 py-2 rounded-md font-semibold hover:bg-gray-800"
                    >
                        Login
                    </button>
                )}
            </div>
        </nav>
    );
}