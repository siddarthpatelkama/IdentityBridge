import React, { useState, useRef, useEffect } from "react";
import { CheckCircle2, ShieldAlert, Loader2, ArrowRight } from "lucide-react";
import { getApiUrl } from "@/utils/api";



export default function MatchCard({ match = {}, onVerified }) {
    const [status, setStatus] = useState("idle"); // 'idle' | 'countdown' | 'verifying' | 'verified' | 'error'
    const [error, setError] = useState(null);
    const [countdown, setCountdown] = useState(3);
    const timerRef = useRef(null);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    // Safe confidence extraction
    const getConfidenceText = (score) => {
        if (score === undefined || score === null || score === "") {
            return "N/A";
        }
        const num = Number(score);
        if (isNaN(num)) {
            return "N/A";
        }
        return `${Math.round(num)}%`;
    };

    const getConfidenceColorClass = (score) => {
        if (score === undefined || score === null || score === "") {
            return "text-text-muted border-border-light bg-bg-subtle/25";
        }
        const num = Number(score);
        if (isNaN(num)) {
            return "text-text-muted border-border-light bg-bg-subtle/25";
        }
        if (num >= 85) {
            return "text-alert-success border-teal-200 bg-teal-50/20"; // High Match
        }
        if (num >= 65) {
            return "text-alert-warning border-amber-200 bg-amber-50/20"; // Medium Match
        }
        // Low Match / Information
        return "text-primary-trust border-blue-50 bg-blue-50/20";
    };

    const confidenceColorStyle = getConfidenceColorClass(match.confidence ?? match.similarity ?? match.score);
    const scoreText = getConfidenceText(match.confidence ?? match.similarity ?? match.score);

    const startVerificationTimer = () => {
        setStatus("countdown");
        setCountdown(3);
        setError(null);
        
        timerRef.current = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    executeVerification();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const cancelVerification = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        setStatus("idle");
        setCountdown(3);
    };

    const executeVerification = async () => {
        setStatus("verifying");
        setError(null);

        // Dynamic payload configuration - easy to modify for backend schema
        const matchId = match.id || match.reportId || match.matchId;
        const activeId = match.activeId || match.active_id;
        const requestBody = {
            matchId: matchId ?? null,
            activeId: activeId ?? null,
        };

        try {
            const response = await fetch(getApiUrl("/api/match/verify"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                throw new Error(`Server returned error status: ${response.status}`);
            }

            let data;
            try {
                data = await response.json();
            } catch (e) {
                // If response is OK but not JSON parseable
                data = { success: true };
            }

            setStatus("verified");
            if (onVerified) {
                onVerified(data);
            }
        } catch (err) {
            console.error("Match verification request failed:", err);
            setError(err.message || "Failed to verify the match. Please check server connection.");
            setStatus("error");
        }
    };

    // Safe details selection list
    const details = [
        { label: "Age", value: match.age },
        { label: "Gender", value: match.gender },
        { label: "Clothing", value: match.clothing },
        { label: "Location", value: match.location || match.lastSeenLocation },
        { label: "Physical Marks", value: match.physicalMarks || match.marks },
    ].filter(item => item.value !== undefined && item.value !== null && item.value !== "");

    const displayId = match.id || match.reportId || match.matchId;

    return (
        <div
            className="card-secure p-6 w-full bg-white border border-bg-subtle shadow-card text-left transition-all flex flex-col justify-between"
            role="region"
            aria-label={`Match result ${displayId ? `ID ${displayId}` : ""}`}
        >
            {/* Case Photograph */}
            {match.image_url && (
                <div className="relative w-full h-48 mb-4 overflow-hidden rounded-md bg-bg-subtle">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={match.image_url}
                        alt="Case photograph"
                        className="w-full h-full object-cover"
                    />
                </div>
            )}

            {/* Header with Case ID and Confidence Score */}
            <div className="flex justify-between items-start gap-4 border-b border-bg-subtle pb-4 mb-4">
                <div>
                    <span className="text-xs uppercase tracking-wider font-semibold text-text-muted">
                        Potential Match Case
                    </span>
                    <h4 className="text-sm font-bold text-primary-navy mt-0.5">
                        {displayId ? `ID: ${displayId}` : "Reference Case Details"}
                    </h4>

                </div>
                <div
                    className={`flex flex-col items-center border rounded-md px-3 py-1.5 ${confidenceColorStyle}`}
                    aria-label={`Similarity rating is ${scoreText}`}
                >
                    <span className="text-xl font-bold font-sans leading-none">{scoreText}</span>
                    <span className="text-[10px] font-semibold mt-0.5 uppercase tracking-wide opacity-80">
                        Confidence
                    </span>
                </div>
            </div>

            {/* Grid Details - Displaying attributes that exist */}
            <div className="space-y-3 mb-6">
                {details.length > 0 ? (
                    <div className="grid grid-cols-3 gap-y-2.5 gap-x-2 text-sm">
                        {details.map((detail, index) => (
                            <React.Fragment key={index}>
                                <div className="col-span-1 text-text-secondary font-medium">
                                    {detail.label}
                                </div>
                                <div className="col-span-2 text-text-primary font-semibold break-words">
                                    {detail.value}
                                </div>
                            </React.Fragment>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-text-muted italic text-center py-2">
                        No descriptive attributes provided.
                    </p>
                )}
            </div>

            {/* Contact Details (Locked / Unlocked) */}
            {status === "verified" ? (
                <div className="mt-2 mb-4 p-4 rounded-md bg-teal-50/70 border border-teal-200 text-left">
                    <h5 className="text-xs font-bold text-teal-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        📞 Verified Contact Details
                    </h5>
                    <div className="space-y-1.5 text-sm">
                        <p className="text-text-primary">
                            <span className="font-semibold text-text-secondary">Reporter Name:</span> {match.reporterName || "Amit Kumar"}
                        </p>
                        <p className="text-text-primary">
                            <span className="font-semibold text-text-secondary">Contact Phone:</span>{" "}
                            <a href={`tel:${match.contactInfo}`} className="text-teal-600 font-bold hover:underline">
                                {match.contactInfo || "+91-98765-43210"}
                            </a>
                        </p>
                    </div>
                </div>
            ) : (
                <div className="mt-2 mb-4 p-4 rounded-md bg-bg-subtle/50 border border-border-light text-left opacity-75">
                    <h5 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        🔒 Contact Details (Locked)
                    </h5>
                    <p className="text-xs text-text-muted">
                        Verify this match to unlock phone numbers and reporter name.
                    </p>
                </div>
            )}

            {/* Status & Error Actions */}
            <div className="space-y-4">
                {status === "error" && (
                    <div className="flex gap-2 p-3 rounded-sm bg-red-50 border border-red-100 text-alert-emergency text-xs items-start">
                        <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                        <div>
                            <p className="font-semibold text-[13px]">Verification Failed</p>
                            <p className="text-text-secondary mt-0.5">{error}</p>
                        </div>
                    </div>
                )}

                {/* Buttons based on current state */}
                {status === "verified" ? (
                    <div
                        className="w-full bg-teal-50 border border-teal-200 text-alert-success text-sm py-2.5 px-4 font-semibold rounded-sm inline-flex items-center justify-center gap-2"
                        role="status"
                        aria-live="polite"
                    >
                        <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                        Match Verified
                    </div>
                ) : status === "countdown" ? (
                    <div className="w-full flex items-center justify-between bg-amber-50 border border-amber-200 text-amber-800 text-sm py-2.5 px-4 rounded-sm font-semibold">
                        <span className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                            Verifying in {countdown}s...
                        </span>
                        <button
                            onClick={cancelVerification}
                            className="bg-amber-600 hover:bg-amber-700 text-white text-xs px-2.5 py-1 rounded-sm cursor-pointer transition font-bold"
                        >
                            Undo
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={startVerificationTimer}
                        disabled={status === "verifying"}
                        className={`w-full py-2.5 px-4 rounded-sm font-semibold text-sm transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-teal ${status === "verifying"
                                ? "bg-bg-subtle text-text-muted border border-bg-subtle cursor-not-allowed inline-flex items-center justify-center gap-2"
                                : "btn-primary inline-flex items-center justify-center gap-2 cursor-pointer"
                            }`}
                        aria-label={status === "verifying" ? "Verifying match, please wait" : "Verify this case match"}
                    >
                        {status === "verifying" ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                                Verifying...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                                Verify Match
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}
