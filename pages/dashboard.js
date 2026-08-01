import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabaseClient";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock3,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";

const EMPTY_DATA = {
  missingReports: [],
  unidentifiedPatients: [],
};

function normalizeDashboardData(data) {
  if (!data || typeof data !== "object") {
    return EMPTY_DATA;
  }

  return {
    missingReports: Array.isArray(data.missingReports)
      ? data.missingReports
      : Array.isArray(data.activeMissingReports)
        ? data.activeMissingReports
        : Array.isArray(data.missing)
          ? data.missing
          : [],

    unidentifiedPatients: Array.isArray(data.unidentifiedPatients)
      ? data.unidentifiedPatients
      : Array.isArray(data.patients)
        ? data.patients
        : Array.isArray(data.unidentified)
          ? data.unidentified
          : [],
  };
}

function getPersonName(item) {
  return (
    item?.name ||
    item?.fullName ||
    item?.personName ||
    item?.patientName ||
    "Unknown Person"
  );
}

function getLocation(item) {
  return (
    item?.location ||
    item?.location_found ||
    item?.location_missing ||
    item?.lastKnownLocation ||
    "Location unavailable"
  );
}

function getAge(item) {
  const age =
    item?.age ??
    item?.age_approx ??
    item?.age_estimate;

  if (age === undefined || age === null || age === "") {
    return "—";
  }

  return `${age}`;
}

function getGender(item) {
  return item?.gender || "—";
}

function getStatus(item) {
  const rawStatus =
    item?.status ||
    item?.matchStatus ||
    item?.caseStatus ||
    "Active";

  return String(rawStatus);
}

function StatusBadge({ status }) {
  const normalized = String(status).toLowerCase();

  const isMatched =
    normalized.includes("match") ||
    normalized.includes("verified") ||
    normalized.includes("identified");

  const isPending =
    normalized.includes("pending") ||
    normalized.includes("search");

  if (isMatched) {
    return (
      <span className="badge-secure badge-success">
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
        Matched
      </span>
    );
  }

  if (isPending) {
    return (
      <span className="badge-secure badge-warning">
        <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
        Pending
      </span>
    );
  }

  return (
    <span className="badge-secure badge-info">
      <Activity className="h-3.5 w-3.5" aria-hidden="true" />
      Active
    </span>
  );
}

function SummaryCard({ icon: Icon, label, value, description }) {
  return (
    <div className="card-secure p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-text-secondary">
            {label}
          </p>

          <p className="mt-2 text-3xl font-bold tracking-tight text-primary-navy">
            {value}
          </p>

          <p className="mt-1 text-xs text-text-muted">
            {description}
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary-trust/10">
          <Icon
            className="h-5 w-5 text-primary-trust"
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );
}

