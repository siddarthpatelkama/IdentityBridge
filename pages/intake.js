import React, { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import { Shield, Sparkles, FileText, Search, ShieldAlert, CheckCircle2, Info, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import VoiceRecorder from "@/components/VoiceRecorder";
import MatchCard from "@/components/MatchCard";

export default function IntakeDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState(null);

    // Form states
    const [formData, setFormData] = useState({
        age_estimate: "",
        gender: "",
        clothing: "",
        location_found: "",
        injuries: "",
    });

    const [submitting, setSubmitting] = useState(false);
    const [searchStatus, setSearchStatus] = useState("idle"); // 'idle' | 'searching' | 'result' | 'nomatch' | 'error'
    const [matchData, setMatchData] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);
    const [verifiedList, setVerifiedList] = useState({}); // Tracking verified matches locally by ID

    useEffect(() => {
        if (!supabase) {
            setLoading(false);
            return;
        }

        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                router.push("/signin?redirect=/intake");
            } else {
                const storedRole = localStorage.getItem("identybridge_role") || "Public User";
                setRole(storedRole);
                setLoading(false);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session) {
                router.push("/signin?redirect=/intake");
            } else {
                const storedRole = localStorage.getItem("identybridge_role") || "Public User";
                setRole(storedRole);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F4F7FA] flex items-center justify-center font-sans">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-[#14B8A6]" />
                    <p className="text-sm font-semibold text-[#526274]">Verifying credentials...</p>
                </div>
            </div>
        );
    }

    if (role === "Public User") {
        return (
            <main className="min-h-screen bg-gradient-to-br from-[#081B32] via-[#0B1F3A] to-[#123B66] flex flex-col justify-center py-12 px-6 lg:px-8 relative font-sans overflow-hidden">
                <div className="absolute top-1/4 left-1/4 h-[350px] w-[350px] rounded-full bg-[#14B8A6]/10 blur-[120px] pointer-events-none" />
                <div className="absolute bottom-1/4 right-1/4 h-[350px] w-[350px] rounded-full bg-[#1D5D8F]/15 blur-[120px] pointer-events-none" />

                <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 text-center">
                    <div className="bg-white/95 backdrop-blur-md py-8 px-6 shadow-2xl border border-white/10 rounded-2xl sm:px-10">
                        <div className="flex justify-center mb-4 text-[#EA4335]">
                            <ShieldAlert className="w-14 h-14" />
                        </div>
                        <h2 className="text-xl font-bold text-[#0B1F3A]">Restricted Access</h2>
                        <p className="mt-3 text-sm text-[#526274] leading-relaxed font-semibold">
                            Emergency Intake is available only to authorized Police and Hospital personnel.
                        </p>
                        <div className="mt-6">
                            <Link
                                href="/"
                                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-md border border-[#0B1F3A] bg-[#123B66] text-white hover:bg-[#0B1F3A] text-sm font-bold shadow-sm transition cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F766E]"
                            >
                                Return to Home
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        );
    }


    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // 1. Voice Intake outcome handler
    const handleVoiceResult = (data) => {
        // If backend returns match details, populate results area
        if (data && (data.match || data.matchData || data.id || data.confidence)) {
            // Map potential response formats flexibly
            const extractedMatch = data.match || data.matchData || data;
            setMatchData(extractedMatch);
            setSearchStatus("result");
        } else {
            setMatchData(null);
            setSearchStatus("nomatch");
        }
    };

    // 2. Manual form submission handler
    const handleManualSubmit = async (e) => {
        e.preventDefault();
        if (submitting) return;

        setSubmitting(true);
        setSearchStatus("searching");
        setErrorMessage(null);
        setMatchData(null);

        // Parse age_estimate safely as integer or null
        const payload = {
            ...formData,
            age_estimate: formData.age_estimate ? parseInt(formData.age_estimate, 10) : null,
        };

        try {
            const response = await fetch("/api/intake/text", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`Intake submission failed: ${response.status} ${response.statusText}`);
            }

            let data;
            try {
                data = await response.json();
            } catch (jsonErr) {
                throw new Error("Unable to read search records from server.");
            }

            // Check if a match is returned
            if (data && (data.match || data.matchData || data.id || data.confidence)) {
                const extractedMatch = data.match || data.matchData || data;
                setMatchData(extractedMatch);
                setSearchStatus("result");
            } else {
                setMatchData(null);
                setSearchStatus("nomatch");
            }
        } catch (err) {
            console.error("Text intake match search failure:", err);
            setErrorMessage(err.message || "Failed to process search. Verify network connections.");
            setSearchStatus("error");
        } finally {
            setSubmitting(false);
        }
    };

    // 3. Match Card verify success callback handler
    const handleVerified = (responseData) => {
        if (matchData) {
            const displayId = matchData.id || matchData.reportId || matchData.matchId || "active";
            setVerifiedList((prev) => ({
                ...prev,
                [displayId]: true,
            }));
        }
    };

    const activeMatchId = matchData ? (matchData.id || matchData.reportId || matchData.matchId || "active") : null;
    const isCurrentlyVerified = activeMatchId ? !!verifiedList[activeMatchId] : false;

    return (
        <div className="min-h-screen bg-bg-main font-sans text-text-primary pb-16">
            <Head>
                <title>Intake Dashboard - IdentyBridge</title>
                <meta name="description" content="Secure portal to record unidentified emergency patient info and search database records." />
            </Head>

            {/* HEADER SECTION */}
            <header className="bg-primary-navy text-white shadow-subtle border-b border-[#123B66]">
                <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-bold tracking-tight text-white m-0">IdentyBridge</h1>
                        <span className="h-4 w-px bg-primary-trust opacity-40 hidden sm:inline"></span>
                        <span className="text-sm font-semibold text-bg-subtle hidden sm:inline">
                            Police & Hospital Intake
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={async () => {
                                if (supabase) {
                                    await supabase.auth.signOut();
                                    localStorage.removeItem("identybridge_role");
                                    localStorage.removeItem("identybridge_fullname");
                                    router.push("/");
                                }
                            }}
                            className="rounded-md border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-white/15 cursor-pointer"
                        >
                            Logout
                        </button>
                        <span className="badge-secure bg-[#123B66] text-[#14B8A6] border border-[#1D5D8F] flex items-center gap-1.5 px-3 py-1 font-semibold text-xs rounded-full">
                            <Shield className="w-3.5 h-3.5 fill-[#14B8A6]/10" aria-hidden="true" />
                            Secure Intake
                        </span>
                    </div>
                </div>
            </header>

            {/* DASHBOARD BODY */}
            <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">

                {/* PAGE INTRODUCTION */}
                <section className="mb-8" aria-label="Introduction">
                    <h2 className="text-2xl md:text-3xl font-bold text-primary-navy tracking-tight">
                        Unidentified Patient Intake
                    </h2>
                    <p className="text-text-secondary mt-1 max-w-2xl text-base">
                        Quickly record patient details using speech recognition intake, or enter attributes manually to match cases against missing-person database records.
                    </p>
                </section>

                {/* WORKSPACE GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* LEFT SIDE: INTAKE CONTROLS */}
                    <div className="lg:col-span-7 space-y-6">

                        {/* VOICE RECORDING SECTION */}
                        <div className="card-secure p-6 bg-white border border-bg-subtle shadow-card rounded-md">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-md font-bold text-primary-navy leading-none flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-secondary-teal" aria-hidden="true" />
                                    Voice Description Triage
                                </h3>
                            </div>
                            <div className="flex justify-center py-2">
                                <VoiceRecorder onResult={handleVoiceResult} />
                            </div>
                        </div>

                        {/* MANUAL FALLBACK FORM */}
                        <div className="card-secure p-6 bg-white border border-bg-subtle shadow-card rounded-md">
                            <div className="flex items-center gap-2 mb-5">
                                <FileText className="w-4 h-4 text-primary-trust" aria-hidden="true" />
                                <h3 className="text-md font-bold text-primary-navy">Manual Patient Details</h3>
                            </div>

                            <form onSubmit={handleManualSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                    {/* AGE ESTIMATE */}
                                    <div>
                                        <label
                                            htmlFor="age_estimate"
                                            className="block text-xs font-semibold text-text-secondary mb-1.5"
                                        >
                                            Age Estimate
                                        </label>
                                        <input
                                            type="number"
                                            id="age_estimate"
                                            name="age_estimate"
                                            value={formData.age_estimate}
                                            onChange={handleInputChange}
                                            placeholder="e.g. 25"
                                            min="0"
                                            max="120"
                                            className="focus-visible:outline-secondary-teal"
                                        />
                                    </div>

                                    {/* GENDER */}
                                    <div>
                                        <label
                                            htmlFor="gender"
                                            className="block text-xs font-semibold text-text-secondary mb-1.5"
                                        >
                                            Gender
                                        </label>
                                        <select
                                            id="gender"
                                            name="gender"
                                            value={formData.gender}
                                            onChange={handleInputChange}
                                            className="focus-visible:outline-secondary-teal text-sm"
                                        >
                                            <option value="">Select Gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other / Unspecified</option>
                                        </select>
                                    </div>
                                </div>

                                {/* LOCATION */}
                                <div>
                                    <label
                                        htmlFor="location_found"
                                        className="block text-xs font-semibold text-text-secondary mb-1.5"
                                    >
                                        Location Found
                                    </label>
                                    <input
                                        type="text"
                                        id="location_found"
                                        name="location_found"
                                        value={formData.location_found}
                                        onChange={handleInputChange}
                                        placeholder="Area, station, street name, or coordinates"
                                        className="focus-visible:outline-secondary-teal"
                                    />
                                </div>

                                {/* CLOTHING */}
                                <div>
                                    <label
                                        htmlFor="clothing"
                                        className="block text-xs font-semibold text-text-secondary mb-1.5"
                                    >
                                        Clothing Details
                                    </label>
                                    <textarea
                                        id="clothing"
                                        name="clothing"
                                        value={formData.clothing}
                                        onChange={handleInputChange}
                                        placeholder="Describe shirts, pants, footwear, patterns, colors..."
                                        rows={2}
                                        className="focus-visible:outline-secondary-teal min-h-[60px]"
                                    />
                                </div>

                                {/* INJURIES */}
                                <div>
                                    <label
                                        htmlFor="injuries"
                                        className="block text-xs font-semibold text-text-secondary mb-1.5"
                                    >
                                        Notable Injuries / Physical Marks
                                    </label>
                                    <textarea
                                        id="injuries"
                                        name="injuries"
                                        value={formData.injuries}
                                        onChange={handleInputChange}
                                        placeholder="Cuts, scars, tattoos, fractures, or obvious medical status..."
                                        rows={2}
                                        className="focus-visible:outline-secondary-teal min-h-[60px]"
                                    />
                                </div>

                                {/* ACTIONS */}
                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className={`w-full py-2.5 px-4 rounded-sm font-semibold text-sm transition-all inline-flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-teal ${submitting
                                            ? "bg-bg-subtle text-text-muted border border-bg-subtle cursor-not-allowed"
                                            : "btn-primary cursor-pointer"
                                            }`}
                                    >
                                        <Search className="w-4 h-4" aria-hidden="true" />
                                        {submitting ? "Searching Database..." : "Search Potential Matches"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* RIGHT SIDE: MATCH RESULTS PANEL */}
                    <div className="lg:col-span-5">
                        <div className="card-secure p-6 bg-white border border-bg-subtle shadow-card rounded-md sticky top-6">
                            <h3 className="text-md font-bold text-primary-navy mb-5 border-b border-bg-subtle pb-3">
                                Live Match Outcome
                            </h3>

                            {/* SEARCHING / LOADING STATE */}
                            {searchStatus === "searching" && (
                                <div className="py-12 flex flex-col items-center justify-center text-center gap-4" aria-live="polite">
                                    <div className="w-12 h-12 rounded-full bg-bg-main flex items-center justify-center text-primary-trust">
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-primary-navy">Searching for potential matches...</h4>
                                        <p className="text-xs text-text-muted mt-1">Cross-referencing report databases</p>
                                    </div>
                                </div>
                            )}

                            {/* IDLE / AWAITING INTAKE STATE */}
                            {searchStatus === "idle" && (
                                <div className="py-12 flex flex-col items-center justify-center text-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-bg-main flex items-center justify-center text-text-muted">
                                        <Info className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-text-secondary">Awaiting Intake Submission</h4>
                                        <p className="text-xs text-text-muted mt-1 max-w-[260px] mx-auto">
                                            Use the voice description microphone or complete patient forms to generate match matches.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* RESULT DISCOVERED STATE */}
                            {searchStatus === "result" && matchData && (
                                <div className="flex flex-col items-center gap-4">
                                    {isCurrentlyVerified && (
                                        <div
                                            className="w-full flex items-center gap-2.5 p-3.5 bg-teal-50 border border-teal-200 text-alert-success rounded-sm text-xs"
                                            role="status"
                                        >
                                            <CheckCircle2 className="w-4.5 h-4.5 shrink-0" aria-hidden="true" />
                                            <div>
                                                <p className="font-bold">Match Verification Confirmed</p>
                                                <p className="text-text-secondary mt-0.5">The officer/hospital verified this profile as identified.</p>
                                            </div>
                                        </div>
                                    )}
                                    <MatchCard
                                        match={matchData}
                                        onVerified={handleVerified}
                                    />
                                </div>
                            )}

                            {/* NO MATCH FOUND STATE */}
                            {searchStatus === "nomatch" && (
                                <div className="py-12 flex flex-col items-center justify-center text-center gap-4" aria-live="polite">
                                    <div className="w-12 h-12 rounded-full bg-bg-main flex items-center justify-center text-primary-trust">
                                        <Info className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-primary-navy">No potential match found</h4>
                                        <p className="text-xs text-text-muted mt-1 max-w-[260px] mx-auto">
                                            No matching records met the confidence threshold. Check inputs or continue register sequence.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* ERROR STATE */}
                            {searchStatus === "error" && (
                                <div className="py-10 flex flex-col items-center justify-center text-center gap-4" aria-live="assertive">
                                    <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-alert-emergency">
                                        <ShieldAlert className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-alert-emergency">Search Processing Error</h4>
                                        <p className="text-xs text-text-secondary mt-1.5 px-4">
                                            {errorMessage || "Unable to retrieve match records."}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
