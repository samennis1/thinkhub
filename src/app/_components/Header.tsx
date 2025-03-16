"use client";

import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

const Header: React.FC = () => {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut({ callbackUrl: "/" });
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <header className="bg-blue-600 px-6 py-4 text-white shadow-md">
      <div className="flex items-center justify-between">
        <h1
          className="cursor-pointer text-2xl font-bold"
          onClick={() => router.push("/")}
        >
          ThinkHub
        </h1>
        <button
          onClick={handleSignOut}
          className="rounded bg-red-500 px-4 py-2 font-semibold hover:bg-red-600"
        >
          Sign Out
        </button>
      </div>
    </header>
  );
};

export default Header;
