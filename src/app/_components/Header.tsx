"use client";  // ✅ Add this at the top

import { useRouter } from "next/navigation";

const Header: React.FC = () => {
  const router = useRouter();

  return (
    <header className="bg-blue-600 text-white py-4 px-6 shadow-md">
      <div className="flex justify-between items-center">
        <h1
          className="text-2xl font-bold cursor-pointer"
          onClick={() => router.push("/")}
        >
          ThinkHub
        </h1>
      </div>
    </header>
  );
};

export default Header;
