"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { UserService } from "@/service/user/user.service";
import { CookieHelper } from "@/helper/cookie.helper";

export default function ChangePassword() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const token = CookieHelper.get({ key: "token" });
    if (!token) {
      router.push("/auth/login");
    }
  }, [router]);

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

    // Current password validation
    if (!formData.currentPassword) {
      newErrors.currentPassword = "Current password is required";
      isValid = false;
    }

    // New password validation
    if (!formData.newPassword) {
      newErrors.newPassword = "New password is required";
      isValid = false;
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters long";
      isValid = false;
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.newPassword)) {
      newErrors.newPassword = "Password must contain at least one uppercase letter, one lowercase letter, and one number";
      isValid = false;
    }

    // Confirm password validation
    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
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
      const response = await UserService.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      if (response.data && !response.data.error) {
        toast.success("Password changed successfully!");
        router.push("/auth/profile");
      } else {
        toast.error(response.data?.message || "Failed to change password. Please try again.");
      }
    } catch (error: any) {
      console.error("Password change error:", error);
      toast.error(error.response?.data?.message || "Failed to change password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-[500px] mx-auto mt-[50px] p-6 bg-card rounded-[12px] shadow-md">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Change Password</h1>
        <p className="text-muted-foreground mt-2">Update your account password</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="currentPassword" className="text-sm font-medium text-foreground">
            Current Password
          </label>
          <Input
            id="currentPassword"
            name="currentPassword"
            type="password"
            value={formData.currentPassword}
            onChange={handleChange}
            placeholder="Enter your current password"
            className={`h-12 ${errors.currentPassword ? "border-destructive" : ""}`}
          />
          {errors.currentPassword && <p className="text-sm text-destructive">{errors.currentPassword}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="newPassword" className="text-sm font-medium text-foreground">
            New Password
          </label>
          <Input
            id="newPassword"
            name="newPassword"
            type="password"
            value={formData.newPassword}
            onChange={handleChange}
            placeholder="Enter your new password"
            className={`h-12 ${errors.newPassword ? "border-destructive" : ""}`}
          />
          {errors.newPassword && <p className="text-sm text-destructive">{errors.newPassword}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
            Confirm New Password
          </label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm your new password"
            className={`h-12 ${errors.confirmPassword ? "border-destructive" : ""}`}
          />
          {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
        </div>

        <div className="flex gap-4 pt-2">
          <Button
            type="submit"
            disabled={isLoading}
            className="flex-1 h-12 text-lg font-medium"
          >
            {isLoading ? "Updating..." : "Change Password"}
          </Button>
          <Link href="/auth/profile">
            <Button variant="outline" className="h-12 px-6">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
