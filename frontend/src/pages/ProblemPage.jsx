import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { PROBLEMS } from "../data/problems";
import Navbar from "../components/Navbar";

import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import ProblemDescription from "../components/ProblemDescription";
import TestCasePanel from "../components/TestCasePanel";
import CodeEditorPanel from "../components/CodeEditorPanel";
import { executeCode } from "../lib/piston";
import { useLeetcodeProblemBySlug } from "../hooks/useLeetcodeProblems";

import toast from "react-hot-toast";
import confetti from "canvas-confetti";
import { Loader2Icon } from "lucide-react";

// Generic starter code for API-only problems
const GENERIC_STARTER_CODE = {
    javascript: `// Write your solution here
function solution() {
  
}

// Test your code below
console.log(solution());`,
    python: `# Write your solution here
def solution():
    pass

# Test your code below
print(solution())`,
    java: `public class Main {
    // Write your solution here
    
    public static void main(String[] args) {
        // Test your code below
        System.out.println("Output: ");
    }
}`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

// Write your solution here

int main() {
    // Test your code below
    cout << "Output: " << endl;
    return 0;
}`,
};

// Create an empty test case object
const createTestCase = (overrides = {}) => ({
    id: crypto.randomUUID(),
    expected: "",
    ...overrides,
});

function ProblemPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [selectedLanguage, setSelectedLanguage] = useState("javascript");
    const [output, setOutput] = useState(null);
    const [isRunning, setIsRunning] = useState(false);

    // Test case state
    const [testCases, setTestCases] = useState([]);
    const [testResults, setTestResults] = useState(null);

    // Local vs API problem resolution
    const localProblem = id ? PROBLEMS[id] : null;
    const { problem: apiProblem, isLoading: apiLoading } = useLeetcodeProblemBySlug(
        localProblem ? null : id
    );

    const hasLocalData = !!localProblem;
    const isLoadingApi = !localProblem && apiLoading;
    const problemNotFound = !localProblem && !apiLoading && !apiProblem;

    const displayProblem = localProblem || (apiProblem ? {
        id: apiProblem.title_slug,
        title_slug: apiProblem.title_slug,
        title: apiProblem.title,
        difficulty: apiProblem.difficulty,
        url: apiProblem.url,
        frontend_id: apiProblem.frontend_id,
        isApiOnly: true,
    } : null);

    // Code state
    const [code, setCode] = useState(() => {
        if (localProblem) return localProblem.starterCode.javascript;
        return GENERIC_STARTER_CODE.javascript;
    });

    // Reset on slug change
    useEffect(() => {
        if (!id) return;
        const local = PROBLEMS[id];
        if (local) {
            setCode(local.starterCode[selectedLanguage]);
            // Pre-populate test cases from local examples
            if (local.examples?.length > 0) {
                setTestCases(
                    local.examples.map((ex) =>
                        createTestCase({ expected: ex.output })
                    )
                );
            } else {
                setTestCases([]);
            }
        } else {
            setCode(GENERIC_STARTER_CODE[selectedLanguage]);
            setTestCases([]);
        }
        setOutput(null);
        setTestResults(null);
    }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleLanguageChange = (e) => {
        const newLang = e.target.value;
        setSelectedLanguage(newLang);
        if (localProblem) {
            setCode(localProblem.starterCode[newLang]);
        } else {
            setCode(GENERIC_STARTER_CODE[newLang]);
        }
        setOutput(null);
        setTestResults(null);
    };

    const handleProblemChange = (newSlug) => navigate(`/problem/${newSlug}`);

    const triggerConfetti = () => {
        confetti({ particleCount: 100, spread: 260, origin: { x: 0.2, y: 0.6 } });
        confetti({ particleCount: 100, spread: 260, origin: { x: 0.8, y: 0.6 } });
    };

    const normalizeOutput = (out = "") =>
        out
            .trim()
            .split("\n")
            .map((line) =>
                line
                    .trim()
                    .replace(/\[\s+/g, "[")
                    .replace(/\s+\]/g, "]")
                    .replace(/\s*,\s*/g, ",")
            )
            .filter((line) => line.length > 0)
            .join("\n");

    /** Run code once and check against local expected outputs */
    const handleRunCode = async () => {
        setIsRunning(true);
        setOutput(null);
        setTestResults(null);

        const result = await executeCode(selectedLanguage, code);
        setOutput(result);
        setIsRunning(false);

        if (result.success) {
            if (hasLocalData && localProblem.expectedOutput?.[selectedLanguage]) {
                const passed =
                    normalizeOutput(result.output) ===
                    normalizeOutput(localProblem.expectedOutput[selectedLanguage]);
                if (passed) {
                    triggerConfetti();
                    toast.success("All tests passed! 🎉");
                } else {
                    toast.error("Tests failed. Check your output!");
                }
            } else {
                toast.success("Code executed successfully!");
            }
        } else {
            toast.error("Execution failed. Check for errors.");
        }
    };

    /** Run custom test cases and compare expected vs actual */
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
            return {
                id: tc.id,
                passed: actual === expected,
                actual,
                expected,
            };
        });

        setTestResults(results);

        const allPassed = results.every((r) => r.passed);
        if (allPassed) {
            triggerConfetti();
            toast.success(`All ${results.length} tests passed! 🎉`);
        } else {
            const failCount = results.filter((r) => !r.passed).length;
            toast.error(`${failCount} of ${results.length} tests failed.`);
        }
    };

    // Test case management
    const addTestCase = () => setTestCases((prev) => [...prev, createTestCase()]);
    const removeTestCase = (tcId) => {
        setTestCases((prev) => prev.filter((tc) => tc.id !== tcId));
        setTestResults((prev) => prev?.filter((r) => r.id !== tcId) ?? null);
    };
    const updateTestCase = (tcId, field, value) =>
        setTestCases((prev) =>
            prev.map((tc) => (tc.id === tcId ? { ...tc, [field]: value } : tc))
        );

    // Loading state
    if (isLoadingApi) {
        return (
            <div className="h-screen bg-base-100 flex flex-col">
                <Navbar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center animate-fade-in">
                        <Loader2Icon className="size-10 text-primary animate-spin mx-auto mb-4" />
                        <p className="text-base-content/60">Loading problem...</p>
                    </div>
                </div>
            </div>
        );
    }

    // 404 state
    if (problemNotFound) {
        return (
            <div className="h-screen bg-base-100 flex flex-col">
                <Navbar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="card bg-base-100 shadow-xl max-w-md w-full mx-4 animate-slide-up">
                        <div className="card-body items-center text-center gap-4">
                            <div className="text-6xl">😕</div>
                            <h2 className="card-title text-2xl">Problem Not Found</h2>
                            <p className="text-base-content/60">
                                We couldn't find{" "}
                                <code className="badge badge-sm">{id}</code>.
                            </p>
                            <button
                                className="btn btn-primary"
                                onClick={() => navigate("/problems")}
                            >
                                Browse All Problems
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-base-100 flex flex-col">
            <Navbar />

            <div className="flex-1 overflow-hidden">
                <PanelGroup direction="horizontal">
                    {/* Left — problem description */}
                    <Panel defaultSize={40} minSize={28}>
                        <ProblemDescription
                            problem={displayProblem}
                            currentProblemId={id}
                            onProblemChange={handleProblemChange}
                            allProblems={Object.values(PROBLEMS)}
                        />
                    </Panel>

                    <PanelResizeHandle className="w-1.5 bg-base-300 hover:bg-primary/50 transition-colors cursor-col-resize" />

                    {/* Right — editor + test panel */}
                    <Panel defaultSize={60} minSize={30}>
                        <PanelGroup direction="vertical">
                            <Panel defaultSize={65} minSize={30}>
                                <CodeEditorPanel
                                    selectedLanguage={selectedLanguage}
                                    code={code}
                                    isRunning={isRunning}
                                    onLanguageChange={handleLanguageChange}
                                    onCodeChange={setCode}
                                    onRunCode={handleRunCode}
                                />
                            </Panel>

                            <PanelResizeHandle className="h-1.5 bg-base-300 hover:bg-primary/50 transition-colors cursor-row-resize" />

                            <Panel defaultSize={35} minSize={20}>
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
            </div>
        </div>
    );
}

export default ProblemPage;
