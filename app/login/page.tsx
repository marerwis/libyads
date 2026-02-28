"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Inter } from "next/font/google";
import { Facebook, LogOut, CheckCircle, Smartphone, Globe, Shield, Activity } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export default function LoginPage() {
    const router = useRouter();
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (isLogin) {
            // Login with NextAuth
            const res = await signIn("credentials", {
                redirect: false,
                email: formData.email,
                password: formData.password,
            });

            if (res?.error) {
                setError("Invalid email or password");
                setLoading(false);
            } else {
                router.push("/dashboard");
                router.refresh();
            }
        } else {
            // Register via our API
            try {
                const res = await fetch("/api/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData),
                });

                const data = await res.json();

                if (!res.ok) {
                    setError(data.message || "Registration failed");
                    setLoading(false);
                    return;
                }

                // Auto login after registration
                await signIn("credentials", {
                    redirect: false,
                    email: formData.email,
                    password: formData.password,
                });

                router.push("/dashboard");
                router.refresh();
            } catch (err) {
                setError("An error occurred. Please try again.");
                setLoading(false);
            }
        }
    };

    return (
        <div className={`min-h-screen bg-[#0B0E14] font-sans text-slate-300 antialiased selection:bg-[#1877F2]/30 selection:text-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[radial-gradient(circle_at_50%_0%,rgba(24,119,242,0.08)_0%,transparent_60%)] ${inter.className}`}>

            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center group">
                <Link href="/" className="inline-flex items-center gap-3 justify-center">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden shrink-0 border border-white/10 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                        <img src="/brand-logo.jpg" alt="Libya Ads Logo" className="w-full h-full object-cover" />
                    </div>
                    <span className="font-bold text-3xl tracking-tight text-white">Libya <span className="text-[#1877F2]">Ads</span></span>
                </Link>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight">
                    {isLogin ? "Sign in to your account" : "Create your account"}
                </h2>
                <p className="mt-2 text-center text-sm text-slate-400">
                    Or{" "}
                    <button
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setError("");
                        }}
                        className="font-medium text-[#1877F2] hover:text-blue-400 transition-colors"
                    >
                        {isLogin ? "start your free trial today" : "sign in to your existing account"}
                    </button>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-[#151921] py-8 px-4 shadow-[0_0_0_1px_rgba(255,255,255,0.05),_0_20px_40px_-10px_rgba(0,0,0,0.5)] sm:rounded-2xl sm:px-10 border border-[#2A303C]">

                    <div className="mb-6">
                        <button
                            type="button"
                            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                            className="w-full flex justify-center items-center py-3 px-4 border border-[#2A303C] rounded-xl shadow-sm text-sm font-bold text-white bg-[#0B0E14] hover:bg-white/5 focus:outline-none transition-all"
                        >
                            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Continue with Google
                        </button>
                    </div>

                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-[#2A303C]"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-[#151921] text-slate-500">Or continue with</span>
                        </div>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-lg text-center">
                                {error}
                            </div>
                        )}

                        {!isLogin && (
                            <div>
                                <label className="block text-sm font-medium text-slate-300">
                                    Full Name
                                </label>
                                <div className="mt-1">
                                    <input
                                        name="name"
                                        type="text"
                                        required={!isLogin}
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="appearance-none block w-full px-3 py-2.5 border border-[#2A303C] rounded-xl shadow-sm bg-[#0B0E14] placeholder-slate-500 text-slate-200 focus:outline-none focus:ring-[#1877F2] focus:border-[#1877F2] sm:text-sm transition-all focus:ring-2 focus:ring-opacity-50"
                                        placeholder="John Doe"
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-300">
                                Email address
                            </label>
                            <div className="mt-1">
                                <input
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="appearance-none block w-full px-3 py-2.5 border border-[#2A303C] rounded-xl shadow-sm bg-[#0B0E14] placeholder-slate-500 text-slate-200 focus:outline-none focus:ring-[#1877F2] focus:border-[#1877F2] sm:text-sm transition-all focus:ring-2 focus:ring-opacity-50"
                                    placeholder="name@company.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300">
                                Password
                            </label>
                            <div className="mt-1">
                                <input
                                    name="password"
                                    type="password"
                                    autoComplete={isLogin ? "current-password" : "new-password"}
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="appearance-none block w-full px-3 py-2.5 border border-[#2A303C] rounded-xl shadow-sm bg-[#0B0E14] placeholder-slate-500 text-slate-200 focus:outline-none focus:ring-[#1877F2] focus:border-[#1877F2] sm:text-sm transition-all focus:ring-2 focus:ring-opacity-50"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {isLogin && (
                            <div className="flex items-center justify-end">
                                <div className="text-sm">
                                    <a href="#" className="font-medium text-[#1877F2] hover:text-blue-400 transition-colors">
                                        Forgot your password?
                                    </a>
                                </div>
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-[#1877F2]/20 text-sm font-bold text-white bg-[#1877F2] hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1877F2] focus:ring-offset-[#0B0E14] disabled:opacity-50 transition-all active:scale-[0.98]"
                            >
                                {loading ? (
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : isLogin ? "Sign in" : "Create Account"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
