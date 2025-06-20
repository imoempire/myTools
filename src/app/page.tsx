/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState } from "react";
import JsonToTS from "json-to-ts";

export default function Home() {
  const [jsonInput, setJsonInput] = useState<string>("");
  const [output, setOutput] = useState<string[]>([]);
  const [error, setError] = useState<string>("");
  const [useInterface, setUseInterface] = useState<boolean>(true);

  const handleConvert = () => {
    try {
      const parsedJson = JSON.parse(jsonInput);
      const tsOutput = JsonToTS(parsedJson, { rootName: "RootObject" });
      setOutput(tsOutput);
      setError("");
    } catch (err) {
      setError("Invalid JSON. Please check your input.");
      setOutput([]);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 font-sans">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
        JSON to TypeScript Converter
      </h1>
      <div className="flex flex-col gap-4">
        <textarea
          className="w-full h-48 p-4 text-sm border border-gray-300 rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter your JSON here..."
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
        />
        <div className="flex justify-between items-center">
          <label className="flex items-center gap-2 text-gray-700">
            <input
              type="checkbox"
              checked={useInterface}
              onChange={() => setUseInterface(!useInterface)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
            />
            Use Interfaces (instead of Types)
          </label>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            onClick={handleConvert}
          >
            Convert
          </button>
        </div>
      </div>
      {error && <p className="text-red-500 text-center mt-4">{error}</p>}
      {output.length > 0 && (
        <div className="mt-6 p-4 bg-gray-100 rounded-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Generated TypeScript
          </h2>
          <button
            className="mb-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            onClick={() => navigator.clipboard.writeText(output.join("\n"))}
          >
            Copy to Clipboard
          </button>
          <pre className="whitespace-pre-wrap break-words text-sm">
            {output.map((item, index) => (
              <code key={index}>
                {useInterface ? item.replace(/type/g, "interface") : item}
                {"\n"}
              </code>
            ))}
          </pre>
        </div>
      )}
    </div>
  );
}
