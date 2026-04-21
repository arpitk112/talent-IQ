import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { leetcodeApi } from "../api/leetcode";

/**
 * Hook to fetch all LeetCode problems from the external API.
 * Caches the result for 1 hour (staleTime) since the data doesn't change often.
 */
export const useLeetcodeProblems = ({ difficulty = "all", search = "", page = 1, pageSize = 20 } = {}) => {
    const { data: allProblems = [], isLoading, isError, error } = useQuery({
        queryKey: ["leetcodeProblems"],
        queryFn: leetcodeApi.getProblems,
        staleTime: 1000 * 60 * 60, // 1 hour — problems list rarely changes
        gcTime: 1000 * 60 * 60 * 24, // keep in cache for 24 hours
    });

    // Apply filters client-side (since the API returns all problems at once)
    const filteredProblems = useMemo(() => {
        let result = allProblems;

        // Filter out paid-only problems (no URL to redirect to)
        result = result.filter((p) => !p.paid_only);

        // Filter by difficulty
        if (difficulty !== "all") {
            result = result.filter((p) => p.difficulty.toLowerCase() === difficulty.toLowerCase());
        }

        // Filter by search query
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            result = result.filter(
                (p) =>
                    p.title.toLowerCase().includes(q) ||
                    p.frontend_id.toString().includes(q)
            );
        }

        return result;
    }, [allProblems, difficulty, search]);

    // Pagination
    const totalCount = filteredProblems.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const paginatedProblems = filteredProblems.slice((page - 1) * pageSize, page * pageSize);

    // Stats across the unfiltered (free) set for header display
    const freeProblems = useMemo(() => allProblems.filter((p) => !p.paid_only), [allProblems]);
    const easyCount = freeProblems.filter((p) => p.difficulty === "Easy").length;
    const mediumCount = freeProblems.filter((p) => p.difficulty === "Medium").length;
    const hardCount = freeProblems.filter((p) => p.difficulty === "Hard").length;

    return {
        problems: paginatedProblems,
        allFreeProblems: freeProblems,
        isLoading,
        isError,
        error,
        totalCount,
        totalPages,
        stats: {
            total: freeProblems.length,
            easy: easyCount,
            medium: mediumCount,
            hard: hardCount,
        },
    };
};

/**
 * Find a single problem by its title_slug from the cached list.
 * Returns { problem, isLoading, isError } where `problem` is undefined if not found.
 */
export const useLeetcodeProblemBySlug = (titleSlug) => {
    const { data: allProblems = [], isLoading, isError } = useQuery({
        queryKey: ["leetcodeProblems"],
        queryFn: leetcodeApi.getProblems,
        staleTime: 1000 * 60 * 60,
        gcTime: 1000 * 60 * 60 * 24,
        enabled: !!titleSlug,
    });

    const problem = useMemo(
        () => allProblems.find((p) => p.title_slug === titleSlug),
        [allProblems, titleSlug]
    );

    return { problem, isLoading, isError };
};