function EmptyTableState({ message }) {
  return (
    <div className="px-6 py-12 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-md bg-bg-subtle">
        <Search
          className="h-5 w-5 text-text-muted"
          aria-hidden="true"
        />
      </div>

      <p className="mt-3 text-sm font-medium text-text-primary">
        No records available
      </p>

      <p className="mt-1 text-sm text-text-muted">
        {message}
      </p>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(EMPTY_DATA);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

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

  const fetchDashboardData = async () => {
    setStatus("loading");
    setError("");

    try {
      const response = await fetch("/api/dashboard", {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      let responseData = null;

      try {
        responseData = await response.json();
      } catch {
        responseData = null;
      }

      if (!response.ok) {
        throw new Error(
          responseData?.message ||
          responseData?.error ||
          "Unable to load dashboard data."
        );
      }

      setData(normalizeDashboardData(responseData));
      setLastUpdated(new Date());
      setStatus("success");
    } catch (err) {
      console.error("Dashboard fetch error:", err);

      setError(
        err?.message ||
        "Unable to connect to the dashboard service."
      );

      setStatus("error");
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const matchedCount = useMemo(() => {
    const allRecords = [
      ...data.missingReports,
      ...data.unidentifiedPatients,
    ];

    return allRecords.filter((item) => {
      const currentStatus = getStatus(item).toLowerCase();

      return (
        currentStatus.includes("match") ||
        currentStatus.includes("verified") ||
        currentStatus.includes("identified")
      );
    }).length;
  }, [data]);

  const activeMissingCount = data.missingReports.filter((item) => {
    const currentStatus = getStatus(item).toLowerCase();

    return (
      !currentStatus.includes("match") &&
      !currentStatus.includes("verified")
    );
  }).length;

  const unidentifiedCount = data.unidentifiedPatients.length;

  return (
    <main className="min-h-screen bg-bg-main text-text-primary">
      {/* HEADER */}
      <header className="border-b border-primary-inst bg-primary-navy text-white">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-white/10">
                <ShieldCheck
                  className="h-6 w-6 text-secondary-soft-teal"
                  aria-hidden="true"
                />
              </div>

              <div>
                <p className="text-xl font-bold tracking-tight">
                  IdentyBridge
                </p>

                <p className="text-xs font-medium text-white/70">
                  System Overview Dashboard
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/80 sm:flex">
                <Activity
                  className="h-4 w-4 text-secondary-soft-teal"
                  aria-hidden="true"
                />
                System Monitoring
              </div>

              {isAuthenticated && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-md border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-white/15 cursor-pointer"
                >
                  Logout
                </button>
              )}

              <button
                type="button"
                onClick={fetchDashboardData}
                disabled={status === "loading"}
                className="border-white/20 bg-white/10 text-white hover:bg-white/15"
                aria-label="Refresh dashboard data"
              >
                <RefreshCw
                  className={`h-4 w-4 ${status === "loading" ? "animate-spin" : ""
                    }`}
                  aria-hidden="true"
                />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* PAGE INTRO */}
        <section className="mb-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary-trust/20 bg-primary-trust/5 px-3 py-1 text-xs font-semibold text-primary-trust">
                <ShieldCheck
                  className="h-3.5 w-3.5"
                  aria-hidden="true"
                />
                Operations Overview
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-primary-navy sm:text-4xl">
                Identification Operations
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary sm:text-base">
                Monitor missing-person reports and unidentified patients
                from one central operational view.
              </p>
            </div>

            {lastUpdated && status === "success" && (
              <p className="text-xs text-text-muted">
                Last updated{" "}
                {lastUpdated.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
          </div>
        </section>

        {/* ERROR */}
        {status === "error" && (
          <section
            role="alert"
            className="mb-6 flex flex-col gap-4 rounded-md border border-alert-emergency/20 bg-alert-emergency/5 p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-3">
              <AlertCircle
                className="mt-0.5 h-5 w-5 shrink-0 text-alert-emergency"
                aria-hidden="true"
              />

              <div>
                <p className="text-sm font-bold text-alert-emergency">
                  Dashboard data unavailable
                </p>

                <p className="mt-1 text-sm text-text-secondary">
                  {error}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={fetchDashboardData}
              className="btn-outline shrink-0"
            >
              <RefreshCw
                className="h-4 w-4"
                aria-hidden="true"
              />
              Try Again
            </button>
          </section>
        )}

        {/* SUMMARY CARDS */}
        <section
          className="mb-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          aria-label="System statistics"
        >
          <SummaryCard
            icon={Users}
            label="Active Missing Reports"
            value={status === "loading" ? "—" : activeMissingCount}
            description="Reports currently requiring attention"
          />

          <SummaryCard
            icon={UserRound}
            label="Unidentified Patients"
            value={status === "loading" ? "—" : unidentifiedCount}
            description="Patients awaiting identification"
          />

          <SummaryCard
            icon={Search}
            label="Potential Matches"
            value={status === "loading" ? "—" : matchedCount}
            description="Records with matching activity"
          />

          <SummaryCard
            icon={CheckCircle2}
            label="System Status"
            value={status === "loading" ? "..." : status === "success" ? "Live" : "Offline"}
            description={
              status === "success"
                ? "Dashboard connection active"
                : "Connection requires attention"
            }
          />
        </section>

        {/* LOADING STATE */}
        {status === "loading" && (
          <section
            className="mb-7 card-secure p-6"
            aria-live="polite"
          >
            <div className="flex items-center justify-center gap-3 py-8">
              <Loader2
                className="h-5 w-5 animate-spin text-primary-trust"
                aria-hidden="true"
              />

              <p className="text-sm font-medium text-text-secondary">
                Loading operational data...
              </p>
            </div>
          </section>
        )}

        {/* TABLES */}
        {status !== "loading" && (
          <div className="grid gap-6 xl:grid-cols-2">

            {/* MISSING REPORTS */}
            <section className="card-secure overflow-hidden">
              <div className="border-b border-bg-subtle px-5 py-5 sm:px-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary-trust/10">
                        <Users
                          className="h-5 w-5 text-primary-trust"
                          aria-hidden="true"
                        />
                      </div>

                      <h2 className="text-lg font-bold text-primary-navy">
                        Active Missing Reports
                      </h2>
                    </div>

                    <p className="mt-2 text-sm text-text-secondary">
                      People reported missing by families.
                    </p>
                  </div>

                  <span className="badge-secure badge-info">
                    {data.missingReports.length} Records
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                {data.missingReports.length === 0 ? (
                  <EmptyTableState message="No missing-person reports are currently available." />
                ) : (
                  <table className="w-full min-w-[600px] text-left">
                    <thead className="bg-bg-main">
                      <tr className="border-b border-bg-subtle">
                        <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-text-muted">
                          Person
                        </th>

                        <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-text-muted">
                          Age / Gender
                        </th>

                        <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-text-muted">
                          Location
                        </th>

                        <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-text-muted">
                          Status
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-bg-subtle">
                      {data.missingReports.map((person, index) => (
                        <tr
                          key={
                            person?.id ||
                            person?.reportId ||
                            `missing-${index}`
                          }
                          className="transition-colors hover:bg-bg-main"
                        >
                          <td className="px-5 py-4">
                            <div className="font-semibold text-text-primary">
                              {getPersonName(person)}
                            </div>

                            {person?.clothing && (
                              <div className="mt-1 max-w-[180px] truncate text-xs text-text-muted">
                                {person.clothing}
                              </div>
                            )}
                          </td>

                          <td className="px-5 py-4 text-sm text-text-secondary">
                            {getAge(person)}{" "}
                            <span className="text-text-muted">/</span>{" "}
                            {getGender(person)}
                          </td>

                          <td className="max-w-[180px] px-5 py-4 text-sm text-text-secondary">
                            <span className="block truncate">
                              {getLocation(person)}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <StatusBadge
                              status={getStatus(person)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>

            {/* UNIDENTIFIED PATIENTS */}
            <section className="card-secure overflow-hidden">
              <div className="border-b border-bg-subtle px-5 py-5 sm:px-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary-teal/10">
                        <UserRound
                          className="h-5 w-5 text-secondary-teal"
                          aria-hidden="true"
                        />
                      </div>

                      <h2 className="text-lg font-bold text-primary-navy">
                        Unidentified Patients
                      </h2>
                    </div>

                    <p className="mt-2 text-sm text-text-secondary">
                      Patients awaiting identification or family matching.
                    </p>
                  </div>

                  <span className="badge-secure badge-info">
                    {data.unidentifiedPatients.length} Records
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                {data.unidentifiedPatients.length === 0 ? (
                  <EmptyTableState message="No unidentified patient records are currently available." />
                ) : (
                  <table className="w-full min-w-[600px] text-left">
                    <thead className="bg-bg-main">
                      <tr className="border-b border-bg-subtle">
                        <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-text-muted">
                          Patient
                        </th>

                        <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-text-muted">
                          Age / Gender
                        </th>

                        <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-text-muted">
                          Location
                        </th>

                        <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-text-muted">
                          Status
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-bg-subtle">
                      {data.unidentifiedPatients.map((patient, index) => (
                        <tr
                          key={
                            patient?.id ||
                            patient?.patientId ||
                            `patient-${index}`
                          }
                          className="transition-colors hover:bg-bg-main"
                        >
                          <td className="px-5 py-4">
                            <div className="font-semibold text-text-primary">
                              {getPersonName(patient)}
                            </div>

                            {patient?.clothing && (
                              <div className="mt-1 max-w-[180px] truncate text-xs text-text-muted">
                                {patient.clothing}
                              </div>
                            )}
                          </td>

                          <td className="px-5 py-4 text-sm text-text-secondary">
                            {getAge(patient)}{" "}
                            <span className="text-text-muted">/</span>{" "}
                            {getGender(patient)}
                          </td>

                          <td className="max-w-[180px] px-5 py-4 text-sm text-text-secondary">
                            <span className="block truncate">
                              {getLocation(patient)}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <StatusBadge
                              status={getStatus(patient)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          </div>
        )}

        {/* FOOTER STATUS */}
        <footer className="mt-8 border-t border-bg-subtle pt-5">
          <div className="flex flex-col gap-2 text-xs text-text-muted sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck
                className="h-4 w-4 text-secondary-teal"
                aria-hidden="true"
              />
              <span>
                IdentyBridge emergency identification platform
              </span>
            </div>

            <span>
              Frontend operations interface
            </span>
          </div>
        </footer>
      </div>
    </main>
  );
}