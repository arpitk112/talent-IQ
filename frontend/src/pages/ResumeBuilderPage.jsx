import { useState } from "react";
import JSZip from "jszip";
import Navbar from "../components/Navbar.jsx";
import axiosInstance from "../lib/axios.js";
import {
    SparklesIcon,
    PlusIcon,
    TrashIcon,
    ClipboardCopyIcon,
    DownloadIcon,
    Loader2Icon,
    CheckIcon,
    UserIcon,
    BriefcaseIcon,
    GraduationCapIcon,
    FolderIcon,
    WrenchIcon,
} from "lucide-react";
import toast from "react-hot-toast";


const STEPS = [
    { id: 1, label: "Personal", icon: UserIcon },
    { id: 2, label: "Skills", icon: WrenchIcon },
    { id: 3, label: "Experience", icon: BriefcaseIcon },
    { id: 4, label: "Education", icon: GraduationCapIcon },
    { id: 5, label: "Projects", icon: FolderIcon },
];

const emptyExp  = () => ({ title: "", company: "", duration: "", description: "" });
const emptyEdu  = () => ({ degree: "", school: "", year: "" });
const emptyProj = () => ({ name: "", description: "", techStack: "" });


const Field = ({ label, value, onChange, placeholder, type = "text" }) => (
    <div className="form-control gap-1">
        <label className="label text-sm font-semibold text-base-content/70">{label}</label>
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="input input-bordered w-full focus:input-primary transition-all"
        />
    </div>
);


