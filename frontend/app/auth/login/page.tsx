"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { UserService } from "@/service/user/user.service";
import { CookieHelper } from "@/helper/cookie.helper";

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({
    email: "",
    password: "",
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
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
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
      const response = await UserService.login({
        email: formData.email,
        password: formData.password,
      });

      if (response.data && !response.data.error) {
        // Store token in cookie
        const token = response.data.token || response.data.data?.token;
        if (token) {
          CookieHelper.set({ key: "token", value: token });
          toast.success("Login successful!");
          router.push("/auth/profile");
        } else {
          toast.error("Authentication failed. No token received.");
        }
      } else {
        toast.error(response.data?.message || "Login failed. Please check your credentials.");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.response?.data?.message || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-[500px] mx-auto mt-[50px] p-6 bg-card rounded-[12px] shadow-md">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Welcome Back</h1>
        <p className="text-muted-foreground mt-2">Log in to your account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Email Address
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
            Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            className={`h-12 ${errors.password ? "border-destructive" : ""}`}
          />
          {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 text-lg font-medium"
        >
          {isLoading ? "Logging in..." : "Log In"}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-muted-foreground">
          Don't have an account?{" "}
          <Link href="/auth/register" className="text-primary font-medium hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
