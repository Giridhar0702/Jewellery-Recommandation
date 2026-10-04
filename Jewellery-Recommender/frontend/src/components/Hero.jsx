import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  Upload,
  Loader2,
  Sparkles,
  Diamond,
  MessageCircle,
  Send,
  ArrowLeft,
} from "lucide-react";

export default function Hero({
  onSearch,
  onUpload,
  onChatMessage,
  chatMessages,
  isLoading,
  isChatMode,
  setIsChatMode,
}) {
  const [query, setQuery] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const chatEndRef = useRef(null);

  // Auto-scroll chat to bottom when messages change
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (chatInput.trim() && !isLoading) {
      onChatMessage(chatInput.trim());
      setChatInput("");
    }
  };

  return (
    <div className="relative bg-primary text-white min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background Overlay or Image */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] via-[#0d0d0d] to-black opacity-90"></div>
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center w-full">
        {/* Animated Badge */}
        <div className="inline-flex items-center space-x-2 bg-white/5 text-accent px-4 py-1.5 rounded-full border border-accent/30 mb-8 animate-fade-in backdrop-blur-sm">
          <Diamond size={14} />
          <span className="text-xs font-semibold tracking-[0.2em] uppercase">
            AI-Powered Elegance
          </span>
        </div>

        <h1 className="text-5xl md:text-7xl font-serif font-medium mb-6 tracking-tight leading-tight animate-slide-up text-white">
          Discover Jewelry That <br />
          <span className="italic text-accent">Matches Your Soul</span>
        </h1>

        <p
          className="text-lg text-secondary mb-10 max-w-xl mx-auto font-light animate-slide-up leading-relaxed"
          style={{ animationDelay: "0.2s" }}
        >
          Upload an image, describe your dream piece, or chat with our AI
          stylist to find your perfect match.
        </p>

        {/* ── Mode Toggle ─────────────────────────────── */}
        <div
          className="flex justify-center mb-8 animate-slide-up"
          style={{ animationDelay: "0.3s" }}
        >
          <div className="inline-flex bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-1">
            <button
              onClick={() => setIsChatMode(false)}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                !isChatMode
                  ? "bg-accent text-black shadow-lg"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Search size={16} />
              Quick Search
            </button>
            <button
              onClick={() => setIsChatMode(true)}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                isChatMode
                  ? "bg-accent text-black shadow-lg"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <MessageCircle size={16} />
              Chat with Stylist
            </button>
          </div>
        </div>

        {/* ── Quick Search Mode ──────────────────────── */}
        {!isChatMode && (
          <>
            <div
              className="bg-white/5 backdrop-blur-md p-2 rounded-xl shadow-2xl border border-white/10 max-w-2xl mx-auto animate-slide-up transition-all focus-within:border-accent/50 focus-within:ring-1 ring-accent/50"
              style={{ animationDelay: "0.4s" }}
            >
              <form onSubmit={handleSearch} className="flex items-center">
                <div className="flex-1 relative group">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-accent transition-colors" />
                  <input
                    type="text"
                    placeholder="Describe your desire (e.g., 'gold necklace')..."
                    className="w-full bg-transparent border-none text-white placeholder-gray-500 pl-14 pr-4 py-4 focus:outline-none focus:ring-0 text-lg font-light"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>

                <div className="h-8 w-px bg-white/10 mx-2"></div>

                {/* Upload Button */}
                <label
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  className={`cursor-pointer px-6 py-4 rounded-lg flex items-center justify-center transition-all ${isDragOver ? "bg-accent/20 text-accent" : "hover:bg-white/5 text-gray-400 hover:text-white"}`}
                  title="Upload Image"
                >
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  <Upload size={20} />
                </label>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="ml-2 bg-accent hover:bg-accent-dark text-black font-semibold py-3 px-8 rounded-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-[0_0_20px_rgba(201,162,77,0.3)]"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    "Find Gems"
                  )}
                </button>
              </form>
            </div>

            {/* Categories / Quick Links */}
            <div
              className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-gray-500 animate-slide-up font-medium tracking-wide uppercase"
              style={{ animationDelay: "0.6s" }}
            >
              <span className="text-gray-600">Try:</span>
              {["Vintage Rings", "Diamond Necklace"].map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    setQuery(tag);
                    onSearch(tag);
                  }}
                  className="hover:text-accent transition-colors border-b border-transparent hover:border-accent pb-0.5"
                >
                  {tag}
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── Chat Mode ──────────────────────────────── */}
        {isChatMode && (
          <div
            className="max-w-2xl mx-auto animate-slide-up"
            style={{ animationDelay: "0.4s" }}
          >
            {/* Chat Window */}
            <div className="bg-white/5 backdrop-blur-md rounded-xl shadow-2xl border border-white/10 overflow-hidden">
              {/* Chat Messages */}
              <div className="h-72 overflow-y-auto p-5 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
                {chatMessages.length === 0 && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Sparkles size={14} className="text-accent" />
                    </div>
                    <div className="bg-white/10 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]">
                      <p className="text-sm text-gray-300 leading-relaxed">
                        Hi! I'm your personal jewelry stylist. Tell me about the
                        occasion, your style preferences, or describe what
                        you're looking for, and I'll find the perfect piece for
                        you.
                      </p>
                    </div>
                  </div>
                )}

                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Sparkles size={14} className="text-accent" />
                      </div>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-3 max-w-[85%] ${
                        msg.role === "user"
                          ? "bg-accent/20 text-accent rounded-tr-sm"
                          : "bg-white/10 text-gray-300 rounded-tl-sm"
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Sparkles size={14} className="text-accent" />
                    </div>
                    <div className="bg-white/10 rounded-2xl rounded-tl-sm px-4 py-3">
                      <div className="flex gap-1.5">
                        <span
                          className="w-2 h-2 bg-accent/60 rounded-full animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        ></span>
                        <span
                          className="w-2 h-2 bg-accent/60 rounded-full animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        ></span>
                        <span
                          className="w-2 h-2 bg-accent/60 rounded-full animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        ></span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <form
                onSubmit={handleChatSubmit}
                className="border-t border-white/10 p-3 flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Tell me what you're looking for..."
                  className="flex-1 bg-transparent border-none text-white placeholder-gray-500 px-4 py-3 focus:outline-none focus:ring-0 text-sm"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !chatInput.trim()}
                  className="bg-accent hover:bg-accent-dark text-black p-3 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </form>
            </div>

            <p className="text-xs text-gray-600 mt-4">
              Example: "I want something elegant for a wedding" → "Are you
              looking for a ring or necklace?" → "Gold ring with diamonds"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
