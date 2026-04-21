import { useUser } from "@clerk/clerk-react";
import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import { useEndSession, useJoinSession, useSessionById } from "../hooks/useSessions";
import { PROBLEMS } from "../data/problems";
import { useLeetcodeProblems } from "../hooks/useLeetcodeProblems";
import { executeCode } from "../lib/piston";
import Navbar from "../components/Navbar";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { getDifficultyBadgeClass } from "../lib/utils";
import {
    ExternalLinkIcon,
    Loader2Icon,
    LogOutIcon,
    PhoneOffIcon,
    TagIcon,
} from "lucide-react";
import CodeEditorPanel from "../components/CodeEditorPanel";
import TestCasePanel from "../components/TestCasePanel";
import DOMPurify from "dompurify";
import { useLeetcodeProblemDetail } from "../hooks/useLeetcodeProblemDetail";

import useStreamClient from "../hooks/useStreamClient";
import { StreamCall, StreamVideo } from "@stream-io/video-react-sdk";
import VideoCallUI from "../components/VideoCallUI";
import toast from "react-hot-toast";
import confetti from "canvas-confetti";

// Generic starter code for API-only problems
const GENERIC_STARTER_CODE = {
    javascript: `// Write your solution here\nfunction solution() {\n  \n}\n\nconsole.log(solution());`,
    python: `# Write your solution here\ndef solution():\n    pass\n\nprint(solution())`,
    java: `public class Main {\n    public static void main(String[] args) {\n        // Write your solution here\n        System.out.println("Output: ");\n    }\n}`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\n// Write your solution here\n\nint main() {\n    cout << "Output: " << endl;\n    return 0;\n}`,
};

const DIFFICULTY_GRADIENT = {
    Easy:   "from-emerald-500/20 to-green-500/10 text-emerald-400 border-emerald-500/30",
    Medium: "from-amber-500/20 to-yellow-500/10 text-amber-400 border-amber-500/30",
    Hard:   "from-rose-500/20 to-red-500/10 text-rose-400 border-rose-500/30",
};

const createTestCase = () => ({ id: crypto.randomUUID(), expected: "" });

function SessionPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { user } = useUser();
    const [output, setOutput] = useState(null);
    const [isRunning, setIsRunning] = useState(false);

    // Test case state
    const [testCases, setTestCases] = useState([]);
    const [testResults, setTestResults] = useState(null);

    const { data: sessionData, isLoading: loadingSession, refetch } = useSessionById(id);

    const joinSessionMutation = useJoinSession();
    const endSessionMutation = useEndSession();

    const session = sessionData?.session;
    const isHost = session?.host?.clerkId === user?.id;
    const isParticipant = session?.participant?.clerkId === user?.id;

    const { call, channel, chatClient, isInitializingCall, streamClient } = useStreamClient(
        session,
        loadingSession,
        isHost,
        isParticipant
    );

    // Find local rich data
    const localProblemData = session?.problem
        ? Object.values(PROBLEMS).find((p) => p.title === session.problem)
        : null;

    // API metadata fallback
    const { allFreeProblems: apiProblems } = useLeetcodeProblems();
    const apiProblemMeta = useMemo(() => {
        if (localProblemData || !session?.problem) return null;
        return apiProblems.find((p) => p.title === session.problem) || null;
    }, [apiProblems, session?.problem, localProblemData]);

    const isApiOnlyProblem = !localProblemData && !!apiProblemMeta;

    // Fetch rich description for API-only problems
    const { data: apiDetail, isLoading: detailLoading, isError: detailError } =
        useLeetcodeProblemDetail(isApiOnlyProblem ? apiProblemMeta?.title_slug : null, {
            enabled: isApiOnlyProblem,
        });

    const getStarterCode = (lang) => {
        if (localProblemData?.starterCode?.[lang]) return localProblemData.starterCode[lang];
        return GENERIC_STARTER_CODE[lang] || "";
    };

    const [selectedLanguage, setSelectedLanguage] = useState("javascript");
    const [code, setCode] = useState(getStarterCode("javascript"));

    // Auto-join
    useEffect(() => {
        if (!session || !user || loadingSession) return;
        if (isHost || isParticipant) return;
        joinSessionMutation.mutate(id, { onSuccess: refetch });
    }, [session, user, loadingSession, isHost, isParticipant, id]); // eslint-disable-line

    // Redirect participant when session ends
    useEffect(() => {
        if (!session || loadingSession) return;
        if (session.status === "completed") navigate("/dashboard");
    }, [session, loadingSession, navigate]);

    // Update code when problem loads
    useEffect(() => {
        if (session?.problem) {
            setCode(getStarterCode(selectedLanguage));
            // Pre-populate test cases for local problems
            if (localProblemData?.examples?.length > 0) {
                setTestCases(
                    localProblemData.examples.map((ex) => ({
                        id: crypto.randomUUID(),
                        expected: ex.output,
                    }))
                );
            } else {
                setTestCases([]);
            }
            setTestResults(null);
        }
    }, [session?.problem, selectedLanguage]); // eslint-disable-line

    const handleLanguageChange = (e) => {
        const newLang = e.target.value;
        setSelectedLanguage(newLang);
        setCode(getStarterCode(newLang));
        setOutput(null);
        setTestResults(null);
    };

    const normalizeOutput = (out = "") =>
        out.trim().split("\n")
            .map((l) => l.trim().replace(/\[\s+/g, "[").replace(/\s+\]/g, "]").replace(/\s*,\s*/g, ","))
            .filter((l) => l.length > 0)
            .join("\n");

    const triggerConfetti = () => {
        confetti({ particleCount: 100, spread: 260, origin: { x: 0.2, y: 0.6 } });
        confetti({ particleCount: 100, spread: 260, origin: { x: 0.8, y: 0.6 } });
    };

    const handleRunCode = async () => {
        setIsRunning(true);
        setOutput(null);
        setTestResults(null);
        const result = await executeCode(selectedLanguage, code);
        setOutput(result);
        setIsRunning(false);
        if (result.success) {
            toast.success("Code executed successfully!");
        } else {
            toast.error("Execution failed. Check for errors.");
        }
    };

    const handleRunTests = async () => {
        if (testCases.length === 0) return;
        setIsRunning(true);
        setTestResults(null);
        const result = await executeCode(selectedLanguage, code);
        setOutput(result);
        setIsRunning(false);
        if (!result.success) {
            toast.error("Execution failed. Fix errors before running tests.");
            return;
        }
        const actualLines = normalizeOutput(result.output).split("\n");
        const results = testCases.map((tc, idx) => {
            const actual = actualLines[idx] ?? "";
            const expected = normalizeOutput(tc.expected);
            return { id: tc.id, passed: actual === expected, actual, expected };
        });
        setTestResults(results);
        const allPassed = results.every((r) => r.passed);
        if (allPassed) {
            triggerConfetti();
            toast.success(`All ${results.length} tests passed! 🎉`);
        } else {
            toast.error(`${results.filter((r) => !r.passed).length} of ${results.length} tests failed.`);
        }
    };

    const handleEndSession = () => {
        if (confirm("End this session? All participants will be notified.")) {
            endSessionMutation.mutate(id, { onSuccess: () => navigate("/dashboard") });
        }
    };

    // Test case management
    const addTestCase = () => setTestCases((prev) => [...prev, createTestCase()]);
    const removeTestCase = (tcId) => {
        setTestCases((prev) => prev.filter((tc) => tc.id !== tcId));
        setTestResults((prev) => prev?.filter((r) => r.id !== tcId) ?? null);
    };
    const updateTestCase = (tcId, field, value) =>
        setTestCases((prev) => prev.map((tc) => (tc.id === tcId ? { ...tc, [field]: value } : tc)));

    const difficultyClass =
        DIFFICULTY_GRADIENT[session?.difficulty
            ?.slice(0, 1).toUpperCase() + session?.difficulty?.slice(1)] || "";

    return (
        <div className="h-screen bg-base-100 flex flex-col">
            <Navbar />

            <div className="flex-1 overflow-hidden">
                <PanelGroup direction="horizontal">
                    {/* ─── LEFT: Problem + Editor ─── */}
                    <Panel defaultSize={50} minSize={30}>
                        <PanelGroup direction="vertical">
                            {/* PROBLEM DESCRIPTION PANEL */}
                            <Panel defaultSize={50} minSize={20}>
                                <div className="h-full overflow-y-auto bg-base-200 flex flex-col">
                                    {/* Header */}
                                    <div className="sticky top-0 z-10 p-5 bg-base-100/95 backdrop-blur-sm border-b border-base-300 shadow-sm">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                {/* Live session indicator */}
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="relative flex h-2 w-2">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
                                                    </span>
                                                    <span className="text-xs text-base-content/50 font-medium">
                                                        Live Session • Host: {session?.host?.name || "..."}
                                                        {" "}• {session?.participant ? "2" : "1"}/2 participants
                                                    </span>
                                                </div>
                                                <h1 className="text-xl font-bold text-base-content leading-tight">
                                                    {session?.problem || "Loading..."}
                                                </h1>
                                                {/* Topic tags */}
                                                {apiDetail?.topicTags?.length > 0 && (
                                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                                        {apiDetail.topicTags.slice(0, 4).map((tag) => (
                                                            <span
                                                                key={tag}
                                                                className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20"
                                                            >
                                                                <TagIcon className="size-2.5" />
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0">
                                                {/* Gradient difficulty badge */}
                                                <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border bg-gradient-to-br ${difficultyClass}`}>
                                                    {session?.difficulty
                                                        ? session.difficulty.slice(0,1).toUpperCase() + session.difficulty.slice(1)
                                                        : ""}
                                                </span>

                                                {isHost && session?.status === "active" && (
                                                    <button
                                                        onClick={handleEndSession}
                                                        disabled={endSessionMutation.isPending}
                                                        className="btn btn-error btn-sm gap-1.5"
                                                    >
                                                        {endSessionMutation.isPending ? (
                                                            <Loader2Icon className="w-3.5 h-3.5 animate-spin" />
                                                        ) : (
                                                            <LogOutIcon className="w-3.5 h-3.5" />
                                                        )}
                                                        End
                                                    </button>
                                                )}
                                                {session?.status === "completed" && (
                                                    <span className="badge badge-ghost badge-sm">Completed</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 p-5 space-y-4 animate-fade-in">
                                        {/* LOCAL RICH DATA */}
                                        {localProblemData?.description && (
                                            <div className="bg-base-100 rounded-xl border border-base-300 p-5">
                                                <h2 className="text-base font-bold mb-3 flex items-center gap-2">
                                                    <span className="w-1 h-4 rounded-full bg-primary inline-block" />
                                                    Description
                                                </h2>
                                                <div className="text-sm leading-relaxed text-base-content/85 space-y-2">
                                                    <p>{localProblemData.description.text}</p>
                                                    {localProblemData.description.notes?.map((n, i) => (
                                                        <p key={i}>{n}</p>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {localProblemData?.examples?.length > 0 && (
                                            <div className="bg-base-100 rounded-xl border border-base-300 p-5">
                                                <h2 className="text-base font-bold mb-3 flex items-center gap-2">
                                                    <span className="w-1 h-4 rounded-full bg-secondary inline-block" />
                                                    Examples
                                                </h2>
                                                <div className="space-y-3">
                                                    {localProblemData.examples.map((ex, i) => (
                                                        <div key={i} className="bg-base-200 rounded-lg p-4 font-mono text-xs border border-base-300 space-y-1.5">
                                                            <p className="text-base-content/40 font-sans text-xs font-semibold mb-2">
                                                                Example {i + 1}
                                                            </p>
                                                            <div className="flex gap-2">
                                                                <span className="text-primary font-bold min-w-[64px]">Input:</span>
                                                                <span>{ex.input}</span>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <span className="text-secondary font-bold min-w-[64px]">Output:</span>
                                                                <span>{ex.output}</span>
                                                            </div>
                                                            {ex.explanation && (
                                                                <div className="pt-2 border-t border-base-300 text-base-content/50 font-sans">
                                                                    <span className="font-semibold">Explanation:</span> {ex.explanation}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {localProblemData?.constraints?.length > 0 && (
                                            <div className="bg-base-100 rounded-xl border border-base-300 p-5">
                                                <h2 className="text-base font-bold mb-3 flex items-center gap-2">
                                                    <span className="w-1 h-4 rounded-full bg-accent inline-block" />
                                                    Constraints
                                                </h2>
                                                <ul className="space-y-1.5">
                                                    {localProblemData.constraints.map((c, i) => (
                                                        <li key={i} className="flex gap-2 text-sm text-base-content/80">
                                                            <span className="text-primary mt-0.5">•</span>
                                                            <code className="text-xs">{c}</code>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* API-ONLY: Loading skeleton */}
                                        {isApiOnlyProblem && detailLoading && (
                                            <div className="space-y-3 animate-fade-in">
                                                <div className="skeleton-shimmer h-4 w-full" />
                                                <div className="skeleton-shimmer h-4 w-5/6" />
                                                <div className="skeleton-shimmer h-24 w-full rounded-xl" />
                                                <div className="skeleton-shimmer h-4 w-4/6" />
                                            </div>
                                        )}

                                        {/* API-ONLY: Rich HTML description */}
                                        {isApiOnlyProblem && apiDetail && !detailError && (
                                            <>
                                                <div className="bg-base-100 rounded-xl border border-base-300 p-5">
                                                    <div
                                                        className="lc-content"
                                                        dangerouslySetInnerHTML={{
                                                            __html: DOMPurify.sanitize(apiDetail.content, {
                                                                ALLOWED_TAGS: [
                                                                    "p","br","strong","em","b","i",
                                                                    "ul","ol","li","pre","code","span",
                                                                    "img","a","sup","sub",
                                                                ],
                                                                ALLOWED_ATTR: ["href","src","alt","class","target"],
                                                            }),
                                                        }}
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between p-4 rounded-xl bg-base-100 border border-base-300">
                                                    <p className="text-xs text-base-content/50">View on LeetCode for full context</p>
                                                    <a
                                                        href={apiProblemMeta?.url}
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

                                        {/* API-ONLY: Fallback banner */}
                                        {isApiOnlyProblem && (detailError || (!detailLoading && !apiDetail)) && (
                                            <div className="bg-base-100 rounded-xl border border-base-300 p-5 animate-fade-in">
                                                <div className="flex items-start gap-4">
                                                    <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                                        <ExternalLinkIcon className="size-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <h2 className="text-base font-bold mb-1">Open Problem on LeetCode</h2>
                                                        <p className="text-sm text-base-content/60 mb-4">
                                                            Read the full description, examples, and constraints on LeetCode.
                                                        </p>
                                                        <a
                                                            href={apiProblemMeta?.url}
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

                                        {/* No problem selected */}
                                        {!session?.problem && !loadingSession && (
                                            <div className="flex flex-col items-center justify-center py-16 text-base-content/30 text-center">
                                                <p className="text-sm">Waiting for the session to start...</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Panel>

                            <PanelResizeHandle className="h-1.5 bg-base-300 hover:bg-primary/50 transition-colors cursor-row-resize" />

                            {/* CODE EDITOR + TEST PANEL */}
                            <Panel defaultSize={50} minSize={20}>
                                <PanelGroup direction="vertical">
                                    <Panel defaultSize={65} minSize={30}>
                                        <CodeEditorPanel
                                            selectedLanguage={selectedLanguage}
                                            code={code}
                                            isRunning={isRunning}
                                            onLanguageChange={handleLanguageChange}
                                            onCodeChange={(value) => setCode(value)}
                                            onRunCode={handleRunCode}
                                        />
                                    </Panel>

                                    <PanelResizeHandle className="h-1.5 bg-base-300 hover:bg-primary/50 transition-colors cursor-row-resize" />

                                    <Panel defaultSize={35} minSize={15}>
                                        <TestCasePanel
                                            output={output}
                                            isRunning={isRunning}
                                            testCases={testCases}
                                            testResults={testResults}
                                            onAddTestCase={addTestCase}
                                            onRemoveTestCase={removeTestCase}
                                            onUpdateTestCase={updateTestCase}
                                            onRunTests={handleRunTests}
                                        />
                                    </Panel>
                                </PanelGroup>
                            </Panel>
                        </PanelGroup>
                    </Panel>

                    <PanelResizeHandle className="w-1.5 bg-base-300 hover:bg-primary/50 transition-colors cursor-col-resize" />

                    {/* ─── RIGHT: Video Call + Chat ─── */}
                    <Panel defaultSize={50} minSize={30}>
                        <div className="h-full bg-base-200 p-4 overflow-auto">
                            {isInitializingCall ? (
                                <div className="h-full flex items-center justify-center">
                                    <div className="text-center animate-fade-in">
                                        <Loader2Icon className="w-12 h-12 mx-auto animate-spin text-primary mb-4" />
                                        <p className="text-lg font-medium">Connecting to video call...</p>
                                    </div>
                                </div>
                            ) : !streamClient || !call ? (
                                <div className="h-full flex items-center justify-center">
                                    <div className="card bg-base-100 shadow-xl max-w-md animate-slide-up">
                                        <div className="card-body items-center text-center">
                                            <div className="w-20 h-20 bg-error/10 rounded-full flex items-center justify-center mb-4">
                                                <PhoneOffIcon className="w-10 h-10 text-error" />
                                            </div>
                                            <h2 className="card-title text-2xl">Connection Failed</h2>
                                            <p className="text-base-content/70">Unable to connect to the video call</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full">
                                    <StreamVideo client={streamClient}>
                                        <StreamCall call={call}>
                                            <VideoCallUI chatClient={chatClient} channel={channel} />
                                        </StreamCall>
                                    </StreamVideo>
                                </div>
                            )}
                        </div>
                    </Panel>
                </PanelGroup>
            </div>
        </div>
    );
}

export default SessionPage;