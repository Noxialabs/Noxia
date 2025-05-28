"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CookieHelper } from "@/helper/cookie.helper";
import { UserService } from "@/service/user/user.service";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

export default function Navbar() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    // Check if user is authenticated
    const token = CookieHelper.get({ key: "token" });
    setIsAuthenticated(!!token);
  }, []);

  const handleLogout = () => {
    UserService.logout();
    setIsAuthenticated(false);
    router.push("/");
    toast.success("Logged out successfully");
  };

  return (
    <div className="max-w-[1440px] px-4 md:px-10 xl:px-20 mx-auto">
      <div className="flex items-center justify-between py-4">
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
        
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <Link href="/auth/profile">
                <Button variant="outline" className="hidden sm:inline-flex">
                  Profile
                </Button>
              </Link>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="outline">
                  Login
                </Button>
              </Link>
              <Link href="/auth/register" className="hidden sm:block">
                <Button>
                  Register
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
