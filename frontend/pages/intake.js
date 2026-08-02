import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { Shield, Sparkles, FileText, Search, ShieldAlert, CheckCircle2, Info, Loader2 } from "lucide-react";
import VoiceRecorder from "@/components/VoiceRecorder";
import MatchCard from "@/components/MatchCard";
import { supabase } from "@/lib/supabaseClient";
import { getApiUrl } from "@/utils/api";


export default function IntakeDashboard() {
    const handleSignOut = async () => {
        if (supabase) {
            await supabase.auth.signOut();
            localStorage.removeItem("identybridge_role");
            localStorage.removeItem("identybridge_fullname");
            localStorage.removeItem("identybridge_facility_name");
            localStorage.removeItem("identybridge_facility_location");
            window.location.href = "/";
        }
    };

    // Page states
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
    const [photoFile, setPhotoFile] = useState(null);

    // Persist form state across refreshes
    useEffect(() => {
        const saved = localStorage.getItem("identybridge_intake_form");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setFormData(prev => ({ ...prev, ...parsed }));
            } catch (e) {
                console.error("Error loading cached intake form:", e);
            }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem("identybridge_intake_form", JSON.stringify(formData));
    }, [formData]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setPhotoFile(e.target.files[0]);
        }
    };

    // 1. Voice Intake outcome handler
    const handleVoiceResult = (data) => {
        // Automatically populate manual form fields with AI-extracted properties
        if (data && data.extracted_data) {
            const ext = data.extracted_data;
            setFormData({
                age_estimate: ext.age_estimate !== undefined && ext.age_estimate !== null ? ext.age_estimate : "",
                gender: ext.gender || "",
                clothing: ext.clothing || "",
                location_found: ext.location_found || ext.location || "",
                injuries: ext.injuries || ext.physical_marks || "",
            });
        }

        // Reset search status so user can review the populated form before searching
        setMatchData(null);
        setSearchStatus("idle");
    };

    // 2. Manual form submission handler
    const handleManualSubmit = async (e) => {
        e.preventDefault();
        if (submitting) return;

        setSubmitting(true);
        setSearchStatus("searching");
        setErrorMessage(null);
        setMatchData(null);

        const formDataPayload = new FormData();
        formDataPayload.append("age_estimate", formData.age_estimate ? parseInt(formData.age_estimate, 10) : "");
        formDataPayload.append("gender", formData.gender);
        formDataPayload.append("clothing", formData.clothing);
        formDataPayload.append("location_found", formData.location_found);
        formDataPayload.append("injuries", formData.injuries);
        
        if (photoFile) {
            formDataPayload.append("photo", photoFile);
        }

        try {
            const response = await fetch(getApiUrl("/api/intake/text"), {
                method: "POST",
                body: formDataPayload,
                // Content-Type is omitted so the browser sets the multipart boundary automatically
            });

            if (!response.ok) {
                throw new Error(`Intake submission failed: ${response.status} ${response.statusText}`);
            }

            localStorage.removeItem("identybridge_intake_form");

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
                    <Link href="/" className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition">
                        <h1 className="text-xl font-bold tracking-tight text-white m-0">IdentyBridge</h1>
                        <span className="h-4 w-px bg-primary-trust opacity-40 hidden sm:inline"></span>
                        <span className="text-sm font-semibold text-bg-subtle hidden sm:inline">
                            Police & Hospital Intake
                        </span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <span className="badge-secure bg-[#123B66] text-[#14B8A6] border border-[#1D5D8F] flex items-center gap-1.5 px-3 py-1 font-semibold text-xs rounded-full">
                            <Shield className="w-3.5 h-3.5 fill-[#14B8A6]/10" aria-hidden="true" />
                            Secure Intake
                        </span>
                        <button
                            onClick={handleSignOut}
                            className="bg-transparent hover:bg-white/10 text-white/80 hover:text-white px-3 py-1 text-xs font-semibold rounded-md border border-white/10 transition cursor-pointer"
                        >
                            Sign Out
                        </button>
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
                                        />
                                </div>

                                {/* PHOTO UPLOAD */}
                                <div>
                                    <label
                                        htmlFor="photo"
                                        className="block text-xs font-semibold text-text-secondary mb-1.5"
                                    >
                                        Patient Photo Upload (Required for Face Verification)
                                    </label>
                                    <input
                                        type="file"
                                        id="photo"
                                        name="photo"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="focus-visible:outline-secondary-teal text-sm w-full file:mr-4 file:py-1.5 file:px-3 file:rounded-sm file:border-0 file:text-xs file:font-semibold file:bg-secondary-teal/10 file:text-secondary-teal hover:file:bg-secondary-teal/20"
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
