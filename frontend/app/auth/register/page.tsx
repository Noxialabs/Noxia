"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { UserService } from "@/service/user/user.service";
import { CookieHelper } from "@/helper/cookie.helper";

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    ethAddress: "",
  });
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    ethAddress: "",
  });
  const [isLoading, setIsLoading] = useState(false);

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

    // Email validation
    if (!formData.email) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please provide a valid email address";
      isValid = false;
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long";
      isValid = false;
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = "Password must contain at least one uppercase letter, one lowercase letter, and one number";
      isValid = false;
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      isValid = false;
    }

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
      const response = await UserService.register({
        email: formData.email,
        password: formData.password,
        ...(formData.ethAddress && { ethAddress: formData.ethAddress }),
      });

      if (response.data && !response.data.error) {
        toast.success("Registration successful! Please log in.");
        router.push("/auth/login");
      } else {
        toast.error(response.data?.message || "Registration failed. Please try again.");
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      toast.error(error.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-[500px] mx-auto mt-[50px] p-6 bg-card rounded-[12px] shadow-md">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Create an Account</h1>
        <p className="text-muted-foreground mt-2">Join our secure platform</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Email Address *
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
            className={`h-12 ${errors.email ? "border-destructive" : ""}`}
          />
          {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-foreground">
            Password *
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Create a password"
            className={`h-12 ${errors.password ? "border-destructive" : ""}`}
          />
          {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
            Confirm Password *
          </label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm your password"
            className={`h-12 ${errors.confirmPassword ? "border-destructive" : ""}`}
          />
          {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
        </div>

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
          className="w-full h-12 text-lg font-medium"
        >
          {isLoading ? "Creating Account..." : "Register"}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-muted-foreground">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-primary font-medium hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
