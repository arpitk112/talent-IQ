import { useState } from "react";
import { Link } from "react-router";
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    SearchIcon,
    Code2Icon,
    AlertCircleIcon,
    ChevronRightIcon as ArrowIcon,
    ZapIcon,
    TrophyIcon,
    FlameIcon,
    XIcon,
} from "lucide-react";
import Navbar from "../components/Navbar";
import { useLeetcodeProblems } from "../hooks/useLeetcodeProblems";

const PAGE_SIZE = 20;

// Difficulty config with colors, gradients, and icons
const DIFFICULTY_CONFIG = {
    Easy:   { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", gradient: "from-emerald-500/20 to-green-500/5",   icon: ZapIcon },
    Medium: { color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/20",   gradient: "from-amber-500/20 to-yellow-500/5", icon: TrophyIcon },
    Hard:   { color: "text-rose-400",    bg: "bg-rose-500/10",    border: "border-rose-500/20",    gradient: "from-rose-500/20 to-red-500/5",     icon: FlameIcon },
};

// Skeleton row component
function ProblemSkeleton() {
    return (
        <div className="bg-base-100 rounded-xl border border-base-300 p-4 flex items-center gap-4">
            <div className="skeleton-shimmer size-10 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="skeleton-shimmer h-4 w-48 rounded" />
                <div className="skeleton-shimmer h-3 w-24 rounded" />
            </div>
            <div className="skeleton-shimmer h-6 w-16 rounded-full shrink-0" />
        </div>
    );
}

function ProblemsPage() {
    const [difficulty, setDifficulty] = useState("all");
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [page, setPage] = useState(1);

    const { problems, isLoading, isError, error, totalCount, totalPages, stats } =
        useLeetcodeProblems({ difficulty, search, page, pageSize: PAGE_SIZE });

    const handleDifficultyChange = (val) => { setDifficulty(val); setPage(1); };
    const handleSearch = (e) => { e.preventDefault(); setSearch(searchInput); setPage(1); };
    const handleSearchClear = () => { setSearchInput(""); setSearch(""); setPage(1); };

    return (
        <div className="min-h-screen bg-base-200">
            <Navbar />

            <div className="max-w-5xl mx-auto px-4 py-10">
                {/* ── HERO HEADER ── */}
                <div className="mb-10 animate-fade-in">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="size-10 rounded-xl bg-primary/15 flex items-center justify-center">
                            <Code2Icon className="size-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold tracking-tight">Practice Problems</h1>
                            <p className="text-base-content/50 text-sm mt-0.5">
                                {isLoading ? "Loading..." : `${stats.total.toLocaleString()}+ LeetCode problems to sharpen your skills`}
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── STAT CARDS ── */}
                {!isLoading && !isError && (
                    <div className="grid grid-cols-3 gap-4 mb-8 animate-slide-up">
                        {[
                            { label: "Easy",   count: stats.easy,   key: "Easy" },
                            { label: "Medium", count: stats.medium, key: "Medium" },
                            { label: "Hard",   count: stats.hard,   key: "Hard" },
                        ].map(({ label, count, key }) => {
                            const cfg = DIFFICULTY_CONFIG[key];
                            const Icon = cfg.icon;
                            return (
                                <button
                                    key={key}
                                    onClick={() => handleDifficultyChange(difficulty === key ? "all" : key)}
                                    className={`
                                        relative overflow-hidden rounded-2xl border p-4 text-left
                                        transition-all duration-200 cursor-pointer
                                        hover:scale-[1.02] active:scale-[0.98]
                                        bg-gradient-to-br ${cfg.gradient} ${cfg.border}
                                        ${difficulty === key ? "ring-2 ring-offset-2 ring-offset-base-200 " + cfg.border : ""}
                                    `}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`text-xs font-semibold uppercase tracking-wider ${cfg.color}`}>
                                            {label}
                                        </span>
                                        <Icon className={`size-4 ${cfg.color}`} />
                                    </div>
                                    <p className={`text-2xl font-extrabold ${cfg.color}`}>
                                        {count.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-base-content/40 mt-0.5">problems</p>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Skeleton for stat cards while loading */}
                {isLoading && (
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        {[1,2,3].map((i) => (
                            <div key={i} className="rounded-2xl border border-base-300 p-4 space-y-2">
                                <div className="skeleton-shimmer h-3 w-16 rounded" />
                                <div className="skeleton-shimmer h-7 w-12 rounded" />
                            </div>
                        ))}
                    </div>
                )}

                {/* ── FILTERS ── */}
                <div className="flex flex-col sm:flex-row gap-3 mb-5 animate-fade-in">
                    {/* Search */}
                    <form onSubmit={handleSearch} className="flex flex-1 gap-2">
                        <div className="relative flex-1">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-base-content/40" />
                            <input
                                type="text"
                                placeholder="Search by title or #number..."
                                className="input input-bordered w-full pl-10 pr-4 bg-base-100 focus:border-primary transition-colors"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary px-6">
                            Search
                        </button>
                        {search && (
                            <button
                                type="button"
                                className="btn btn-ghost gap-1"
                                onClick={handleSearchClear}
                            >
                                <XIcon className="size-4" />
                                Clear
                            </button>
                        )}
                    </form>

                    {/* Difficulty pills */}
                    <div className="flex gap-1.5">
                        {["all", "Easy", "Medium", "Hard"].map((d) => {
                            const cfg = d !== "all" ? DIFFICULTY_CONFIG[d] : null;
                            const isActive = difficulty === d;
                            return (
                                <button
                                    key={d}
                                    onClick={() => handleDifficultyChange(d)}
                                    className={`
                                        px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-200
                                        ${isActive
                                            ? d === "all"
                                                ? "bg-primary text-primary-content border-primary"
                                                : `${cfg.bg} ${cfg.color} ${cfg.border}`
                                            : "bg-base-100 border-base-300 text-base-content/60 hover:text-base-content hover:border-base-content/30"
                                        }
                                    `}
                                >
                                    {d === "all" ? "All" : d}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Results count */}
                {!isLoading && !isError && (
                    <p className="text-xs text-base-content/40 mb-4">
                        Showing {problems.length} of {totalCount.toLocaleString()} problems
                        {search && <span> matching <strong className="text-base-content/70">"{search}"</strong></span>}
                        {difficulty !== "all" && <span> · <strong className="text-base-content/70">{difficulty}</strong></span>}
                    </p>
                )}

                {/* ── ERROR STATE ── */}
                {isError && !isLoading && (
                    <div className="alert alert-error shadow-lg mb-6 animate-fade-in">
                        <AlertCircleIcon className="size-5" />
                        <div>
                            <p className="font-bold">Failed to load problems</p>
                            <p className="text-sm">{error?.message || "Please try refreshing."}</p>
                        </div>
                    </div>
                )}

                {/* ── LOADING SKELETONS ── */}
                {isLoading && (
                    <div className="space-y-2 animate-fade-in">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <ProblemSkeleton key={i} />
                        ))}
                    </div>
                )}

                {/* ── PROBLEMS LIST ── */}
                {!isLoading && !isError && (
                    <div className="space-y-2 animate-fade-in">
                        {problems.length === 0 ? (
                            <div className="bg-base-100 rounded-2xl border border-base-300 py-20 text-center">
                                <Code2Icon className="size-12 mx-auto text-base-content/15 mb-4" />
                                <p className="text-lg font-semibold">No problems found</p>
                                <p className="text-base-content/40 text-sm mt-1">
                                    Try adjusting your search or filters
                                </p>
                            </div>
                        ) : (
                            problems.map((problem) => {
                                const cfg = DIFFICULTY_CONFIG[problem.difficulty];
                                return (
                                    <Link
                                        key={problem.id}
                                        to={`/problem/${problem.title_slug}`}
                                        className="group flex items-center gap-4 bg-base-100 hover:bg-base-100/80 border border-base-300 hover:border-primary/30 rounded-xl px-5 py-4 transition-all duration-200 hover:shadow-md hover:-translate-y-px"
                                    >
                                        {/* # badge */}
                                        <div className="size-9 shrink-0 rounded-lg bg-base-200 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                                            <span className="text-xs font-bold text-base-content/40 group-hover:text-primary transition-colors">
                                                #{problem.frontend_id}
                                            </span>
                                        </div>

                                        {/* Title + info badges */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h2 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                                                    {problem.title}
                                                </h2>
                                                {problem.has_solution && (
                                                    <span className="hidden sm:inline text-xs px-1.5 py-0.5 rounded bg-base-200 text-base-content/40 border border-base-300">
                                                        Solution
                                                    </span>
                                                )}
                                                {problem.has_video_solution && (
                                                    <span className="hidden sm:inline text-xs px-1.5 py-0.5 rounded bg-base-200 text-base-content/40 border border-base-300">
                                                        Video
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Difficulty badge */}
                                        <span
                                            className={`shrink-0 text-xs font-semibold px-3 py-1 rounded-full border ${cfg?.bg} ${cfg?.color} ${cfg?.border}`}
                                        >
                                            {problem.difficulty}
                                        </span>

                                        {/* Arrow */}
                                        <ArrowIcon className="size-4 text-base-content/20 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                                    </Link>
                                );
                            })
                        )}
                    </div>
                )}

                {/* ── PAGINATION ── */}
                {!isLoading && !isError && totalPages > 1 && (
                    <div className="flex items-center justify-center gap-1.5 mt-8 animate-fade-in">
                        <button
                            className="btn btn-sm btn-ghost"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            <ChevronLeftIcon className="size-4" />
                        </button>

                        {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 7)        pageNum = i + 1;
                            else if (page <= 4)         pageNum = i + 1;
                            else if (page >= totalPages - 3) pageNum = totalPages - 6 + i;
                            else                        pageNum = page - 3 + i;
                            return (
                                <button
                                    key={pageNum}
                                    className={`btn btn-sm ${page === pageNum ? "btn-primary" : "btn-ghost"}`}
                                    onClick={() => setPage(pageNum)}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}

                        <button
                            className="btn btn-sm btn-ghost"
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                        >
                            <ChevronRightIcon className="size-4" />
                        </button>

                        <span className="text-xs text-base-content/40 ml-2">
                            Page {page} of {totalPages}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ProblemsPage;