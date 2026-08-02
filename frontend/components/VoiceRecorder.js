import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, Loader2, AlertCircle, CheckCircle2, RotateCcw } from "lucide-react";

export default function VoiceRecorder({ onResult }) {
    const [status, setStatus] = useState("idle"); // 'idle' | 'recording' | 'processing' | 'success' | 'error'
    const [error, setError] = useState(null);

    const mediaRecorderRef = useRef(null);
    const streamRef = useRef(null);
    const chunksRef = useRef([]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cleanupMediaDevices();
        };
    }, []);

    const cleanupMediaDevices = () => {
        // Stop recording if active
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            try {
                mediaRecorderRef.current.stop();
            } catch (e) {
                console.error("Failed to stop media recorder on cleanup:", e);
            }
        }

        // Stop tracks to turn off recording light indicator on hardware
        if (streamRef.current) {
            try {
                streamRef.current.getTracks().forEach((track) => track.stop());
            } catch (e) {
                console.error("Failed to stop media stream tracks on cleanup:", e);
            }
            streamRef.current = null;
        }

        mediaRecorderRef.current = null;
    };

    const startRecording = async () => {
        setError(null);
        chunksRef.current = [];

        // Check browser compatibility
        if (typeof window === "undefined" || !navigator.mediaDevices || !window.MediaRecorder) {
            setError("Audio recording is not supported in your browser.");
            setStatus("error");
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
                chunksRef.current = [];
                await uploadAudio(audioBlob);
            };

            mediaRecorder.start();
            setStatus("recording");
        } catch (err) {
            console.error("Accessing media devices failed:", err);
            // Friendly messages based on common permission errors
            if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
                setError("Microphone access was denied. Please check your browser permissions.");
            } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
                setError("No microphone device was found on this system.");
            } else {
                setError("Could not access microphone. Verify hardware connections.");
            }
            setStatus("error");
        }
    };

    const stopRecording = () => {
        if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") {
            return;
        }

        // This triggers mediaRecorder.onstop
        mediaRecorderRef.current.stop();

        // Immediately stop tracks to turn off microphone indicators
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }

        setStatus("processing");
    };

    const uploadAudio = async (audioBlob) => {
        setStatus("processing");
        setError(null);

        const formData = new FormData();
        formData.append("audio", audioBlob, "intake_recording.webm");

        try {
            const response = await fetch("/api/intake/transcribe", {
                method: "POST",
                body: formData,
                // Content-Type is NOT set manually so browser handles multipart boundary
            });

            if (!response.ok) {
                throw new Error(`Server returned a non-OK status: ${response.status}`);
            }

            let data;
            try {
                data = await response.json();
            } catch (jsonErr) {
                throw new Error("Unable to parse audio response from server.");
            }

            setStatus("success");
            if (onResult) {
                onResult(data);
            }
        } catch (err) {
            console.error("Audio transmission failed:", err);
            setError(err.message || "Failed to connect to the processing service. Please check connection.");
            setStatus("error");
        }
    };

    const resetState = () => {
        cleanupMediaDevices();
        setError(null);
        setStatus("idle");
    };

    return (
        <div className="card-secure p-6 max-w-md w-full bg-white border border-bg-subtle shadow-card text-center">
            {/* 1. IDLE STATE */}
            {status === "idle" && (
                <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-bg-main text-primary-inst">
                        <Mic className="w-8 h-8" aria-hidden="true" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-primary-navy">Smart Record</h3>
                        <p className="text-sm text-text-secondary mt-1">Describe the patient using your voice</p>
                    </div>
                    <button
                        onClick={startRecording}
                        className="btn-primary w-full py-2.5 px-4 font-medium transition-all"
                        aria-label="Start recording patient description"
                    >
                        Start Recording
                    </button>
                </div>
            )}

            {/* 2. RECORDING STATE */}
            {status === "recording" && (
                <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-50 text-alert-emergency relative">
                        {/* Visual pulse indicator */}
                        <span className="absolute inline-flex h-full w-full rounded-full bg-alert-emergency opacity-20 animate-ping"></span>
                        <Mic className="w-8 h-8 relative z-10" aria-hidden="true" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-alert-emergency">Recording...</h3>
                        <p className="text-sm text-text-secondary mt-1">Speak clearly. Microphone is active.</p>
                    </div>
                    <button
                        onClick={stopRecording}
                        className="w-full bg-alert-emergency hover:bg-red-800 text-white border border-red-900 rounded-sm font-medium py-2.5 px-4 inline-flex items-center justify-center gap-2 transition-all cursor-pointer"
                        aria-label="Stop recording patient description"
                    >
                        <Square className="w-4 h-4 fill-white" aria-hidden="true" />
                        Stop Recording
                    </button>
                </div>
            )}

            {/* 3. PROCESSING STATE */}
            {status === "processing" && (
                <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-bg-main text-primary-trust">
                        <Loader2 className="w-8 h-8 animate-spin" aria-hidden="true" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-primary-navy">Processing...</h3>
                        <p className="text-sm text-text-secondary mt-1">Analyzing voice intake patient details</p>
                    </div>
                    <button
                        disabled
                        className="w-full bg-bg-subtle text-text-muted border border-bg-subtle rounded-sm font-medium py-2.5 px-4 inline-flex items-center justify-center gap-2 cursor-not-allowed"
                        aria-label="Processing audio recording, please wait"
                    >
                        Please Wait...
                    </button>
                </div>
            )}

            {/* 4. SUCCESS STATE */}
            {status === "success" && (
                <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-teal-50 text-alert-success">
                        <CheckCircle2 className="w-8 h-8" aria-hidden="true" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-primary-navy">Recording processed successfully</h3>
                        <p className="text-sm text-text-secondary mt-1">Ready for next patient intake entry</p>
                    </div>
                    <button
                        onClick={resetState}
                        className="btn-outline w-full py-2.5 px-4 font-medium transition-all"
                        aria-label="Record a new voice description"
                    >
                        <RotateCcw className="w-4 h-4" aria-hidden="true" />
                        Record New Description
                    </button>
                </div>
            )}

            {/* 5. ERROR STATE */}
            {status === "error" && (
                <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-50 text-alert-emergency">
                        <AlertCircle className="w-8 h-8" aria-hidden="true" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-alert-emergency">Recording Error</h3>
                        <p className="text-sm text-text-secondary mt-1 pr-2 pl-2">
                            {error || "An unexpected error occurred during recording."}
                        </p>
                    </div>
                    <button
                        onClick={resetState}
                        className="btn-primary w-full py-2.5 px-4 font-medium transition-all"
                        aria-label="Try recording again"
                    >
                        <RotateCcw className="w-4 h-4" aria-hidden="true" />
                        Try Again
                    </button>
                </div>
            )}
        </div>
    );
}
