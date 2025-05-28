import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function Navbar() {
  return (
    <div className="max-w-[1440px] px-4 md:px-10 xl:px-20 mx-auto">
      <Link href="/" className="flex items-center justify-start">
        <div className="flex flex-col">
          <div className="w-[110px] mx-auto">
            <Image className="w-full h-full" src="/logoImg.png" alt="Logo" width={300} height={200} />
          </div>
          <div className="w-[140px] mx-auto">
            <Image className="w-full h-full" src="/logo.png" alt="Logo" width={200} height={200} />
          </div>
        </div>
      </Link>
    </div>
  );
}
