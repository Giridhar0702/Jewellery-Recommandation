import React, { useState } from "react";
import axios from "axios";

export default function TextSearch() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);

  async function submit() {
    const res = await axios.post("http://127.0.0.1:8000/search/text", {
      query: q,
    });
    setResults(res.data.results || []);
  }

  return (
    <div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Describe what you want"
        style={{ width: 400 }}
      />
      <button onClick={submit}>Search</button>
      <div>
        {results.map((r, i) => (
          <div key={i}>
            {r.name || r.image || "item"} — score{" "}
            {(r.similarity_score || 0).toFixed(2)}
          </div>
        ))}
      </div>
    </div>
  );
}
