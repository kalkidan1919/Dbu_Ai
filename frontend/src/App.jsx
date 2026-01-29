import { useState, useRef, useEffect } from "react";

function App() {
  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: "Welcome to DBU Intelligence. I am ready to assist with campus navigation, academic data, or image analysis.",
    },
  ]);
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- 1. NEW CHAT FEATURE ---
  const startNewChat = () => {
    if (messages.length > 1) {
      const title = messages[1].text.substring(0, 25) + "...";
      setHistory((prev) => [title, ...prev]);
    }
    setMessages([
      { role: "ai", text: "New Intelligence Session. How can I assist you?" },
    ]);
    setInput("");
    setSelectedImage(null);
  };

  // --- 2. VOICE RECOGNITION FEATURE ---
  const startListening = () => {
    // This looks for the recognition tool in both Chrome and other browsers
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        "Voice recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.",
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US"; // You can change this to your language!
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      console.log("Microphone is now listening...");
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      console.log("Recognized text:", transcript);
      setInput(transcript);
    };

    recognition.onerror = (event) => {
      console.error("Speech Recognition Error:", event.error);
      setIsListening(false);
      if (event.error === "not-allowed") {
        alert(
          "Microphone access was denied. Please check your browser settings.",
        );
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
    setMessages((prev) => [...prev, userMsg]);

    setLoading(true);
    const formData = new FormData();
    formData.append("message", input);
    if (selectedImage) formData.append("image", selectedImage);

    setInput("");
    setSelectedImage(null);

    try {
      const response = await fetch("http://127.0.0.1:5001/chat", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      // Fix: Display 'reply' if it exists, otherwise display 'error'
      const aiText =
        data.reply || data.error || "No response received from AI.";
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
      {/* SIDEBAR: History & New Chat */}
      <div className="w-72 bg-[#0d1117] border-r border-white/5 flex flex-col p-6 hidden md:flex">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-[#2980B9] rounded-xl flex items-center justify-center font-black text-xl">
            D
          </div>
          <h2 className="font-black text-xl">
            DBU<span className="text-[#2980B9]">AI</span>
          </h2>
        </div>

        <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-4">
          Recent Sessions
        </p>
        <div className="space-y-2 flex-1 overflow-y-auto">
          {history.map((item, i) => (
            <div
              key={i}
              className="p-3 text-sm text-slate-400 hover:bg-white/5 rounded-xl cursor-pointer truncate"
            >
              {item}
            </div>
          ))}
        </div>

        <button
          onClick={startNewChat}
          className="mt-4 p-4 border border-[#2980B9]/30 rounded-2xl text-xs font-bold text-[#2980B9] hover:bg-[#2980B9]/10 transition-all flex items-center justify-center gap-2"
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
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-8 custom-scrollbar">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] p-6 rounded-[2rem] shadow-xl ${
                  msg.role === "user"
                    ? "bg-[#2980B9] rounded-tr-none"
                    : "bg-[#161b22] rounded-tl-none border border-white/5"
                }`}
              >
                {msg.hasImage && (
                  <div className="text-[10px] mb-2 text-blue-200">
                    📷 Image Attached
                  </div>
                )}
                <p className="text-[0.95rem] leading-relaxed whitespace-pre-wrap">
                  {msg.text}
                </p>
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
                placeholder="Ask DBU AI anything..."
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
