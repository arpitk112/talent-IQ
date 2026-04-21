import DOMPurify from "dompurify";
import { ExternalLinkIcon, TagIcon, LightbulbIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { useState } from "react";
import { getDifficultyBadgeClass } from "../lib/utils";
import { useLeetcodeProblemDetail } from "../hooks/useLeetcodeProblemDetail";

// Difficulty color maps for gradient badges
const DIFFICULTY_GRADIENT = {
    Easy:   "from-emerald-500/20 to-green-500/10 text-emerald-400 border-emerald-500/30",
    Medium: "from-amber-500/20 to-yellow-500/10 text-amber-400 border-amber-500/30",
    Hard:   "from-rose-500/20 to-red-500/10 text-rose-400 border-rose-500/30",
};

/**
 * DescriptionSkeleton — shimmer loading placeholder
 */
function DescriptionSkeleton() {
    return (
        <div className="p-6 space-y-5 animate-fade-in">
            <div className="space-y-2">
                <div className="skeleton-shimmer h-4 w-full" />
                <div className="skeleton-shimmer h-4 w-5/6" />
                <div className="skeleton-shimmer h-4 w-4/6" />
            </div>
            <div className="space-y-2">
                <div className="skeleton-shimmer h-4 w-full" />
                <div className="skeleton-shimmer h-4 w-3/4" />
            </div>
            <div className="skeleton-shimmer h-24 w-full rounded-xl" />
            <div className="space-y-2">
                <div className="skeleton-shimmer h-4 w-2/3" />
                <div className="skeleton-shimmer h-4 w-1/2" />
            </div>
        </div>
    );
}

/**
 * HintsSection — collapsible hints for problems that have them
 */
function HintsSection({ hints }) {
    const [open, setOpen] = useState(false);
    if (!hints || hints.length === 0) return null;

    return (
        <div className="bg-base-100 rounded-xl border border-base-300 overflow-hidden">
            <button
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-base-200/50 transition-colors"
            >
                <div className="flex items-center gap-2 text-warning font-semibold">
                    <LightbulbIcon className="size-4" />
                    Hints ({hints.length})
                </div>
                {open ? (
                    <ChevronUpIcon className="size-4 text-base-content/40" />
                ) : (
                    <ChevronDownIcon className="size-4 text-base-content/40" />
                )}
            </button>
            {open && (
                <div className="px-5 pb-4 space-y-2 border-t border-base-300">
                    {hints.map((hint, i) => (
                        <div
                            key={i}
                            className="flex gap-3 pt-3"
                        >
                            <span className="text-warning font-bold text-sm shrink-0 mt-0.5">
                                {i + 1}.
                            </span>
                            <p
                                className="text-sm text-base-content/80 lc-content"
                                dangerouslySetInnerHTML={{
                                    __html: DOMPurify.sanitize(hint),
                                }}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

/**
 * ProblemDescription — main left panel
 *
 * For LOCAL problems: renders the rich structured data from problems.js
 * For API-only problems: fetches full description via useLeetcodeProblemDetail
 *   - While loading: shows skeleton
 *   - On success: renders sanitized HTML description + tags + hints
 *   - On error: gracefully falls back to "Open on LeetCode" banner
 */
function ProblemDescription({ problem, currentProblemId, onProblemChange, allProblems }) {
    const isApiOnly = problem?.isApiOnly;

    // Only fetch for API-only problems
    const {
        data: detail,
        isLoading: detailLoading,
        isError: detailError,
    } = useLeetcodeProblemDetail(isApiOnly ? problem?.id : null, {
        enabled: isApiOnly,
    });

    const difficultyClass =
        DIFFICULTY_GRADIENT[problem?.difficulty] ||
        "from-base-300/20 to-base-300/10 text-base-content border-base-300";

    return (
        <div className="h-full overflow-y-auto bg-base-200 flex flex-col">
            {/* ── HEADER ── */}
            <div className="sticky top-0 z-10 p-5 bg-base-100/95 backdrop-blur-sm border-b border-base-300 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        {problem?.frontend_id && (
                            <span className="text-xs text-base-content/40 font-mono mb-1 block">
                                #{problem.frontend_id}
                            </span>
                        )}
                        <h1 className="text-xl font-bold text-base-content leading-tight truncate">
                            {problem?.title || "Loading..."}
                        </h1>
                        {/* Topic tags — from API detail or local category */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {detail?.topicTags?.length > 0 ? (
                                detail.topicTags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20"
                                    >
                                        <TagIcon className="size-2.5" />
                                        {tag}
                                    </span>
                                ))
                            ) : problem?.category ? (
                                problem.category.split(" • ").map((cat) => (
                                    <span
                                        key={cat}
                                        className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20"
                                    >
                                        <TagIcon className="size-2.5" />
                                        {cat}
                                    </span>
                                ))
                            ) : null}
                        </div>
                    </div>

                    {/* Gradient difficulty badge */}
                    <span
                        className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border bg-gradient-to-br ${difficultyClass}`}
                    >
                        {problem?.difficulty}
                    </span>
                </div>

                {/* Problem picker — only shows local problems */}
                {allProblems?.length > 0 && (
                    <div className="mt-3">
                        <select
                            className="select select-sm w-full text-xs"
                            value={currentProblemId}
                            onChange={(e) => onProblemChange(e.target.value)}
                        >
                            <option value={currentProblemId} disabled={!isApiOnly}>
                                {isApiOnly
                                    ? `${problem?.title} (current — API)`
                                    : "── Switch problem ──"}
                            </option>
                            {allProblems.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.title} — {p.difficulty}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* ── CONTENT ── */}
            <div className="flex-1 p-5 space-y-4 animate-fade-in">

                {/* LOCAL RICH DATA */}
                {!isApiOnly && (
                    <>
                        {problem?.description && (
                            <div className="bg-base-100 rounded-xl border border-base-300 p-5">
                                <h2 className="text-base font-bold text-base-content mb-3 flex items-center gap-2">
                                    <span className="w-1 h-4 rounded-full bg-primary inline-block" />
                                    Description
                                </h2>
                                <div className="space-y-2 text-sm leading-relaxed text-base-content/85">
                                    <p>{problem.description.text}</p>
                                    {problem.description.notes?.map((note, idx) => (
                                        <p key={idx}>{note}</p>
                                    ))}
                                </div>
                            </div>
                        )}

                        {problem?.examples?.length > 0 && (
                            <div className="bg-base-100 rounded-xl border border-base-300 p-5">
                                <h2 className="text-base font-bold text-base-content mb-3 flex items-center gap-2">
                                    <span className="w-1 h-4 rounded-full bg-secondary inline-block" />
                                    Examples
                                </h2>
                                <div className="space-y-3">
                                    {problem.examples.map((example, idx) => (
                                        <div key={idx} className="bg-base-200 rounded-lg p-4 font-mono text-xs space-y-1.5 border border-base-300">
                                            <p className="text-base-content/40 font-sans text-xs font-semibold mb-2">
                                                Example {idx + 1}
                                            </p>
                                            <div className="flex gap-2">
                                                <span className="text-primary font-bold min-w-[64px]">Input:</span>
                                                <span className="text-base-content/85">{example.input}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <span className="text-secondary font-bold min-w-[64px]">Output:</span>
                                                <span className="text-base-content/85">{example.output}</span>
                                            </div>
                                            {example.explanation && (
                                                <div className="pt-2 border-t border-base-300 mt-1">
                                                    <span className="text-base-content/50 font-sans">
                                                        <span className="font-semibold">Explanation:</span>{" "}
                                                        {example.explanation}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {problem?.constraints?.length > 0 && (
                            <div className="bg-base-100 rounded-xl border border-base-300 p-5">
                                <h2 className="text-base font-bold text-base-content mb-3 flex items-center gap-2">
                                    <span className="w-1 h-4 rounded-full bg-accent inline-block" />
                                    Constraints
                                </h2>
                                <ul className="space-y-1.5">
                                    {problem.constraints.map((c, idx) => (
                                        <li key={idx} className="flex gap-2 text-sm text-base-content/80">
                                            <span className="text-primary mt-0.5">•</span>
                                            <code className="text-xs leading-relaxed">{c}</code>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </>
                )}

                {/* API-ONLY: Loading skeleton */}
                {isApiOnly && detailLoading && <DescriptionSkeleton />}

                {/* API-ONLY: Rich description from GraphQL */}
                {isApiOnly && detail && !detailError && (
                    <>
                        <div className="bg-base-100 rounded-xl border border-base-300 p-5">
                            <div
                                className="lc-content"
                                dangerouslySetInnerHTML={{
                                    __html: DOMPurify.sanitize(detail.content, {
                                        ALLOWED_TAGS: [
                                            "p", "br", "strong", "em", "b", "i",
                                            "ul", "ol", "li",
                                            "pre", "code", "span",
                                            "img", "a", "sup", "sub",
                                        ],
                                        ALLOWED_ATTR: ["href", "src", "alt", "class", "target"],
                                    }),
                                }}
                            />
                        </div>

                        {/* Hints (collapsible) */}
                        <HintsSection hints={detail.hints} />

                        {/* Secondary CTA: Open on LeetCode */}
                        <div className="flex items-center justify-between p-4 rounded-xl bg-base-100 border border-base-300">
                            <p className="text-xs text-base-content/50">
                                View on LeetCode for full context
                            </p>
                            <a
                                href={problem?.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-outline btn-xs gap-1.5"
                            >
                                <ExternalLinkIcon className="size-3" />
                                LeetCode
                            </a>
                        </div>
                    </>
                )}

                {/* API-ONLY: Fallback banner if GraphQL failed */}
                {isApiOnly && detailError && (
                    <div className="bg-base-100 rounded-xl border border-base-300 p-5 animate-fade-in">
                        <div className="flex items-start gap-4">
                            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <ExternalLinkIcon className="size-5 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-base-content mb-1">
                                    Open Problem on LeetCode
                                </h2>
                                <p className="text-sm text-base-content/60 mb-4">
                                    Read the full description, examples, and constraints on LeetCode.
                                </p>
                                <a
                                    href={problem?.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-primary btn-sm gap-2"
                                >
                                    <ExternalLinkIcon className="size-4" />
                                    Open on LeetCode
                                </a>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ProblemDescription;