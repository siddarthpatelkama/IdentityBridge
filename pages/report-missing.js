import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  FileText,
  Loader2,
  MapPin,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import MatchCard from "../components/MatchCard";


export default function ReportMissing() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
      localStorage.removeItem("identybridge_role");
      localStorage.removeItem("identybridge_fullname");
      setIsAuthenticated(false);
      router.push("/");
    }
  };

  const [formData, setFormData] = useState({
    age_approx: "",
    gender: "",
    clothing: "",
    location_missing: "",
    physical_marks: "",
  });

  const [status, setStatus] = useState("idle");
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState("");
  const [posterStatus, setPosterStatus] = useState("idle");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const extractMatches = (data) => {
    if (!data) return [];

    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data.matches)) {
      return data.matches;
    }

    if (Array.isArray(data.results)) {
      return data.results;
    }

    if (Array.isArray(data.potentialMatches)) {
      return data.potentialMatches;
    }

    if (data.match && typeof data.match === "object") {
      return [data.match];
    }

    return [];
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setMatches([]);
    setPosterStatus("idle");

    const hasInformation =
      formData.age_approx ||
      formData.gender ||
      formData.clothing.trim() ||
      formData.location_missing.trim() ||
      formData.physical_marks.trim();

    if (!hasInformation) {
      setError(
        "Please provide at least some information about the missing person."
      );
      setStatus("error");
      return;
    }

    setStatus("loading");

    try {
      const payload = {
        age_approx: formData.age_approx
          ? Number(formData.age_approx)
          : null,
        gender: formData.gender,
        clothing: formData.clothing.trim(),
        location_missing: formData.location_missing.trim(),
        physical_marks: formData.physical_marks.trim(),
      };

      const response = await fetch("/api/intake/text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      let data = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
          data?.error ||
          "We could not process the report right now."
        );
      }

      const returnedMatches = extractMatches(data);

      setMatches(returnedMatches);

      if (returnedMatches.length > 0) {
        setStatus("matches");
      } else {
        setStatus("no-match");
      }
    } catch (err) {
      console.error("Missing person submission error:", err);

      setError(
        err?.message ||
        "Something went wrong while submitting the report. Please try again."
      );

      setStatus("error");
    }
  };

  const handleGeneratePoster = async () => {
    setPosterStatus("loading");
    setError("");

    try {
      const response = await fetch("/api/generate-poster", {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Unable to generate the missing-person poster.");
      }

      const contentType = response.headers.get("content-type") || "";

      if (contentType.includes("application/pdf")) {
        const blob = await response.blob();
        const pdfUrl = URL.createObjectURL(blob);

        window.open(pdfUrl, "_blank", "noopener,noreferrer");

        setTimeout(() => {
          URL.revokeObjectURL(pdfUrl);
        }, 60000);
      } else {
        const data = await response.json();

        const posterUrl =
          data?.url ||
          data?.pdfUrl ||
          data?.downloadUrl ||
          data?.posterUrl;

        if (!posterUrl) {
          throw new Error(
            "The poster was generated but no PDF was returned."
          );
        }

        window.open(posterUrl, "_blank", "noopener,noreferrer");
      }

      setPosterStatus("success");
    } catch (err) {
      console.error("Poster generation error:", err);

      setPosterStatus("error");
      setError(
        err?.message ||
        "We could not generate the poster right now. Please try again."
      );
    }
  };

  const handleVerified = () => {
    // MatchCard manages its own verification state.
  };

  const isLoading = status === "loading";

  return (
    <main className="min-h-screen bg-bg-main text-text-primary">
      {/* HEADER */}
      <header className="border-b border-bg-subtle bg-primary-navy text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white/10">
              <ShieldCheck
                className="h-6 w-6 text-secondary-teal"
                aria-hidden="true"
              />
            </div>

            <div>
              <p className="text-lg font-bold tracking-tight">
                IdentyBridge
              </p>

              <p className="text-xs font-medium text-white/70">
                Public Portal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-medium text-white/70">
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="rounded-md border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-white/15 cursor-pointer"
              >
                Logout
              </button>
            )}
            <div className="hidden items-center gap-2 sm:flex">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Secure Public Intake
            </div>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">

        {/* INTRO */}
        <section className="mb-8">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-secondary-teal/20 bg-secondary-teal/10 px-3 py-1 text-xs font-semibold text-secondary-teal">
              <UserRound
                className="h-3.5 w-3.5"
                aria-hidden="true"
              />
              Missing Person Report
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-primary-navy sm:text-4xl">
              Help us identify your missing loved one.
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-text-secondary sm:text-base">
              Provide the information you know. IdentyBridge will check
              available records for potential matches with unidentified
              patients.
            </p>
          </div>
        </section>

        {/* FORM + SIDE INFORMATION */}
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">

          {/* FORM */}
          <section className="card-secure p-5 sm:p-7">
            <div className="mb-6 border-b border-bg-subtle pb-5">
              <h2 className="text-lg font-bold text-primary-navy">
                Person details
              </h2>

              <p className="mt-1 text-sm text-text-secondary">
                Enter as much information as you know. You can leave fields
                blank if you are unsure.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* AGE + GENDER */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="age_approx"
                    className="mb-2 block text-sm font-semibold text-text-primary"
                  >
                    Approximate Age
                  </label>

                  <input
                    id="age_approx"
                    name="age_approx"
                    type="number"
                    min="0"
                    max="120"
                    value={formData.age_approx}
                    onChange={handleChange}
                    disabled={isLoading}
                    placeholder="e.g. 25"
                  />
                </div>

                <div>
                  <label
                    htmlFor="gender"
                    className="mb-2 block text-sm font-semibold text-text-primary"
                  >
                    Gender
                  </label>

                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    disabled={isLoading}
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                </div>
              </div>

              {/* CLOTHING */}
              <div>
                <label
                  htmlFor="clothing"
                  className="mb-2 block text-sm font-semibold text-text-primary"
                >
                  Clothing / What They Were Wearing
                </label>

                <textarea
                  id="clothing"
                  name="clothing"
                  value={formData.clothing}
                  onChange={handleChange}
                  disabled={isLoading}
                  rows={3}
                  placeholder="For example: red shirt, black trousers, white shoes"
                />
              </div>

              {/* LOCATION */}
              <div>
                <label
                  htmlFor="location_missing"
                  className="mb-2 block text-sm font-semibold text-text-primary"
                >
                  Last Known Location
                </label>

                <div className="relative">
                  <MapPin
                    className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-text-muted"
                    aria-hidden="true"
                  />

                  <input
                    id="location_missing"
                    name="location_missing"
                    type="text"
                    value={formData.location_missing}
                    onChange={handleChange}
                    disabled={isLoading}
                    placeholder="Where were they last seen?"
                    className="pl-10"
                  />
                </div>
              </div>

              {/* PHYSICAL MARKS */}
              <div>
                <label
                  htmlFor="physical_marks"
                  className="mb-2 block text-sm font-semibold text-text-primary"
                >
                  Identifying Marks
                </label>

                <textarea
                  id="physical_marks"
                  name="physical_marks"
                  value={formData.physical_marks}
                  onChange={handleChange}
                  disabled={isLoading}
                  rows={3}
                  placeholder="For example: birthmark, scar, tattoo, or other identifying feature"
                />
              </div>

              {/* ERROR */}
              {status === "error" && error && (
                <div
                  role="alert"
                  className="flex items-start gap-3 rounded-md border border-alert-emergency/20 bg-alert-emergency/5 p-4"
                >
                  <AlertCircle
                    className="mt-0.5 h-5 w-5 shrink-0 text-alert-emergency"
                    aria-hidden="true"
                  />

                  <div>
                    <p className="text-sm font-semibold text-alert-emergency">
                      Unable to submit report
                    </p>

                    <p className="mt-1 text-sm text-text-secondary">
                      {error}
                    </p>
                  </div>
                </div>
              )}

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2
                      className="h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                    Searching for potential matches...
                  </>
                ) : (
                  <>
                    Submit Missing Person Report
                    <ArrowRight
                      className="h-4 w-4"
                      aria-hidden="true"
                    />
                  </>
                )}
              </button>
            </form>
          </section>

          {/* SIDE INFORMATION */}
          <aside className="space-y-4">

            <div className="card-secure border-secondary-teal/20 bg-secondary-teal/5 p-5">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-secondary-teal/10">
                <ShieldCheck
                  className="h-5 w-5 text-secondary-teal"
                  aria-hidden="true"
                />
              </div>

              <h2 className="text-sm font-bold text-primary-navy">
                How IdentyBridge helps
              </h2>

              <p className="mt-2 text-sm leading-6 text-text-secondary">
                Your report is checked against information about unidentified
                patients so that possible connections can be identified faster.
              </p>
            </div>

            <div className="card-secure p-5">
              <div className="flex items-start gap-3">
                <FileText
                  className="mt-0.5 h-5 w-5 shrink-0 text-primary-trust"
                  aria-hidden="true"
                />

                <div>
                  <h2 className="text-sm font-bold text-primary-navy">
                    Provide what you know
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-text-secondary">
                    Exact information is not required. Even approximate
                    details can help the matching system find a potential
                    connection.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* LOADING */}
        {status === "loading" && (
          <section
            className="mt-6 rounded-md border border-primary-trust/20 bg-primary-trust/5 p-5"
            aria-live="polite"
          >
            <div className="flex items-center gap-3">
              <Loader2
                className="h-5 w-5 animate-spin text-primary-trust"
                aria-hidden="true"
              />

              <div>
                <p className="text-sm font-bold text-primary-navy">
                  Searching for potential matches...
                </p>

                <p className="mt-1 text-sm text-text-secondary">
                  Please wait while the system checks available records.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* MATCHES */}
        {status === "matches" && matches.length > 0 && (
          <section className="mt-8" aria-live="polite">
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-wider text-secondary-teal">
                Search Result
              </p>

              <h2 className="mt-1 text-xl font-bold text-primary-navy">
                Potential Matches Found
              </h2>

              <p className="mt-1 text-sm text-text-secondary">
                The system found one or more records that may correspond to
                your report.
              </p>
            </div>

            <div className="space-y-4">
              {matches.map((match, index) => (
                <MatchCard
                  key={
                    match?.id ||
                    match?.reportId ||
                    match?.matchId ||
                    `match-${index}`
                  }
                  match={match}
                  onVerified={handleVerified}
                />
              ))}
            </div>
          </section>
        )}

        {/* ZERO MATCH */}
        {status === "no-match" && (
          <section
            className="mt-8 rounded-md border border-alert-warning/20 bg-alert-warning/5 p-5 sm:p-6"
            aria-live="polite"
          >
            <div className="flex items-start gap-4">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-alert-warning/10">
                <AlertCircle
                  className="h-5 w-5 text-alert-warning"
                  aria-hidden="true"
                />
              </div>

              <div className="flex-1">
                <h2 className="text-lg font-bold text-primary-navy">
                  No potential match found
                </h2>

                <p className="mt-1 max-w-2xl text-sm leading-6 text-text-secondary">
                  We could not find a potential match in the available records
                  right now. Your report can still help with future matching.
                </p>

                <button
                  type="button"
                  onClick={handleGeneratePoster}
                  disabled={posterStatus === "loading"}
                  className="btn-primary mt-5 w-full sm:w-auto"
                >
                  {posterStatus === "loading" ? (
                    <>
                      <Loader2
                        className="h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />
                      Generating Poster...
                    </>
                  ) : (
                    <>
                      <FileText
                        className="h-4 w-4"
                        aria-hidden="true"
                      />
                      Generate Missing Poster for Social Media
                    </>
                  )}
                </button>

                {posterStatus === "success" && (
                  <div className="mt-4 flex items-center gap-2 text-sm font-medium text-alert-success">
                    <CheckCircle2
                      className="h-4 w-4"
                      aria-hidden="true"
                    />
                    Poster opened in a new tab.
                  </div>
                )}

                {posterStatus === "error" && error && (
                  <div
                    role="alert"
                    className="mt-4 flex items-start gap-2 rounded-md border border-alert-emergency/20 bg-alert-emergency/5 p-3 text-sm text-alert-emergency"
                  >
                    <AlertCircle
                      className="mt-0.5 h-4 w-4 shrink-0"
                      aria-hidden="true"
                    />
                    <span>{error}</span>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}