"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { UserService } from "@/service/user/user.service";
import { CookieHelper } from "@/helper/cookie.helper";
import AppLayout from "@/components/layout/AppLayout";

export default function Dashboard() {
 

  return (
    <AppLayout>
        <div className="max-w-[500px] mx-auto mt-[50px] p-6 bg-card rounded-[12px] shadow-md">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Create an Account</h1>
        <p className="text-muted-foreground mt-2">Join our secure platform</p>
      </div>
    </div>
    </AppLayout>
  );
}
