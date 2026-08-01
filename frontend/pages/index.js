import React from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, ArrowRight, Activity, Users, PlusCircle } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B1528] to-[#040814] text-white flex flex-col justify-between font-sans">
      <Head>
        <title>IdentyBridge - Emergency Matching & Verification</title>
        <meta name="description" content="Secure matching platform connecting unidentified accident victims with missing person reports." />
        <link rel="icon" href="/logo.png" />
      </Head>

      {/* HEADER NAVBAR */}
      <header className="border-b border-white/5 bg-[#0B1528]/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="IdentyBridge Logo"
              width={38}
              height={38}
              className="rounded-full shadow-[0_0_15px_rgba(20,184,166,0.3)]"
            />
            <div>
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent">
                IdentyBridge
              </span>
              <span className="block text-[10px] text-teal-400 font-semibold tracking-widest uppercase mt-0.5">
                Secure Link
              </span>
            </div>
          </div>
          <div>
            <span className="badge-secure bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center gap-1.5 px-3 py-1 font-semibold text-xs rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" />
              Symmetric Auth Active
            </span>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <main className="max-w-6xl mx-auto px-6 py-16 flex-1 flex flex-col items-center justify-center text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/5 px-4 py-1.5 text-xs font-semibold text-teal-400 tracking-wide">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            Hackathon Live Deployment
          </div>
          
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-none bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
            Bridging Identity in <br />
            <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Emergency Situations
            </span>
          </h1>
          
          <p className="text-zinc-400 max-w-xl mx-auto text-base md:text-lg leading-relaxed">
            A secure full-stack platform leveraging Whisper audio triaging, OpenAI semantic vector embeddings, and cognitive face verification to map unidentified patients to missing person reports.
          </p>
        </div>

        {/* PORTAL NAVIGATION GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 w-full max-w-5xl">
          
          {/* CARD 1: INTAKE */}
          <Link href="/intake" className="group">
            <div className="h-full bg-gradient-to-b from-white/[0.04] to-transparent border border-white/5 hover:border-teal-500/40 p-8 rounded-xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(20,184,166,0.1)] text-left flex flex-col justify-between space-y-8">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 group-hover:scale-110 transition-transform">
                  <PlusCircle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-teal-300 transition-colors">
                  Patient Intake Portal
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Register unidentified emergency patients. Supports hands-free microphone audio notes, auto-feature extraction, and photo face matching.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-400 group-hover:translate-x-1.5 transition-transform">
                Open Intake <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>

          {/* CARD 2: REPORT MISSING */}
          <Link href="/report-missing" className="group">
            <div className="h-full bg-gradient-to-b from-white/[0.04] to-transparent border border-white/5 hover:border-cyan-500/40 p-8 rounded-xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(6,182,212,0.1)] text-left flex flex-col justify-between space-y-8">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                  Report Missing Person
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  File descriptions of missing loved ones. Upload photo indicators and search real-time records for potential matches.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400 group-hover:translate-x-1.5 transition-transform">
                File Report <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>

          {/* CARD 3: DASHBOARD */}
          <Link href="/dashboard" className="group">
            <div className="h-full bg-gradient-to-b from-white/[0.04] to-transparent border border-white/5 hover:border-blue-500/40 p-8 rounded-xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.1)] text-left flex flex-col justify-between space-y-8">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors">
                  Operations Overview
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Centralized system status monitoring for police and hospital administrators to verify matched alerts and review cases.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 group-hover:translate-x-1.5 transition-transform">
                Open Dashboard <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-6 bg-[#040814]/80 text-center">
        <p className="text-xs text-zinc-500">
          &copy; {new Date().getFullYear()} IdentyBridge. Built for secure emergency operations.
        </p>
      </footer>
    </div>
  );
}
