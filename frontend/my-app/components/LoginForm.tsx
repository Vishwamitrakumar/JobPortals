"use client";

import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Toaster, toast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import { useGoogleLogin } from "@react-oauth/google";
type LoginFormProps = {
    setIsSignup: React.Dispatch<React.SetStateAction<boolean>>;
};


export default function LoginForm({
    setIsSignup,
}: LoginFormProps) {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const showLoginToast = (type: "success" | "error", title: string, message: string) => {
        toast.add({
            type,
            title,
            description: message,
        });
    };

    const API = process.env.NEXT_PUBLIC_API;
    

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await fetch(`${API}/api/login/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username: username,
                    password: password,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem("access", data.access);
                localStorage.setItem("refresh", data.refresh);

                if (data.user) {
                    localStorage.setItem("user", JSON.stringify(data.user));
                }

                showLoginToast("success", "Success", "Login Successful");
                router.push("/main/dashboard");
            } else {
                showLoginToast("error", "Error", data.detail || "Invalid Username or Password");
            }
        } catch (error) {
            console.error(error);
            showLoginToast("error", "Error", "Server Error");
        }
    };


    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            console.log("Google Login Success:", tokenResponse);

            try {
                const response = await fetch(`${API}/api/google-login/`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        access_token: tokenResponse.access_token,
                    }),
                });

                const data = await response.json();

                console.log("Google API Response:", data);

                if (response.ok) {
                    localStorage.setItem("access", data.access);
                    localStorage.setItem("refresh", data.refresh);

                    if (data.user) {
                        localStorage.setItem(
                            "user",
                            JSON.stringify(data.user)
                        );
                    }

                    showLoginToast(
                        "success",
                        "Success",
                        "Google Login Successful"
                    );

                    router.push("/main/dashboard");
                } else {
                    showLoginToast(
                        "error",
                        "Error",
                        data.error || "Google Login Failed"
                    );
                }
            } catch (error) {
                console.error("Google Login Error:", error);

                showLoginToast(
                    "error",
                    "Error",
                    "Server Error"
                );
            }
        },

        onError: () => {
            showLoginToast(
                "error",
                "Error",
                "Google Login Failed"
            );
        },
    });




    return (
        <>
            <Card className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 p-8 sm:p-10 w-full max-w-md mx-auto">
                <h2 className="text-2xl font-bold text-center text-[#1A2333]">
                    Candidate Login
                </h2>
                <p className="text-center mt-2 text-sm text-slate-500">
                    Enter your credentials to access your account
                </p>

                <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
                    {/* Email */}
                    <div>
                        <Label
                            htmlFor="email"
                            className="block text-sm font-semibold text-[#1A2333] mb-2"
                        >
                            User Name
                        </Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter your username"
                                className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#2F6FE0]/40"
                                required
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <Label
                            htmlFor="password"
                            className="block text-sm font-semibold text-[#1A2333] mb-2"
                        >
                            Password
                        </Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                className="w-full pl-10 pr-10 py-3 rounded-lg border border-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2F6FE0]/40 focus:border-[#2F6FE0] transition"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((v) => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? (
                                    <EyeOff className="w-4 h-4" />
                                ) : (
                                    <Eye className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Remember me / Forgot password */}
                    <div className="flex items-center justify-between text-sm">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <Checkbox
                                checked={rememberMe}
                                onCheckedChange={(checked) => setRememberMe(Boolean(checked))}
                                className="w-4 h-4 rounded accent-[#2F6FE0] cursor-pointer"
                            />
                            <span className="text-slate-600">Remember me</span>
                        </label>
                        <a href="/forgot-password" className="text-[#2F6FE0] font-medium hover:underline">
                            Forgot Password?
                        </a>
                    </div>

                    {/* Submit */}
                    <Button
                        type="submit"
                        className="w-full flex items-center justify-center gap-2 bg-[#2F6FE0] hover:bg-[#265ec2] text-white font-semibold py-3 rounded-lg transition"
                    >
                        <User className="w-4 h-4" />
                        Login
                    </Button>

                    {/* Divider */}
                    <div className="flex items-center gap-3">
                        <div className="h-px flex-1 bg-slate-200" />
                        <span className="text-xs text-slate-400">or</span>
                        <div className="h-px flex-1 bg-slate-200" />
                    </div>

                    {/* Google login */}
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => googleLogin()}
                        className="w-full flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 text-[#1A2333] font-semibold py-3 rounded-lg transition"
                    >
                        <GoogleIcon />
                        Login with Google
                    </Button>
                </form>

                <p className="mt-6 text-sm text-center text-slate-500">
                    Don't have an account?{" "}
                    <button
                        type="button"
                        onClick={() => setIsSignup(true)}
                        className="text-[#2F6FE0] font-medium hover:underline"
                    >
                        Register Now
                    </button>
                </p>
            </Card>
            <Toaster />
        </>
    );
}

function GoogleIcon() {
    return (
        <svg className="w-4 h-4" viewBox="0 0 48 48">
            <path
                fill="#FFC107"
                d="M43.6 20.5H42V20H24v8h11.3C33.8 32.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.1 8 3l5.7-5.7C34.6 6 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z"
            />
            <path
                fill="#FF3D00"
                d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.1 8 3l5.7-5.7C34.6 6 29.6 4 24 4c-7.7 0-14.4 4.3-17.7 10.7z"
            />
            <path
                fill="#4CAF50"
                d="M24 44c5.5 0 10.4-1.9 14.3-5.1l-6.6-5.4C29.6 35.3 26.9 36 24 36c-5.3 0-9.7-3.4-11.3-8.1l-6.6 5.1C9.5 39.6 16.2 44 24 44z"
            />
            <path
                fill="#1976D2"
                d="M43.6 20.5H42V20H24v8h11.3c-.9 2.5-2.5 4.6-4.6 6l6.6 5.4C39.3 37.6 44 31.5 44 24c0-1.2-.1-2.4-.4-3.5z"
            />
        </svg>
    );
}