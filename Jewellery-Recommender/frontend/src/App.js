import React, { useState, useCallback } from "react";
import axios from "axios";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import ProductGrid from "./components/ProductGrid";
import Footer from "./components/Footer";

// Configure Axios base URL for backend API
axios.defaults.baseURL = "http://127.0.0.1:8000";

// Generate a random session ID for chat
const generateSessionId = () =>
  "sess_" + Math.random().toString(36).substring(2, 15);

export default function App() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTitle, setSearchTitle] = useState("Featured Collection");

  // ── Chat state ───────────────────────────────────────────
  const [isChatMode, setIsChatMode] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [sessionId] = useState(generateSessionId);

  const handleSearch = async (query) => {
    const normalized = String(query || "").trim();
    if (!normalized) return;
    setLoading(true);
    setError(null);
    setSearchTitle(`Results for "${normalized}"`);
    try {
      const res = await axios.post("/search/text", { query: normalized });
      setRecommendations(res.data.results || []);
    } catch (err) {
      console.error(err);
      const message =
        err?.response?.data?.detail ||
        "Failed to fetch recommendations. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file) => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setSearchTitle("Visual Matches");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("/search/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // /search/image returns array directly, not wrapped in {results: []}
      setRecommendations(
        Array.isArray(res.data) ? res.data : res.data.results || [],
      );
    } catch (err) {
      console.error(err);
      setError("Failed to analyze image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Conversational chat handler ──────────────────────────
  const handleChatMessage = useCallback(
    async (message) => {
      setError(null);

      // Optimistically add user message to chat
      setChatMessages((prev) => [...prev, { role: "user", content: message }]);
      setLoading(true);

      try {
        const res = await axios.post("/chat/search", {
          session_id: sessionId,
          message,
        });

        const data = res.data;

        if (data.type === "message") {
          // Assistant needs more info — show clarifying question
          setChatMessages((prev) => [
            ...prev,
            { role: "assistant", content: data.message },
          ]);
        } else if (data.type === "results") {
          // Search was triggered — show confirmation + results
          setChatMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: `Great! I found some beautiful pieces for "${data.query}". Check out the results below!`,
            },
          ]);
          setSearchTitle(`Stylist Picks for "${data.query}"`);
          setRecommendations(data.results || []);

          // Scroll to results after a brief delay
          setTimeout(() => {
            document
              .getElementById("results")
              ?.scrollIntoView({ behavior: "smooth" });
          }, 300);
        }
      } catch (err) {
        console.error(err);
        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Sorry, something went wrong. Please try again.",
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [sessionId],
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      <Navbar />

      <main className="flex-grow pt-16">
        <Hero
          onSearch={handleSearch}
          onUpload={handleUpload}
          onChatMessage={handleChatMessage}
          chatMessages={chatMessages}
          isLoading={loading}
          isChatMode={isChatMode}
          setIsChatMode={setIsChatMode}
        />

        {error && (
          <div className="max-w-7xl mx-auto px-4 mt-8">
            <div
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative"
              role="alert"
            >
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          </div>
        )}

        {/* Results Section */}
        <div id="results">
          <ProductGrid products={recommendations} title={searchTitle} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
