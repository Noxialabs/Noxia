"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { UserService } from "@/service/user/user.service";
import { useUser } from "@/hooks/useUser";
import { CookieHelper } from "@/helper/cookie.helper";

export default function Profile() {
  const router = useRouter();
  const { user, loading, error, refetch } = useUser();
  const [formData, setFormData] = useState({
    ethAddress: "",
  });
  const [errors, setErrors] = useState({
    ethAddress: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const token = CookieHelper.get({ key: "token" });
    if (!token) {
      router.push("/auth/login");
      return;
    }

    // Set form data when user data is loaded
    if (user) {
      setFormData({
        ethAddress: user.ethAddress || "",
      });
    }
  }, [user, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error when user types
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = { ...errors };

    // Ethereum address validation (optional)
    if (formData.ethAddress && !/^0x[a-fA-F0-9]{40}$/.test(formData.ethAddress)) {
      newErrors.ethAddress = "Invalid Ethereum address format";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await UserService.updateProfile({
        ethAddress: formData.ethAddress || undefined,
      });

      if (response.data && !response.data.error) {
        toast.success("Profile updated successfully!");
        refetch(); // Refresh user data
      } else {
        toast.error(response.data?.message || "Failed to update profile. Please try again.");
      }
    } catch (error: any) {
      console.error("Profile update error:", error);
      toast.error(error.response?.data?.message || "Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    UserService.logout();
    router.push("/auth/login");
    toast.success("Logged out successfully");
  };

  if (loading) {
    return (
      <div className="max-w-[800px] mx-auto mt-[50px] p-6 bg-card rounded-[12px] shadow-md">
        <div className="text-center">
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-[800px] mx-auto mt-[50px] p-6 bg-card rounded-[12px] shadow-md">
        <div className="text-center">
          <p className="text-destructive">Error loading profile. Please try again later.</p>
          <Button onClick={() => router.push("/auth/login")} className="mt-4">
            Back to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[800px] mx-auto mt-[50px] p-6 bg-card rounded-[12px] shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Your Profile</h1>
        <div className="flex gap-4">
          <Link href="/auth/change-password">
            <Button variant="outline">Change Password</Button>
          </Link>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>

      <div className="mb-6 p-4 bg-muted rounded-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{user?.email}</p>
          </div>
          {user?.createdAt && (
            <div>
              <p className="text-sm text-muted-foreground">Member Since</p>
              <p className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="ethAddress" className="text-sm font-medium text-foreground">
            Ethereum Address (Optional)
          </label>
          <Input
            id="ethAddress"
            name="ethAddress"
            type="text"
            value={formData.ethAddress}
            onChange={handleChange}
            placeholder="0x..."
            className={`h-12 ${errors.ethAddress ? "border-destructive" : ""}`}
          />
          {errors.ethAddress && <p className="text-sm text-destructive">{errors.ethAddress}</p>}
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="h-12 px-6 text-lg font-medium"
        >
          {isLoading ? "Updating..." : "Update Profile"}
        </Button>
      </form>
    </div>
  );
}
