import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

function App() {
  const [profile, setProfile] = useState(() => {
    const savedProfile = localStorage.getItem("dbu_profile");
    return savedProfile ? JSON.parse(savedProfile) : { name: "", dept: "", year: "1", username: "" };
  });

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem("dbu_logged_in") === "true";
  });

  const [authMode, setAuthMode] = useState("login"); // login or signup
  const [authForm, setAuthForm] = useState({
    username: "", password: "", name: "", dept: "", year: "1"
  });
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [showSettings, setShowSettings] = useState(false);
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("dbu_messages");
    return saved ? JSON.parse(saved) : [{
      role: "ai",
      text: "Welcome to DBU Intelligence. I am ready to assist with campus navigation, academic data, or image analysis.",
    }];
  });
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem("dbu_history");
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isLoggedIn) {
      localStorage.setItem("dbu_profile", JSON.stringify(profile));
      localStorage.setItem("dbu_logged_in", "true");
      localStorage.setItem("dbu_messages", JSON.stringify(messages));
      localStorage.setItem("dbu_history", JSON.stringify(history));
    }
  }, [profile, isLoggedIn, messages, history]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("dbu_logged_in");
    localStorage.removeItem("dbu_profile");
    localStorage.removeItem("dbu_messages");
    localStorage.removeItem("dbu_history");
    setProfile({ name: "", dept: "", year: "1", username: "" });
    setMessages([{ role: "ai", text: "Welcome to DBU Intelligence." }]);
    setHistory([]);
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);

    const endpoint = authMode === "login" ? "/login" : "/signup";

    try {
      const response = await fetch(`http://127.0.0.1:5001${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authForm),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      if (authMode === "login") {
        setProfile({ ...data.profile, username: authForm.username });
        setIsLoggedIn(true);
      } else {
        // Auto login after signup
        setProfile({ name: authForm.name, dept: authForm.dept, year: authForm.year, username: authForm.username });
        setIsLoggedIn(true);
      }
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-[100dvh] py-8 w-full bg-[#0b0e14] font-sans text-white items-center justify-center overflow-y-auto">
        <div className="w-full max-w-md px-8 py-6 bg-[#0d1117] border border-white/10 rounded-3xl shadow-2xl mx-4 my-auto">
          <div className="flex flex-col items-center mb-6">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4 overflow-hidden bg-white shadow-lg shadow-[#2980B9]/20 flex-shrink-0">
              <img src="/dbu-logo.jpg" alt="DBU Logo" className="w-full h-full object-contain" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
              <div style={{ display: 'none' }} className="w-full h-full bg-[#2980B9] items-center justify-center font-black text-4xl text-white">D</div>
            </div>
            <h2 className="font-black text-2xl tracking-tighter">
              DBU<span className="text-[#2980B9]">AI</span> {authMode === "login" ? "LOGIN" : "SIGNUP"}
            </h2>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authError && (
              <div className={`p-3 rounded-lg text-sm ${authError.includes('successful') ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                {authError}
              </div>
            )}

            <div>
              <label className="text-[10px] text-slate-500 ml-1 uppercase tracking-widest font-bold">Username</label>
              <input
                required
                value={authForm.username}
                onChange={e => setAuthForm({ ...authForm, username: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 mt-1 text-sm focus:border-[#2980B9] outline-none transition-all"
                placeholder="Student ID or Username"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-500 ml-1 uppercase tracking-widest font-bold">Password</label>
              <input
                required
                type="password"
                value={authForm.password}
                onChange={e => setAuthForm({ ...authForm, password: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 mt-1 text-sm focus:border-[#2980B9] outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            {authMode === "signup" && (
              <>
                <div>
                  <label className="text-[10px] text-slate-500 ml-1 uppercase tracking-widest font-bold">Full Name</label>
                  <input
                    required
                    value={authForm.name}
                    onChange={e => setAuthForm({ ...authForm, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 mt-1 text-sm focus:border-[#2980B9] outline-none transition-all"
                    placeholder="E.g., Abebe Kebede"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 ml-1 uppercase tracking-widest font-bold">Department</label>
                  <input
                    required
                    value={authForm.dept}
                    onChange={e => setAuthForm({ ...authForm, dept: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 mt-1 text-sm focus:border-[#2980B9] outline-none transition-all"
                    placeholder="E.g., Software Engineering"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 ml-1 uppercase tracking-widest font-bold">Academic Year</label>
                  <select
                    value={authForm.year}
                    onChange={e => setAuthForm({ ...authForm, year: e.target.value })}
                    className="w-full bg-[#161b22] border border-white/10 rounded-xl px-4 py-3 mt-1 text-sm focus:border-[#2980B9] outline-none transition-all"
                  >
                    <option value="1" className="bg-[#0d1117] text-white">Year 1</option>
                    <option value="2" className="bg-[#0d1117] text-white">Year 2</option>
                    <option value="3" className="bg-[#0d1117] text-white">Year 3</option>
                    <option value="4" className="bg-[#0d1117] text-white">Year 4</option>
                    <option value="5" className="bg-[#0d1117] text-white">Year 5</option>
                  </select>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-4 mt-4 bg-[#2980B9] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#3498DB] transition-all shadow-lg shadow-[#2980B9]/20"
            >
              {authLoading ? "PROCESSING..." : (authMode === "login" ? "ENTER NEURAL NETWORK" : "REGISTER PROFILE")}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setAuthMode(authMode === "login" ? "signup" : "login");
                setAuthError("");
              }}
              className="text-[11px] text-slate-400 hover:text-white transition-colors"
            >
              {authMode === "login" ? "New student? Create your profile here." : "Already registered? Access terminal here."}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- 1. NEW CHAT FEATURE ---
  const startNewChat = () => {
    if (messages.length > 1) {
      const title = messages[1].text.substring(0, 25) + "...";
      setHistory((prev) => [title, ...prev]);
    }
    setMessages([
      {
        role: "ai",
        text: `New Session Initialized. How can I help you ${profile.name ? profile.name : "today"}?`,
      },
    ]);
    setInput("");
    setSelectedImage(null);
  };

  // --- 2. VOICE RECOGNITION FEATURE ---
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      console.log("Microphone is now listening...");
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      if (event.error === "not-allowed") {
        alert("Microphone access was denied. Please check your browser settings.");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  // --- 3. IMAGE SELECTION ---
  const handleImageSelect = (e) => {
    if (e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };

  // --- 4. MAIN SENDING LOGIC (TEXT + IMAGE) ---
  const handleSend = async () => {
    if (!input.trim() && !selectedImage) return;
    const userMsg = {
      role: "user",
      text: input || (selectedImage ? "Analyzed an image" : ""),
      hasImage: !!selectedImage,
    };
    const chatHistory = messages.slice(-5).map((m) => ({
      role: m.role === "ai" ? "assistant" : "user",
      content: m.text,
    }));
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    const formData = new FormData();
    formData.append("message", input);
    formData.append("profile", JSON.stringify(profile));
    formData.append("history", JSON.stringify(chatHistory));

    if (selectedImage) formData.append("image", selectedImage);

    setInput("");
    setSelectedImage(null);

    try {
      const response = await fetch("http://127.0.0.1:5001/chat", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      const aiText = data.reply || data.error || "No response received from AI.";
      setMessages((prev) => [...prev, { role: "ai", text: aiText }]);
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(aiText));
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "Failed to connect to Python server. Is it running?",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#0b0e14] font-sans text-white overflow-hidden">
      {/* SIDEBAR: History & Profile Settings */}
      <div className="w-80 bg-[#0d1117] border-r border-white/5 flex flex-col p-6 hidden md:flex">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden bg-white shadow-lg shadow-[#2980B9]/20 flex-shrink-0">
              <img src="/dbu-logo.jpg" alt="DBU Logo" className="w-full h-full object-contain" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
              <div style={{ display: 'none' }} className="w-full h-full bg-[#2980B9] items-center justify-center font-black text-xl text-white">D</div>
            </div>
            <h2 className="font-black text-xl tracking-tighter">
              DBU<span className="text-[#2980B9]">AI</span>
            </h2>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 px-3 rounded-lg transition-all flex items-center gap-2 ${showSettings ? "bg-[#2980B9] text-white" : "hover:bg-white/5 text-slate-500"}`}
            title="Edit Student Profile"
          >
            ⚙️{" "}
            <span className="text-[10px] font-bold uppercase tracking-widest">
              {showSettings ? "Close" : "Profile"}
            </span>
          </button>
        </div>

        {showSettings ? (
          <div className="flex-1 space-y-4">
            <p className="text-[10px] uppercase tracking-widest font-bold text-[#2980B9]">
              Student Profile
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-500 ml-1">YOUR NAME</label>
                <input
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  placeholder="Your name"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-[#2980B9] outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 ml-1">DEPARTMENT</label>
                <input
                  value={profile.dept}
                  onChange={(e) => setProfile({ ...profile, dept: e.target.value })}
                  placeholder="Your Department"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-[#2980B9] outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 ml-1">ACADEMIC YEAR</label>
                <select
                  value={profile.year}
                  onChange={(e) => setProfile({ ...profile, year: e.target.value })}
                  className="w-full bg-[#161b22] border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-[#2980B9] outline-none transition-all"
                >
                  <option value="1" className="bg-[#0d1117] text-white">Year 1</option>
                  <option value="2" className="bg-[#0d1117] text-white">Year 2</option>
                  <option value="3" className="bg-[#0d1117] text-white">Year 3</option>
                  <option value="4" className="bg-[#0d1117] text-white">Year 4</option>
                  <option value="5" className="bg-[#0d1117] text-white">Year 5</option>
                </select>
              </div>
            </div>
            <button
              onClick={() => setShowSettings(false)}
              className="w-full py-3 bg-[#2980B9]/10 text-[#2980B9] rounded-xl text-xs font-bold hover:bg-[#2980B9]/20 transition-all border border-[#2980B9]/20 mb-2"
            >
              Save Profile
            </button>
            <button
              onClick={handleLogout}
              className="w-full py-3 bg-red-500/10 text-red-500 rounded-xl text-xs font-bold hover:bg-red-500/20 transition-all border border-red-500/20"
            >
              Log Out
            </button>
          </div>
        ) : (
          <>
            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-4">
              Recent Sessions
            </p>
            <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar">
              {history.length > 0 ? (
                history.map((item, i) => (
                  <div
                    key={i}
                    className="p-3 text-sm text-slate-400 hover:bg-white/5 rounded-xl cursor-pointer truncate transition-all border border-transparent hover:border-white/5"
                  >
                    <span className="text-[#2980B9] mr-2">#</span>
                    {item}
                  </div>
                ))
              ) : (
                <p className="text-[10px] text-slate-700 italic ml-1">
                  No previous sessions
                </p>
              )}
            </div>
          </>
        )}

        <button
          onClick={startNewChat}
          className="mt-6 p-4 border border-[#2980B9]/30 rounded-2xl text-xs font-bold text-[#2980B9] hover:bg-[#2980B9]/10 transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/20"
        >
          <span>+</span> New Session
        </button>
      </div>

      {/* MAIN CHAT */}
      <div className="flex-1 flex flex-col relative px-4 md:px-0">
        <div className="h-20 border-b border-white/5 flex items-center px-10">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-3"></div>
          <h3 className="text-sm font-bold tracking-widest text-[#2980B9] uppercase">
            DBU Intellect Active
          </h3>
          <div className="ml-auto text-xs text-slate-500 hidden md:block">
            Logged in as: <span className="text-white font-bold">{profile.username || "Student"}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-8 custom-scrollbar">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] p-6 rounded-[2rem] shadow-xl ${msg.role === "user"
                  ? "bg-[#2980B9] rounded-tr-none"
                  : "bg-[#161b22] rounded-tl-none border border-white/5"
                  }`}
              >
                {msg.hasImage && (
                  <div className="text-[10px] mb-2 text-blue-200">
                    📷 Image Attached
                  </div>
                )}
                <div className="text-[0.95rem] leading-relaxed whitespace-pre-wrap">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="text-cyan-500 text-[10px] animate-pulse ml-4 font-mono">
              NEURAL PROCESSING...
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* INPUT SECTION */}
        <div className="p-6 md:p-10 bg-gradient-to-t from-[#0b101b] to-transparent">
          <div className="max-w-4xl mx-auto">
            {/* Image Preview */}
            {selectedImage && (
              <div className="mb-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-between text-xs transition-all">
                <span>📎 Image Selected: {selectedImage.name}</span>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="text-red-400 font-bold"
                >
                  Cancel
                </button>
              </div>
            )}

            <div className="bg-[#0d1117] border border-white/10 p-2 rounded-[2.5rem] flex items-center gap-2 shadow-2xl">
              <input
                type="file"
                hidden
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
              />

              <button
                onClick={() => fileInputRef.current.click()}
                className="p-4 hover:text-[#2980B9] transition-all"
              >
                📷
              </button>

              <button
                onClick={startListening}
                className={`p-4 transition-all ${isListening ? "text-red-500 animate-pulse" : "text-slate-500 hover:text-[#2980B9]"}`}
              >
                {isListening ? "⬤" : "🎤"}
              </button>

              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask DBU AI anything... (Tip: Shift+Enter for new line)"
                className="flex-1 bg-transparent px-4 py-3 focus:outline-none text-sm placeholder:text-slate-600"
              />

              <button
                onClick={handleSend}
                disabled={loading}
                className="bg-[#2980B9] hover:bg-[#3498DB] px-8 py-4 rounded-[2rem] font-black text-[11px] uppercase tracking-widest transition-all shadow-lg shadow-[#2980B9]/20"
              >
                Execute
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
