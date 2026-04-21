import Editor from "@monaco-editor/react";
import { Loader2Icon, PlayIcon, ChevronDownIcon } from "lucide-react";
import { LANGUAGE_CONFIG } from "../data/problems";

function CodeEditorPanel({
    selectedLanguage,
    code,
    isRunning,
    onLanguageChange,
    onCodeChange,
    onRunCode,
}) {
    const lang = LANGUAGE_CONFIG[selectedLanguage] || LANGUAGE_CONFIG["javascript"];


    return (
        <div className="h-full flex flex-col bg-base-300">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-base-100/90 backdrop-blur-sm border-b border-base-300 gap-3">
                {/* Language selector */}
                <div className="relative flex items-center">
                    <div className="flex items-center gap-2 pr-1">
                        <img
                            src={lang.icon}
                            alt={lang.name}
                            className="size-5 rounded-sm"
                        />
                    </div>
                    <div className="relative">
                        <select
                            className="select select-sm pl-1 pr-7 appearance-none bg-base-200 border border-base-300 rounded-lg text-sm font-medium focus:outline-none focus:border-primary transition-colors cursor-pointer"
                            value={selectedLanguage}
                            onChange={onLanguageChange}
                        >
                            {Object.entries(LANGUAGE_CONFIG).map(([key, l]) => (
                                <option key={key} value={key}>
                                    {l.name}
                                </option>
                            ))}
                        </select>
                        <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 size-3 text-base-content/40 pointer-events-none" />
                    </div>
                </div>

                {/* Run Code button */}
                <button
                    className={`btn btn-sm gap-2 font-semibold transition-all duration-200 ${
                        isRunning
                            ? "btn-disabled bg-primary/40"
                            : "btn-primary hover:scale-[1.02] active:scale-[0.98]"
                    }`}
                    disabled={isRunning}
                    onClick={onRunCode}
                >
                    {isRunning ? (
                        <>
                            <Loader2Icon className="size-4 animate-spin" />
                            <span>Running...</span>
                        </>
                    ) : (
                        <>
                            <PlayIcon className="size-4" />
                            <span>Run Code</span>
                        </>
                    )}
                </button>
            </div>

            {/* Monaco Editor */}
            <div className="flex-1">
                <Editor
                    height="100%"
                    language={lang.monacoLang}
                    value={code}
                    onChange={onCodeChange}
                    theme="vs-dark"
                    options={{
                        fontSize: 14,
                        lineNumbers: "on",
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        minimap: { enabled: false },
                        fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                        fontLigatures: true,
                        renderLineHighlight: "gutter",
                        smoothScrolling: true,
                        cursorSmoothCaretAnimation: "on",
                        padding: { top: 12, bottom: 12 },
                    }}
                />
            </div>
        </div>
    );
}

export default CodeEditorPanel;