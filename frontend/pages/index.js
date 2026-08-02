import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";

import {
  ArrowRight,
  Building2,
  Check,
  HeartPulse,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState("Public User");

  useEffect(() => {
    if (!supabase) return;
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      if (session) {
        setUserRole(localStorage.getItem("identybridge_role") || "Public User");
      }
    });

    // Listen to changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      if (session) {
        setUserRole(localStorage.getItem("identybridge_role") || "Public User");
      } else {
        setUserRole("Public User");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
      localStorage.removeItem("identybridge_role");
      localStorage.removeItem("identybridge_fullname");
      localStorage.removeItem("identybridge_facility_name");
      localStorage.removeItem("identybridge_facility_location");
      window.location.reload();
    }
  };

  return (
    <>
      <Head>
        <title>IdentyBridge | Connecting People, Faster</title>
        <meta
          name="description"
          content="IdentyBridge connects families, hospitals and police to identify missing persons faster."
        />
        <link rel="icon" href="/logo.png" />
      </Head>

      <main className="min-h-screen overflow-hidden bg-[#F4F7FA] font-sans">

        {/* ================= NAVBAR ================= */}

        <header className="absolute left-0 right-0 top-0 z-30">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">

            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="IdentyBridge Logo"
                width={40}
                height={40}
                className="rounded-full shadow-[0_0_15px_rgba(20,184,166,0.3)]"
              />
              <div>
                <p className="text-lg font-semibold tracking-tight text-white leading-none">
                  IdentyBridge
                </p>
                <p className="text-[9px] uppercase tracking-[0.2em] text-white/50 mt-1">
                  Identity Response
                </p>
              </div>
            </Link>

            <div className="hidden items-center gap-3 sm:flex">
              <Link
                href="/dashboard"
                className="rounded-lg px-4 py-2 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                Dashboard
              </Link>

              {isAuthenticated ? (
                <>
                  <Link
                    href="/intake"
                    className="rounded-lg px-4 py-2 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
                  >
                    Intake
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white cursor-pointer"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  href="/signin"
                  className="rounded-lg px-4 py-2 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                  Sign In
                </Link>
              )}

              <Link
                href={isAuthenticated ? "/report-missing" : "/signin?redirect=/report-missing"}
                className="rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-[#0B1F3A] shadow-lg transition hover:bg-white/90"
              >
                Report Missing
              </Link>
            </div>

          </div>
        </header>

        {/* ================= HERO ================= */}

        <section className="relative min-h-[720px] overflow-hidden bg-[#081B32]">

          {/* Dynamic gradient background */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_45%,rgba(20,184,166,0.20),transparent_30%),radial-gradient(circle_at_20%_80%,rgba(29,93,143,0.35),transparent_35%)]" />

          <div className="absolute right-[-180px] top-[-180px] h-[550px] w-[550px] rounded-full bg-[#14B8A6]/10 blur-[120px]" />

          <div className="absolute bottom-[-250px] left-[-150px] h-[500px] w-[500px] rounded-full bg-[#1D5D8F]/20 blur-[100px]" />

          {/* subtle grid */}
          <div
            className="absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
              backgroundSize: "50px 50px",
            }}
          />

          <div className="relative mx-auto flex min-h-[720px] max-w-7xl items-center px-6 pt-24 lg:px-10">
            <div className="grid w-full items-center gap-16 lg:grid-cols-[0.95fr_1.05fr]">

              {/* ================= LEFT CONTENT ================= */}
              <div className="max-w-xl">

                {/* small badge */}
                <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#14B8A6]/20 bg-[#14B8A6]/10 px-3 py-1.5 text-xs font-medium text-[#7DE3D8]">
                  <Sparkles size={13} />
                  Smart Identity Network
                </div>

                {/* MAIN HEADING */}
                <h1 className="text-5xl font-semibold leading-[1.04] tracking-[-0.04em] text-white sm:text-6xl lg:text-[4.5rem]">
                  Connecting the
                  <span className="block bg-gradient-to-r from-white via-[#B8FFF6] to-[#14B8A6] bg-clip-text text-transparent">
                    missing dots.
                  </span>
                </h1>

                {/* SMALL DESCRIPTION */}
                <p className="mt-7 max-w-md text-base leading-7 text-white/55">
                  IdentyBridge connects families, hospitals and police to help
                  identify missing people faster.
                </p>

                {/* BUTTONS */}
                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href={isAuthenticated ? "/report-missing" : "/signin?redirect=/report-missing"}
                    className="group inline-flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-3.5 text-sm font-semibold text-[#0B1F3A] shadow-xl transition hover:-translate-y-0.5"
                  >
                    <Search size={17} />
                    Report Missing Person
                    <ArrowRight
                      size={16}
                      className="transition group-hover:translate-x-1"
                    />
                  </Link>

                  <Link
                    href={isAuthenticated ? "/intake" : "/signin?redirect=/intake"}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/[0.06] px-5 py-3.5 text-sm font-medium text-white backdrop-blur transition hover:bg-white/10"
                  >
                    <HeartPulse size={17} />
                    Emergency Intake
                  </Link>
                </div>

                {/* tiny credibility line */}
                <div className="mt-8 flex items-center gap-2 text-xs text-white/35">
                  <div className="flex -space-x-1">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1D5D8F] ring-2 ring-[#081B32]">
                      <Users size={11} />
                    </span>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0F766E] ring-2 ring-[#081B32]">
                      <HeartPulse size={11} />
                    </span>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#123B66] ring-2 ring-[#081B32]">
                      <Building2 size={11} />
                    </span>
                  </div>
                  <span>
                    Family · Hospital · Police
                  </span>
                </div>

              </div>

              {/* ================= RIGHT VISUAL ================= */}
              <div className="relative flex items-center justify-center">

                {/* glowing orb behind card */}
                <div className="absolute h-[420px] w-[420px] rounded-full bg-[#14B8A6]/10 blur-[90px]" />

                {/* MAIN NETWORK CARD */}
                <div className="relative w-full max-w-[480px]">
                  <div className="rounded-[24px] border border-white/10 bg-white/[0.07] p-5 shadow-[0_30px_100px_rgba(0,0,0,0.35)] backdrop-blur-2xl sm:p-7">

                    {/* card header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">
                          Live Identity Network
                        </p>
                        <p className="mt-1 text-sm font-medium text-white">
                          Connected response
                        </p>
                      </div>

                      <div className="flex items-center gap-2 rounded-full border border-[#14B8A6]/20 bg-[#14B8A6]/10 px-3 py-1.5">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#14B8A6]" />
                        <span className="text-[10px] font-medium text-[#7DE3D8]">
                          ACTIVE
                        </span>
                      </div>
                    </div>

                    {/* ================= NETWORK ================= */}
                    <div className="relative mt-8">

                      {/* connecting line */}
                      <div className="absolute left-[27px] top-[45px] h-[155px] w-px bg-gradient-to-b from-[#14B8A6]/50 via-[#14B8A6]/20 to-transparent" />

                      <NetworkNode
                        icon={<Users size={18} />}
                        title="Family"
                        text="Missing person report"
                        active
                      />

                      <NetworkNode
                        icon={<HeartPulse size={18} />}
                        title="Hospital"
                        text="Unidentified patient"
                        active
                      />

                      <NetworkNode
                        icon={<Building2 size={18} />}
                        title="Police"
                        text="Verification & response"
                        active
                      />

                    </div>

                    {/* ================= MATCH DETECTED ================= */}
                    <div className="relative mt-5 overflow-hidden rounded-xl border border-[#14B8A6]/20 bg-gradient-to-r from-[#0F766E]/20 to-[#1D5D8F]/10 p-4">
                      {/* glow */}
                      <div className="absolute right-[-20px] top-[-30px] h-24 w-24 rounded-full bg-[#14B8A6]/20 blur-2xl" />

                      <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#14B8A6]/15 text-[#7DE3D8]">
                            <Check size={19} />
                          </div>

                          <div>
                            <p className="text-xs font-semibold text-white">
                              Potential match detected
                            </p>
                            <p className="mt-0.5 text-[10px] text-white/40">
                              Awaiting human verification
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-2xl font-semibold text-[#7DE3D8]">
                            88%
                          </p>
                          <p className="text-[9px] uppercase tracking-wider text-white/30">
                            confidence
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* bottom status */}
                    <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                      <div className="flex items-center gap-2 text-[10px] text-white/35">
                        <ShieldCheck size={13} />
                        Secure identity workflow
                      </div>
                      <span className="text-[10px] text-white/25">
                        IDB-2048
                      </span>
                    </div>

                  </div>

                  {/* FLOATING MATCH BADGE */}
                  <div className="absolute -right-4 -top-5 hidden rounded-xl border border-white/10 bg-[#102A48]/90 px-4 py-3 shadow-2xl backdrop-blur-xl sm:block">
                    <div className="flex items-center gap-3">
                      <div className="relative flex h-9 w-9 items-center justify-center">
                        <div className="absolute inset-0 rounded-full bg-[#14B8A6]/20 animate-ping" />
                        <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[#14B8A6]/15 text-[#7DE3D8]">
                          <Check size={15} />
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-white">
                          Match candidate
                        </p>
                        <p className="text-[9px] text-white/35">
                          Ready to review
                        </p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>

          {/* bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#F4F7FA] to-transparent" />

        </section>

        {/* ================= SIMPLE INTRO ================= */}

        <section className="bg-[#F4F7FA] px-6 py-20 lg:px-10">
          <div className="mx-auto max-w-5xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0F766E]">
              One platform. Three connections.
            </p>

            <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-[#0B1F3A] sm:text-4xl">
              Information shouldn't get lost
              <span className="text-[#1D5D8F]"> between systems.</span>
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-[#526274]">
              IdentyBridge creates a common bridge between the people searching
              and the people who may have the answer.
            </p>
          </div>

          {/* THREE SIMPLE CARDS */}
          <div className="mx-auto mt-12 grid max-w-5xl gap-4 md:grid-cols-3">
            <SimpleCard
              icon={<Users size={20} />}
              title="Families"
              text="Report a missing person."
            />

            <SimpleCard
              icon={<HeartPulse size={20} />}
              title="Hospitals"
              text="Record unidentified patients."
            />

            <SimpleCard
              icon={<Building2 size={20} />}
              title="Police"
              text="Verify potential matches."
            />
          </div>
        </section>

        {/* ================= FINAL CTA ================= */}

        <section className="px-6 pb-16 lg:px-10">
          <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl bg-gradient-to-r from-[#0B1F3A] via-[#123B66] to-[#0F766E] p-8 shadow-xl sm:p-10">
            <div className="flex flex-col items-start justify-between gap-7 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[#7DE3D8]">
                  IdentyBridge
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Start a response.
                </h2>
              </div>

              <Link
                href={isAuthenticated ? "/report-missing" : "/signin?redirect=/report-missing"}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-[#0B1F3A] transition hover:bg-white/90"
              >
                Get started
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        {/* ================= FOOTER ================= */}

        <footer className="border-t border-[#E8EEF5] bg-white px-6 py-7 lg:px-10">
          <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 text-xs text-[#7A8796] sm:flex-row">
            <div className="flex items-center gap-2">
              <ShieldCheck size={15} className="text-[#1D5D8F]" />
              <span>
                IdentyBridge · Identity Response Network
              </span>
            </div>

            <span>
              © 2026 IdentyBridge
            </span>
          </div>
        </footer>

      </main>
    </>
  );
}

/* =============================================================
   NETWORK NODE
============================================================= */

function NetworkNode({ icon, title, text, active }) {
  return (
    <div className="relative mb-3 flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.045] p-3.5">
      <div
        className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${active
          ? "bg-[#14B8A6]/10 text-[#7DE3D8]"
          : "bg-white/10 text-white"
          }`}
      >
        {icon}
      </div>

      <div>
        <p className="text-xs font-semibold text-white">
          {title}
        </p>
        <p className="mt-0.5 text-[10px] text-white/35">
          {text}
        </p>
      </div>

      <div className="ml-auto">
        <span className="block h-1.5 w-1.5 rounded-full bg-[#14B8A6] shadow-[0_0_8px_rgba(20,184,166,.8)]" />
      </div>
    </div>
  );
}

/* =============================================================
   SIMPLE CARD
============================================================= */

function SimpleCard({ icon, title, text }) {
  return (
    <div className="group flex items-center gap-4 rounded-xl border border-[#E8EEF5] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#E8EEF5] text-[#1D5D8F] transition group-hover:bg-[#0F766E] group-hover:text-white">
        {icon}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-[#172033]">
          {title}
        </h3>
        <p className="mt-1 text-xs text-[#7A8796]">
          {text}
        </p>
      </div>
    </div>
  );
}
