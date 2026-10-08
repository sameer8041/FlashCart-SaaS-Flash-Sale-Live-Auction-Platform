"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";

export default function Home() {
  // useSession se hume user ka data aur login status milta hai
  const { data: session, status } = useSession();

  // Jab tak NextAuth check kar raha hai ki token hai ya nahi
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-lg animate-pulse text-gray-500">Checking Authentication...</p>
      </div>
    );
  }

  // Agar user logged in HAI
  if (session && session.user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-xl shadow-md text-center max-w-sm w-full">
          {session.user.image && (
            <Image
              src={session.user.image}
              alt="Profile Picture"
              width={80}
              height={80}
              className="rounded-full mx-auto mb-4 border-2 border-blue-500"
            />
          )}
          <h1 className="text-2xl font-bold text-gray-800">Welcome back!</h1>
          <p className="text-gray-600 mt-2 font-medium">{session.user.name}</p>
          <p className="text-gray-400 text-sm mb-6">{session.user.email}</p>

          <button
            onClick={() => signOut()}
            className="w-full bg-red-50 text-red-600 hover:bg-red-100 font-semibold py-2 px-4 rounded-lg transition-colors border border-red-200"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  // Agar user logged in NAHI hai
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">FlashCart SaaS</h1>
        <p className="text-gray-600 mb-8">
          High-Concurrency Flash Sale Platform for 1000+ simultaneous users.
        </p>
        <button
          onClick={() => signIn("google")}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-lg hover:shadow-xl w-full flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5 bg-white rounded-full p-0.5 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" /></svg>
          Login with Google
        </button>
      </div>
    </div>
  );
}