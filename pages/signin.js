import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { ShieldCheck, Loader2, ArrowLeft, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function SignIn() {
    const router = useRouter();

    // Form state
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("Public User");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Role-based routing helper with query support
    const routeUserByRole = (selectedRole) => {
        const { redirect } = router.query;

        if (selectedRole === "Public User" && redirect === "/intake") {
            setError("Emergency Intake is restricted to authorized Police and Hospital personnel.");
            setLoading(false);
            // Clear metadata and sign out to avoid leaving them logged in with inconsistent route state
            supabase.auth.signOut().then(() => {
                localStorage.removeItem("identybridge_role");
                localStorage.removeItem("identybridge_fullname");
            });
            setTimeout(() => {
                router.push("/");
            }, 3000);
            return;
        }

        if (redirect) {
            router.push(redirect);
        } else if (selectedRole === "Police" || selectedRole === "Hospital") {
            router.push("/intake");
        } else {
            router.push("/report-missing");
        }
    };

    // Monitor session change and handle OAuth callbacks
    useEffect(() => {
        if (!supabase) return;

        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                const storedRole = localStorage.getItem("identybridge_role") || "Public User";
                routeUserByRole(storedRole);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === "SIGNED_IN" && session) {
                const storedRole = localStorage.getItem("identybridge_role") || "Public User";
                routeUserByRole(storedRole);
            }
        });

        return () => subscription.unsubscribe();
    }, [router.isReady, router.query]);

    const saveRoleMetadata = () => {
        localStorage.setItem("identybridge_role", role);
        localStorage.setItem("identybridge_fullname", fullName);
    };

    const handleGoogleSignIn = async () => {
        if (loading) return;
        setLoading(true);
        setError(null);
        saveRoleMetadata();

        try {
            if (!supabase) {
                throw new Error(
                    "Supabase has not been properly initialized. Please verify your environment variables."
                );
            }

            const { error: authError } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: typeof window !== "undefined" ? `${window.location.origin}/signin` : undefined,
                },
            });

            if (authError) throw authError;
        } catch (err) {
            console.error("Google sign in failed:", err);
            setError(err?.message || "Google authentication failed. Please configure Supabase OAuth.");
            setLoading(false);
        }
    };

    const handleEmailSignIn = async (e) => {
        e.preventDefault();
        if (loading) return;
        setLoading(true);
        setError(null);
        saveRoleMetadata();

        try {
            if (!supabase) {
                throw new Error(
                    "Supabase has not been properly initialized. Please verify your environment variables."
                );
            }

            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) throw authError;

            // Force immediate redirect based on selection
            routeUserByRole(role);
        } catch (err) {
            console.error("Email sign in failed:", err);
            setError(err?.message || "Authentication failed. Please verify credentials.");
            setLoading(false);
        }
    };


    return (
        <>
            <Head>
                <title>Sign In - IdentyBridge</title>
                <meta
                    name="description"
                    content="Access the Secure Identity Response Network and sign in to continue."
                />
            </Head>

            <main className="min-h-screen bg-gradient-to-br from-[#081B32] via-[#0B1F3A] to-[#123B66] flex flex-col justify-center py-12 px-6 lg:px-8 relative font-sans overflow-hidden">

                {/* Glow Effects */}
                <div className="absolute top-1/4 left-1/4 h-[350px] w-[350px] rounded-full bg-[#14B8A6]/10 blur-[120px] pointer-events-none" />
                <div className="absolute bottom-1/4 right-1/4 h-[350px] w-[350px] rounded-full bg-[#1D5D8F]/15 blur-[120px] pointer-events-none" />

                {/* Back Link */}
                <div className="absolute top-6 left-6 z-10">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white font-medium transition"
                    >
                        <ArrowLeft size={16} />
                        Back to Home
                    </Link>
                </div>

                <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center z-10">
                    {/* IdentyBridge Header */}
                    <div className="flex items-center gap-3 justify-center mb-6">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white shadow-lg ring-1 ring-white/20 backdrop-blur-md">
                            <ShieldCheck size={23} className="text-[#14B8A6]" />
                        </div>
                        <div className="text-left">
                            <p className="text-xl font-bold tracking-tight text-white leading-tight m-0">
                                IdentyBridge
                            </p>
                            <p className="text-[9px] uppercase tracking-[0.2em] font-semibold text-white/50 m-0">
                                Identity Response
                            </p>
                        </div>
                    </div>

                    <h2 className="text-center text-lg uppercase tracking-[0.1em] font-semibold text-[#7DE3D8] m-0">
                        Secure Identity Response Network
                    </h2>
                </div>

                <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
                    <div className="bg-white/95 backdrop-blur-md py-8 px-6 shadow-2xl border border-white/10 rounded-2xl sm:px-10">

                        <div className="text-center mb-6">
                            <h3 className="text-xl font-bold text-[#0B1F3A]">Welcome back</h3>
                            <p className="text-xs text-[#526274] mt-1">Sign in to continue</p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div
                                className="mb-5 flex items-start gap-3 p-4 bg-red-50 border border-red-200 text-[#C62828] rounded-md text-sm"
                                role="alert"
                            >
                                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold">Authentication failed</p>
                                    <p className="mt-1 text-xs text-[#526274] leading-relaxed">{error}</p>
                                </div>
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleEmailSignIn} className="space-y-4">

                            <div>
                                <label
                                    htmlFor="fullName"
                                    className="block text-xs font-bold text-[#526274] mb-1.5 uppercase tracking-wider"
                                >
                                    Full Name
                                </label>
                                <input
                                    id="fullName"
                                    name="fullName"
                                    type="text"
                                    required
                                    disabled={loading}
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Officer Jane Doe"
                                    className="block w-full focus-visible:outline-[#0F766E] rounded-md border-[#E8EEF5] text-sm focus:border-[#1D5D8F] focus:ring-1 focus:ring-[#1D5D8F] disabled:bg-[#F4F7FA] disabled:text-[#7A8796]"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="email"
                                    className="block text-xs font-bold text-[#526274] mb-1.5 uppercase tracking-wider"
                                >
                                    Gmail / Email
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    disabled={loading}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@agency.gov"
                                    className="block w-full focus-visible:outline-[#0F766E] rounded-md border-[#E8EEF5] text-sm focus:border-[#1D5D8F] focus:ring-1 focus:ring-[#1D5D8F] disabled:bg-[#F4F7FA] disabled:text-[#7A8796]"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="password"
                                    className="block text-xs font-bold text-[#526274] mb-1.5 uppercase tracking-wider"
                                >
                                    Password
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    disabled={loading}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="block w-full focus-visible:outline-[#0F766E] rounded-md border-[#E8EEF5] text-sm focus:border-[#1D5D8F] focus:ring-1 focus:ring-[#1D5D8F] disabled:bg-[#F4F7FA] disabled:text-[#7A8796]"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="role"
                                    className="block text-xs font-bold text-[#526274] mb-1.5 uppercase tracking-wider"
                                >
                                    Role
                                </label>
                                <select
                                    id="role"
                                    name="role"
                                    disabled={loading}
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="block w-full focus-visible:outline-[#0F766E] rounded-md border-[#E8EEF5] text-sm bg-white focus:border-[#1D5D8F] focus:ring-1 focus:ring-[#1D5D8F] disabled:bg-[#F4F7FA] disabled:text-[#7A8796] cursor-pointer"
                                >
                                    <option value="Public User">Public User</option>
                                    <option value="Police">Police</option>
                                    <option value="Hospital">Hospital</option>
                                </select>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="button"
                                    onClick={handleGoogleSignIn}
                                    disabled={loading}
                                    className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-[#E8EEF5] rounded-md shadow-sm bg-white text-sm font-semibold text-[#172033] hover:bg-[#F4F7FA] transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F766E] cursor-pointer"
                                >
                                    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                                        <g transform="matrix(1, 0, 0, 1, 0, 0)">
                                            <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.58h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.4C21.68,11.83 21.57,11.43 21.35,11.1z" fill="#4285F4" />
                                            <path d="M12,20.6c2.43,0 4.47,-0.8 5.96,-2.2l-3.3,-2.58c-0.9,-0.6 -2.07,-0.97 -3.3,-0.97 -2.35,0 -4.33,-1.58 -5.04,-3.7H2.88v2.66C4.38,16.73 7.97,20.6 12,20.6z" fill="#34A853" />
                                            <path d="M6.96,11.15c-0.18,-0.55 -0.28,-1.13 -0.28,-1.74s0.1,-1.19 0.28,-1.74V4.99H2.88C2.3,6.15 2,7.45 2,8.81S2.3,11.47 2.88,12.63L6.96,11.15z" fill="#FBBC05" />
                                            <path d="M12,4.99c1.32,0 2.5,0.45 3.44,1.35l2.58,-2.58C16.46,2.38 14.43,1.6 12,1.6c-4.03,0 -7.62,3.87 -9.12,6.21L6.96,8.47C7.67,6.35 9.65,4.99 12,4.99z" fill="#EA4335" />
                                        </g>
                                    </svg>
                                    Continue with Google
                                </button>
                            </div>

                            <div className="relative my-4">
                                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                    <div className="w-full border-t border-[#E8EEF5]"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="bg-white px-3 text-xs uppercase tracking-wider text-[#7A8796] font-semibold">
                                        or
                                    </span>
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-md border border-[#0B1F3A] bg-[#123B66] text-white hover:bg-[#0B1F3A] text-sm font-bold shadow-sm transition disabled:bg-[#E8EEF5] disabled:text-[#7A8796] disabled:border-[#E8EEF5] disabled:cursor-not-allowed cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F766E]"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Signing In...
                                        </>
                                    ) : (
                                        "Sign In"
                                    )}
                                </button>
                            </div>

                        </form>

                    </div>
                </div>

            </main>
        </>
    );
}