const Stepper = ({ step, setStep }) => (
    <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
        {STEPS.map((s, i) => {
            const Icon = s.icon;
            const active = step === s.id;
            const done = step > s.id;
            return (
                <div key={s.id} className="flex items-center gap-2">
                    <button
                        onClick={() => setStep(s.id)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200
                            ${active ? "bg-primary text-primary-content shadow-lg scale-105" :
                              done  ? "bg-success/20 text-success" : "bg-base-200 text-base-content/50"}`}
                    >
                        {done ? <CheckIcon className="size-3.5" /> : <Icon className="size-3.5" />}
                        <span className="hidden sm:inline">{s.label}</span>
                    </button>
                    {i < STEPS.length - 1 && (
                        <div className={`w-4 h-0.5 ${step > s.id ? "bg-success" : "bg-base-300"}`} />
                    )}
                </div>
            );
        })}
    </div>
);


function ResumeBuilderPage() {
    const [step, setStep]     = useState(1);
    const [loading, setLoading] = useState(false);
    const [resume, setResume] = useState("");
    const [copied, setCopied] = useState(false);


    const [personal, setPersonal] = useState({ name: "", email: "", phone: "", linkedin: "", github: "" });
    const [summary, setSummary]   = useState("");
    const [skills, setSkills]     = useState("");
    const [experience, setExperience] = useState([emptyExp()]);
    const [education, setEducation]   = useState([emptyEdu()]);
    const [projects, setProjects]     = useState([emptyProj()]);

    const fillDemoData = () => {
        setPersonal({
            name: "Arpit Kumar",
            email: "arpit.dev@example.com",
            phone: "+91 9876543210",
            linkedin: "linkedin.com/in/arpitk112",
            github: "github.com/arpitk112"
        });
        setSummary("Passionate Full-Stack Developer with expertise in React, Node.js, and modern web technologies. Focuses on building scalable AI-integrated platforms, real-time communication systems, and responsive user interfaces.");
        setSkills("JavaScript, React, Node.js, Express, MongoDB, Tailwind CSS, WebRTC, Socket.IO, Google Gemini API");
        setExperience([{
            title: "Frontend Developer",
            company: "Tech Solutions Inc.",
            duration: "2023 - Present",
            description: "Developed and shipped a scalable e-learning platform serving over 50,000 active users. Built real-time video conferencing features using WebRTC and scalable chat systems."
        }]);
        setEducation([{
            degree: "B.Tech in Computer Science",
            school: "Indian Institute of Technology",
            year: "2024"
        }]);
        setProjects([{
            name: "Talent-IQ",
            description: "A comprehensive developer portal featuring problem-solving, AI mock interviews, real-time video sessions, and an integrated AI resume builder powered by Gemini.",
            techStack: "MERN Stack, DaisyUI, Piston API, Gemini AI"
        }]);
        toast.success("Demo data loaded!");
    };


    const updateList = (setter, index, field, value) =>
        setter((prev) => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
    const addItem    = (setter, tpl) => setter((prev) => [...prev, tpl()]);
    const removeItem = (setter, index) => setter((prev) => prev.filter((_, i) => i !== index));


    const handleGenerate = async () => {
        if (!personal.name || !personal.email) { toast.error("Name and email are required."); return; }
        setLoading(true);
        setResume("");
        try {
            const res = await axiosInstance.post("/resume/generate", {
                ...personal,
                summary,
                skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
                experience,
                education,
                projects,
            });
            // Strip markdown block wrappers if the AI included them
            const rawTex = res.data.resume.replace(/```latex\n?|```/gi, "").trim();
            setResume(rawTex);
            toast.success("Resume generated!");
        } catch (err) {
            toast.error(err.response?.data?.message || err.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };


    const handleCopy = () => {
        navigator.clipboard.writeText(resume);
        setCopied(true);
        toast.success("Copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
    };


    const handleDownload = async () => {
        try {
            const zip = new JSZip();
            zip.file("main.tex", resume);
            const content = await zip.generateAsync({ type: "blob" });
            const url = URL.createObjectURL(content);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${personal.name.replace(/\s+/g, "_") || "resume"}.zip`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success("Resume ZIP downloaded! Ready for Overleaf.");
        } catch (err) {
            toast.error("Failed to generate ZIP file.");
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-base-100 via-base-200 to-base-300">
            <Navbar />

            <div className="max-w-5xl mx-auto px-4 py-10">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 badge badge-primary badge-lg mb-4">
                        <SparklesIcon className="size-4" />
                        Powered by Google Gemini AI
                    </div>
                    {/* Demo data button */}
                    <button onClick={fillDemoData} className="btn gap-2 btn-sm btn-outline shadow-sm ml-4 mb-4">
                        <UserIcon className="size-3.5" /> Fill Demo Data
                    </button>
                    <h1 className="text-4xl lg:text-5xl font-black mb-3">
                        <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                            AI Resume Builder
                        </span>
                    </h1>
                    <p className="text-base-content/60 text-lg max-w-xl mx-auto">
                        Fill in your details and let Gemini AI craft a professional, ATS-friendly resume in seconds.
                    </p>
                </div>

                <div className={`grid gap-8 ${resume ? "lg:grid-cols-2" : "lg:grid-cols-1 max-w-2xl mx-auto"}`}>


                    <div className="card bg-base-100 shadow-2xl border border-primary/10">
                        <div className="card-body">
                            <Stepper step={step} setStep={setStep} />

                            {/* Step 1 — Personal Info */}
                            {step === 1 && (
                                <div className="space-y-4">
                                    <h2 className="text-xl font-bold flex items-center gap-2">
                                        <UserIcon className="size-5 text-primary" /> Personal Information
                                    </h2>
                                    <Field label="Full Name *" value={personal.name}
                                        onChange={(v) => setPersonal((p) => ({ ...p, name: v }))}
                                        placeholder="e.g. Arpit Kumar" />
                                    <Field label="Email *" type="email" value={personal.email}
                                        onChange={(v) => setPersonal((p) => ({ ...p, email: v }))}
                                        placeholder="arpit@example.com" />
                                    <Field label="Phone" value={personal.phone}
                                        onChange={(v) => setPersonal((p) => ({ ...p, phone: v }))}
                                        placeholder="+91 9876543210" />
                                    <Field label="LinkedIn URL" value={personal.linkedin}
                                        onChange={(v) => setPersonal((p) => ({ ...p, linkedin: v }))}
                                        placeholder="linkedin.com/in/yourprofile" />
                                    <Field label="GitHub URL" value={personal.github}
                                        onChange={(v) => setPersonal((p) => ({ ...p, github: v }))}
                                        placeholder="github.com/yourusername" />
                                </div>
                            )}

                            {/* Step 2 — Summary & Skills */}
                            {step === 2 && (
                                <div className="space-y-4">
                                    <h2 className="text-xl font-bold flex items-center gap-2">
                                        <WrenchIcon className="size-5 text-primary" /> Summary & Skills
                                    </h2>
                                    <div className="form-control gap-1">
                                        <label className="label text-sm font-semibold text-base-content/70">Professional Summary</label>
                                        <textarea
                                            value={summary}
                                            onChange={(e) => setSummary(e.target.value)}
                                            placeholder="Brief overview of your experience, strengths, and career goals..."
                                            className="textarea textarea-bordered w-full h-28 focus:textarea-primary"
                                        />
                                    </div>
                                    <div className="form-control gap-1">
                                        <label className="label text-sm font-semibold text-base-content/70">
                                            Skills <span className="text-base-content/40 text-xs">(comma-separated)</span>
                                        </label>
                                        <textarea
                                            value={skills}
                                            onChange={(e) => setSkills(e.target.value)}
                                            placeholder="React, Node.js, MongoDB, Python, Docker..."
                                            className="textarea textarea-bordered w-full h-20 focus:textarea-primary"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Step 3 — Experience */}
                            {step === 3 && (
                                <div className="space-y-4">
                                    <h2 className="text-xl font-bold flex items-center gap-2">
                                        <BriefcaseIcon className="size-5 text-primary" /> Work Experience
                                    </h2>
                                    {experience.map((exp, i) => (
                                        <div key={i} className="card bg-base-200 p-4 space-y-3 relative">
                                            {experience.length > 1 && (
                                                <button onClick={() => removeItem(setExperience, i)}
                                                    className="btn btn-ghost btn-xs btn-circle absolute top-2 right-2 text-error">
                                                    <TrashIcon className="size-3.5" />
                                                </button>
                                            )}
                                            <div className="grid sm:grid-cols-2 gap-3">
                                                <Field label="Job Title" value={exp.title}
                                                    onChange={(v) => updateList(setExperience, i, "title", v)}
                                                    placeholder="Software Engineer" />
                                                <Field label="Company" value={exp.company}
                                                    onChange={(v) => updateList(setExperience, i, "company", v)}
                                                    placeholder="Google Inc." />
                                            </div>
                                            <Field label="Duration" value={exp.duration}
                                                onChange={(v) => updateList(setExperience, i, "duration", v)}
                                                placeholder="Jan 2023 – Present" />
                                            <div className="form-control gap-1">
                                                <label className="label text-sm font-semibold text-base-content/70">Description</label>
                                                <textarea value={exp.description}
                                                    onChange={(e) => updateList(setExperience, i, "description", e.target.value)}
                                                    placeholder="Key responsibilities and achievements..."
                                                    className="textarea textarea-bordered w-full h-20 focus:textarea-primary" />
                                            </div>
                                        </div>
                                    ))}
                                    <button onClick={() => addItem(setExperience, emptyExp)}
                                        className="btn btn-outline btn-sm btn-primary gap-1 w-full">
                                        <PlusIcon className="size-4" /> Add Experience
                                    </button>
                                </div>
                            )}

                            {/* Step 4 — Education */}
                            {step === 4 && (
                                <div className="space-y-4">
                                    <h2 className="text-xl font-bold flex items-center gap-2">
                                        <GraduationCapIcon className="size-5 text-primary" /> Education
                                    </h2>
                                    {education.map((edu, i) => (
                                        <div key={i} className="card bg-base-200 p-4 space-y-3 relative">
                                            {education.length > 1 && (
                                                <button onClick={() => removeItem(setEducation, i)}
                                                    className="btn btn-ghost btn-xs btn-circle absolute top-2 right-2 text-error">
                                                    <TrashIcon className="size-3.5" />
                                                </button>
                                            )}
                                            <Field label="Degree / Course" value={edu.degree}
                                                onChange={(v) => updateList(setEducation, i, "degree", v)}
                                                placeholder="B.Tech Computer Science" />
                                            <Field label="School / University" value={edu.school}
                                                onChange={(v) => updateList(setEducation, i, "school", v)}
                                                placeholder="IIT Delhi" />
                                            <Field label="Year" value={edu.year}
                                                onChange={(v) => updateList(setEducation, i, "year", v)}
                                                placeholder="2024" />
                                        </div>
                                    ))}
                                    <button onClick={() => addItem(setEducation, emptyEdu)}
                                        className="btn btn-outline btn-sm btn-primary gap-1 w-full">
                                        <PlusIcon className="size-4" /> Add Education
                                    </button>
                                </div>
                            )}

                            {/* Step 5 — Projects */}
                            {step === 5 && (
                                <div className="space-y-4">
                                    <h2 className="text-xl font-bold flex items-center gap-2">
                                        <FolderIcon className="size-5 text-primary" /> Projects
                                    </h2>
                                    {projects.map((proj, i) => (
                                        <div key={i} className="card bg-base-200 p-4 space-y-3 relative">
                                            {projects.length > 1 && (
                                                <button onClick={() => removeItem(setProjects, i)}
                                                    className="btn btn-ghost btn-xs btn-circle absolute top-2 right-2 text-error">
                                                    <TrashIcon className="size-3.5" />
                                                </button>
                                            )}
                                            <Field label="Project Name" value={proj.name}
                                                onChange={(v) => updateList(setProjects, i, "name", v)}
                                                placeholder="Talent-IQ" />
                                            <div className="form-control gap-1">
                                                <label className="label text-sm font-semibold text-base-content/70">Description</label>
                                                <textarea value={proj.description}
                                                    onChange={(e) => updateList(setProjects, i, "description", e.target.value)}
                                                    placeholder="What the project does, your role, and impact..."
                                                    className="textarea textarea-bordered w-full h-20 focus:textarea-primary" />
                                            </div>
                                            <Field label="Tech Stack" value={proj.techStack}
                                                onChange={(v) => updateList(setProjects, i, "techStack", v)}
                                                placeholder="React, Node.js, MongoDB, Socket.IO" />
                                        </div>
                                    ))}
                                    <button onClick={() => addItem(setProjects, emptyProj)}
                                        className="btn btn-outline btn-sm btn-primary gap-1 w-full">
                                        <PlusIcon className="size-4" /> Add Project
                                    </button>
                                </div>
                            )}

                            {/* Navigation */}
                            <div className="flex justify-between items-center mt-6 pt-4 border-t border-base-300">
                                <button disabled={step === 1} onClick={() => setStep((s) => s - 1)}
                                    className="btn btn-ghost btn-sm">← Back</button>

                                {step < STEPS.length ? (
                                    <button onClick={() => setStep((s) => s + 1)} className="btn btn-primary btn-sm">
                                        Next →
                                    </button>
                                ) : (
                                    <button onClick={handleGenerate} disabled={loading} className="btn btn-primary gap-2">
                                        {loading
                                            ? <><Loader2Icon className="size-4 animate-spin" /> Generating...</>
                                            : <><SparklesIcon className="size-4" /> Generate Resume</>}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>


                    {resume && (
                        <div className="card bg-base-100 shadow-2xl border border-success/20">
                            <div className="card-body">
                                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                                    <h2 className="text-xl font-bold flex items-center gap-2">
                                        <SparklesIcon className="size-5 text-success" /> Your AI Resume
                                    </h2>
                                    <div className="flex gap-2">
                                        <button onClick={handleCopy} className="btn btn-sm btn-outline gap-1.5">
                                            {copied ? <CheckIcon className="size-4 text-success" /> : <ClipboardCopyIcon className="size-4" />}
                                            {copied ? "Copied!" : "Copy"}
                                        </button>
                                        <button onClick={handleDownload} className="btn btn-sm btn-primary gap-1.5">
                                            <DownloadIcon className="size-4" /> Download .zip
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-base-200 rounded-xl p-5 overflow-auto max-h-[70vh]">
                                    <pre className="text-sm text-base-content/80 whitespace-pre-wrap font-mono">
                                        <code>{resume}</code>
                                    </pre>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ResumeBuilderPage;
