import { useState } from "react";
import { PlayIcon, PlusIcon, TrashIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from "lucide-react";

/**
 * TestCasePanel — Tabbed panel with:
 * - "Output" tab: raw code execution output
 * - "Test Cases" tab: user-defined test runner with pass/fail verdict
 *
 * Props:
 *   output         — current raw execution result { success, output, error, executionTime }
 *   isRunning      — whether code is currently executing
 *   testCases      — array of { id, input, expected } test case objects
 *   testResults    — array of { id, passed, actual, expected } results (null if not run yet)
 *   onAddTestCase  — fn() to add a blank test case
 *   onRemoveTestCase — fn(id) to remove a test case
 *   onUpdateTestCase — fn(id, field, value) to update input/expected
 *   onRunTests     — fn() to run all test cases
 */
function TestCasePanel({
    output,
    isRunning,
    testCases = [],
    testResults = null,
    onAddTestCase,
    onRemoveTestCase,
    onUpdateTestCase,
    onRunTests,
}) {
    const [activeTab, setActiveTab] = useState("output");

    const passedCount = testResults ? testResults.filter((r) => r.passed).length : 0;
    const totalCount = testResults ? testResults.length : 0;
    const allPassed = testResults && totalCount > 0 && passedCount === totalCount;

    return (
        <div className="h-full flex flex-col bg-base-100 border-t border-base-300">
            {/* Tab bar */}
            <div className="flex items-center gap-1 px-4 pt-3 pb-0 border-b border-base-300 bg-base-200/50">
                <button
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all duration-200 ${
                        activeTab === "output"
                            ? "bg-base-100 text-base-content border border-base-300 border-b-base-100 -mb-px"
                            : "text-base-content/50 hover:text-base-content"
                    }`}
                    onClick={() => setActiveTab("output")}
                >
                    Output
                </button>
                <button
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all duration-200 flex items-center gap-2 ${
                        activeTab === "testcases"
                            ? "bg-base-100 text-base-content border border-base-300 border-b-base-100 -mb-px"
                            : "text-base-content/50 hover:text-base-content"
                    }`}
                    onClick={() => setActiveTab("testcases")}
                >
                    Test Cases
                    {testResults && (
                        <span
                            className={`badge badge-xs ${
                                allPassed ? "badge-success" : "badge-error"
                            }`}
                        >
                            {passedCount}/{totalCount}
                        </span>
                    )}
                </button>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-auto">
                {/* OUTPUT TAB */}
                {activeTab === "output" && (
                    <div className="h-full p-4">
                        {!output ? (
                            <div className="h-full flex flex-col items-center justify-center text-base-content/30">
                                <PlayIcon className="size-10 mb-3" />
                                <p className="text-sm">Run your code to see the output here</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {/* Status badge */}
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`badge badge-sm ${
                                            output.success ? "badge-success" : "badge-error"
                                        }`}
                                    >
                                        {output.success ? "Success" : "Error"}
                                    </span>
                                    {output.executionTime && (
                                        <span className="text-xs text-base-content/40 flex items-center gap-1">
                                            <ClockIcon className="size-3" />
                                            {output.executionTime}ms
                                        </span>
                                    )}
                                </div>

                                {/* Output text */}
                                <pre className="bg-base-200 rounded-xl p-4 text-sm font-mono overflow-auto max-h-48 text-base-content/90 border border-base-300">
                                    {output.output || output.error || "No output"}
                                </pre>
                            </div>
                        )}
                    </div>
                )}

                {/* TEST CASES TAB */}
                {activeTab === "testcases" && (
                    <div className="p-4 space-y-4">
                        {/* Overall result banner */}
                        {testResults && (
                            <div
                                className={`flex items-center gap-3 p-3 rounded-xl border ${
                                    allPassed
                                        ? "bg-success/10 border-success/30 text-success"
                                        : "bg-error/10 border-error/30 text-error"
                                }`}
                            >
                                {allPassed ? (
                                    <CheckCircleIcon className="size-5 shrink-0" />
                                ) : (
                                    <XCircleIcon className="size-5 shrink-0" />
                                )}
                                <span className="text-sm font-semibold">
                                    {allPassed
                                        ? `All ${totalCount} test${totalCount !== 1 ? "s" : ""} passed! 🎉`
                                        : `${passedCount} of ${totalCount} test${totalCount !== 1 ? "s" : ""} passed`}
                                </span>
                            </div>
                        )}

                        {/* Test case rows */}
                        {testCases.length === 0 ? (
                            <div className="text-center py-8 text-base-content/40">
                                <p className="text-sm mb-3">No test cases added yet.</p>
                                <p className="text-xs">Add test cases to verify your solution output.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {testCases.map((tc, idx) => {
                                    const result = testResults?.find((r) => r.id === tc.id);
                                    return (
                                        <div
                                            key={tc.id}
                                            className={`rounded-xl border p-4 transition-all duration-200 ${
                                                !result
                                                    ? "border-base-300 bg-base-100"
                                                    : result.passed
                                                    ? "border-success/40 bg-success/5"
                                                    : "border-error/40 bg-error/5"
                                            }`}
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-mono text-base-content/50 bg-base-200 px-2 py-0.5 rounded">
                                                        Case {idx + 1}
                                                    </span>
                                                    {result && (
                                                        <span
                                                            className={`flex items-center gap-1 text-xs font-semibold ${
                                                                result.passed ? "text-success" : "text-error"
                                                            }`}
                                                        >
                                                            {result.passed ? (
                                                                <CheckCircleIcon className="size-3.5" />
                                                            ) : (
                                                                <XCircleIcon className="size-3.5" />
                                                            )}
                                                            {result.passed ? "Passed" : "Failed"}
                                                        </span>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => onRemoveTestCase(tc.id)}
                                                    className="btn btn-ghost btn-xs text-error/70 hover:text-error"
                                                    title="Remove test case"
                                                >
                                                    <TrashIcon className="size-3.5" />
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-xs text-base-content/50 font-medium mb-1 block">
                                                        Expected Output
                                                    </label>
                                                    <textarea
                                                        className="textarea textarea-bordered textarea-xs w-full font-mono text-xs resize-none h-14"
                                                        placeholder="e.g. [0,1] or true"
                                                        value={tc.expected}
                                                        onChange={(e) =>
                                                            onUpdateTestCase(tc.id, "expected", e.target.value)
                                                        }
                                                    />
                                                </div>
                                                {result && !result.passed && (
                                                    <div>
                                                        <label className="text-xs text-error/70 font-medium mb-1 block">
                                                            Actual Output
                                                        </label>
                                                        <pre className="bg-error/10 border border-error/20 rounded-lg p-2 font-mono text-xs h-14 overflow-auto text-error/80">
                                                            {result.actual || "(empty)"}
                                                        </pre>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Add test case + Run buttons */}
                        <div className="flex items-center gap-2 pt-1">
                            <button
                                onClick={onAddTestCase}
                                className="btn btn-ghost btn-sm gap-1.5 text-base-content/60 hover:text-base-content"
                            >
                                <PlusIcon className="size-4" />
                                Add Test Case
                            </button>

                            {testCases.length > 0 && (
                                <button
                                    onClick={onRunTests}
                                    disabled={isRunning}
                                    className="btn btn-primary btn-sm gap-1.5 ml-auto"
                                >
                                    {isRunning ? (
                                        <>
                                            <span className="loading loading-spinner loading-xs" />
                                            Running...
                                        </>
                                    ) : (
                                        <>
                                            <PlayIcon className="size-4" />
                                            Run Tests
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default TestCasePanel;
