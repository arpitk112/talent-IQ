import { useState, useRef, useEffect, useMemo } from "react";
import { Code2Icon, LoaderIcon, PlusIcon, Loader2Icon, AlertCircleIcon, SearchIcon, XIcon } from "lucide-react";
import { useLeetcodeProblems } from "../hooks/useLeetcodeProblems";
import { getDifficultyBadgeClass } from "../lib/utils";

function CreateSessionModal({
    isOpen,
    onClose,
    roomConfig,
    setRoomConfig,
    onCreateRoom,
    isCreating,
}) {
    const { allFreeProblems: problems, isLoading, isError } = useLeetcodeProblems();
    const [searchQuery, setSearchQuery] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const inputRef = useRef(null);
    const dropdownRef = useRef(null);

    // Find the selected problem object for display
    const selectedProblem = useMemo(
        () => problems.find((p) => p.title === roomConfig.problem),
        [problems, roomConfig.problem]
    );

    // Filter problems based on search query
    const filteredProblems = useMemo(() => {
        if (!searchQuery.trim()) return problems.slice(0, 50); // Show first 50 when no search
        const q = searchQuery.toLowerCase();
        return problems
            .filter(
                (p) =>
                    p.title.toLowerCase().includes(q) ||
                    p.frontend_id?.toString().includes(q)
            )
            .slice(0, 50); // Cap at 50 results
    }, [problems, searchQuery]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target) &&
                inputRef.current &&
                !inputRef.current.contains(e.target)
            ) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelectProblem = (problem) => {
        setRoomConfig({
            difficulty: problem.difficulty.toLowerCase(),
            problem: problem.title,
            problemSlug: problem.title_slug,
        });
        setSearchQuery("");
        setIsDropdownOpen(false);
    };

    const handleClearSelection = () => {
        setRoomConfig({ difficulty: "", problem: "", problemSlug: "" });
        setSearchQuery("");
        setIsDropdownOpen(false);
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    if (!isOpen) return null;

    return (
        <div className="modal modal-open">
            <div className="modal-box max-w-2xl">
                <h3 className="font-bold text-2xl mb-6">Create New Session</h3>

                <div className="space-y-6">
                    {/* PROBLEM SEARCH */}
                    <div className="space-y-2">
                        <label className="label">
                            <span className="label-text font-semibold">Select Problem</span>
                            <span className="label-text-alt text-error">*</span>
                        </label>

                        {isLoading ? (
                            <div className="flex items-center gap-2 text-base-content/60 py-2">
                                <Loader2Icon className="size-4 animate-spin" />
                                <span className="text-sm">Loading problems...</span>
                            </div>
                        ) : isError ? (
                            <div className="flex items-center gap-2 text-error text-sm">
                                <AlertCircleIcon className="size-4" />
                                <span>Failed to load problems. Please try again.</span>
                            </div>
                        ) : (
                            <div className="relative">
                                {/* Selected problem chip */}
                                {selectedProblem ? (
                                    <div className="flex items-center gap-3 p-3 bg-base-200 rounded-xl border border-primary/30">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-xs text-base-content/50 font-mono">
                                                    #{selectedProblem.frontend_id}
                                                </span>
                                                <span className="font-semibold truncate">{selectedProblem.title}</span>
                                                <span className={`badge badge-sm shrink-0 ${getDifficultyBadgeClass(selectedProblem.difficulty)}`}>
                                                    {selectedProblem.difficulty}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            className="btn btn-ghost btn-xs btn-circle shrink-0"
                                            onClick={handleClearSelection}
                                        >
                                            <XIcon className="size-3" />
                                        </button>
                                    </div>
                                ) : (
                                    /* Search input */
                                    <div className="relative">
                                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-base-content/40" />
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            placeholder={`Search from ${problems.length.toLocaleString()} problems by name or number...`}
                                            className="input input-bordered w-full pl-10"
                                            value={searchQuery}
                                            onChange={(e) => {
                                                setSearchQuery(e.target.value);
                                                setIsDropdownOpen(true);
                                            }}
                                            onFocus={() => setIsDropdownOpen(true)}
                                        />
                                    </div>
                                )}

                                {/* Dropdown results */}
                                {isDropdownOpen && !selectedProblem && (
                                    <div
                                        ref={dropdownRef}
                                        className="absolute top-full left-0 right-0 z-50 mt-1 bg-base-100 border border-base-300 rounded-xl shadow-xl max-h-64 overflow-y-auto"
                                    >
                                        {filteredProblems.length === 0 ? (
                                            <div className="p-4 text-center text-base-content/50 text-sm">
                                                No problems found for "{searchQuery}"
                                            </div>
                                        ) : (
                                            <>
                                                {!searchQuery && (
                                                    <div className="px-3 py-2 text-xs text-base-content/40 border-b border-base-200">
                                                        Showing first 50 — type to search all {problems.length.toLocaleString()}
                                                    </div>
                                                )}
                                                {filteredProblems.map((problem) => (
                                                    <button
                                                        key={problem.id}
                                                        type="button"
                                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-base-200 transition-colors text-left"
                                                        onClick={() => handleSelectProblem(problem)}
                                                    >
                                                        <span className="text-xs font-mono text-base-content/40 w-8 shrink-0">
                                                            #{problem.frontend_id || "-"}
                                                        </span>
                                                        <span className="flex-1 text-sm font-medium truncate">
                                                            {problem.title}
                                                        </span>
                                                        <span className={`badge badge-sm shrink-0 ${getDifficultyBadgeClass(problem.difficulty)}`}>
                                                            {problem.difficulty}
                                                        </span>
                                                    </button>
                                                ))}
                                                {searchQuery && filteredProblems.length === 50 && (
                                                    <div className="px-3 py-2 text-xs text-base-content/40 border-t border-base-200 text-center">
                                                        Showing top 50 matches — refine your search
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ROOM SUMMARY */}
                    {selectedProblem && (
                        <div className="alert alert-success">
                            <Code2Icon className="size-5" />
                            <div>
                                <p className="font-semibold">Session Ready</p>
                                <p>
                                    Problem:{" "}
                                    <span className="font-medium">{selectedProblem.title}</span>
                                    {" — "}
                                    <span className="font-medium">{selectedProblem.difficulty}</span>
                                </p>
                                <p className="text-sm opacity-80">
                                    1-on-1 session · Max 2 participants
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="modal-action">
                    <button className="btn btn-ghost" onClick={onClose}>
                        Cancel
                    </button>

                    <button
                        className="btn btn-primary gap-2"
                        onClick={onCreateRoom}
                        disabled={isCreating || !roomConfig.problem}
                    >
                        {isCreating ? (
                            <LoaderIcon className="size-5 animate-spin" />
                        ) : (
                            <PlusIcon className="size-5" />
                        )}
                        {isCreating ? "Creating..." : "Create Session"}
                    </button>
                </div>
            </div>
            <div className="modal-backdrop" onClick={onClose}></div>
        </div>
    );
}

export default CreateSessionModal;