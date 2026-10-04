import React, { useState } from "react";
import axios from "axios";

export default function ImageUpload() {
  const [file, setFile] = useState(null);
  const [results, setResults] = useState([]);

  async function submit() {
    const fd = new FormData();
    fd.append("file", file);
    const res = await axios.post("http://127.0.0.1:8000/search/image", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    setResults(res.data.results || []);
  }

  return (
    <div style={{ marginTop: 20 }}>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button onClick={submit} disabled={!file}>
        Upload
      </button>
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
