import { useQuery } from "@tanstack/react-query";
import { leetcodeApi } from "../api/leetcode";

/**
 * Fetches rich problem details (description HTML, topic tags, hints) for a given slug
 * via our backend proxy to the LeetCode GraphQL API.
 *
 * Only fires when `slug` is truthy and `enabled` is true.
 * On error, `isError` will be true and the UI should fall back to the "Open on LeetCode" banner.
 *
 * Returns: { data, isLoading, isFetching, isError, error }
 * where `data` = { frontendId, title, slug, difficulty, content, exampleTestcases, topicTags, hints }
 */
export const useLeetcodeProblemDetail = (slug, { enabled = true } = {}) => {
    return useQuery({
        queryKey: ["leetcodeProblemDetail", slug],
        queryFn: () => leetcodeApi.getProblemDetail(slug),
        enabled: !!slug && enabled,
        staleTime: 1000 * 60 * 60,       // cache for 1 hour — descriptions don't change often
        gcTime: 1000 * 60 * 60 * 24,     // keep in memory cache for 24 hours
        retry: 1,                          // only retry once — LeetCode GraphQL can be flaky
        retryDelay: 1000,
    });
};
