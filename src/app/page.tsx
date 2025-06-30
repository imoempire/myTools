/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";

interface GeneratedData {
  [key: string]: any;
}

export default function Home() {
  const [input, setInput] = useState<string>(``);
  const [tsOutput, setTsOutput] = useState<string[]>([]);
  const [generatedData, setGeneratedData] = useState<GeneratedData | null>(
    null
  );
  const [jsonSchema, setJsonSchema] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const [useInterface, setUseInterface] = useState<boolean>(true);
  const [rootName, setRootName] = useState<string>("RootObject");
  const [activeTab, setActiveTab] = useState<"convert" | "generate">("convert");

  const handleConvertToTypeScript = async () => {
    setError("");
    setTsOutput([]);
    setJsonSchema(null);

    if (!input.trim()) {
      setError("Input cannot be empty.");
      return;
    }

    try {
      let parsedSchema;

      if (input.trim().startsWith("{") || input.trim().startsWith("[")) {
        // Handle JSON input
        parsedSchema = JSON.parse(input);
        const response = await fetch("/api/convert-ts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jsonInput: parsedSchema, rootName }),
        });
        const result = await response.json();
        if (!response.ok)
          throw new Error(result.error || "Failed to convert JSON");
        setTsOutput(result.tsOutput);
        setJsonSchema(result.jsonSchema);
      } else if (input.includes("interface") || input.includes("type")) {
        // Handle TypeScript input
        const response = await fetch("/api/convert-ts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tsInput: input, rootName }),
        });
        const result = await response.json();
        if (!response.ok)
          throw new Error(result.error || "Failed to convert TypeScript");
        setTsOutput(result.tsOutput);
        setJsonSchema(result.jsonSchema);
      } else {
        throw new Error("Input must be valid JSON or TypeScript");
      }
    } catch (err) {
      setError((err as Error).message || "An error occurred.");
    }
  };

  const handleGenerateData = async () => {
    setError("");
    setGeneratedData(null);

    if (!jsonSchema) {
      setError("Please convert to TypeScript first to generate the schema.");
      return;
    }

    try {
      const dataResponse = await fetch("/api/generate-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schema: jsonSchema }),
      });
      const dataResult = await dataResponse.json();
      if (!dataResponse.ok)
        throw new Error(dataResult.error || "Failed to generate data");
      setGeneratedData(dataResult.data);
    } catch (err) {
      setError((err as Error).message || "An error occurred generating data.");
    }
  };

  const handleGenerateDataFromSchema = async () => {
    setError("");
    setGeneratedData(null);

    if (!input.trim()) {
      setError("Input cannot be empty.");
      return;
    }

    try {
      let parsed;

      try {
        parsed = JSON.parse(input);
      } catch {
        throw new Error("Input is not valid JSON");
      }

      const isSchema =
        parsed &&
        typeof parsed === "object" &&
        (parsed.$schema ||
          (parsed.type &&
            typeof parsed.type === "string" &&
            ["object", "array", "string", "number", "boolean", "null"].includes(
              parsed.type
            )) ||
          (parsed.properties && typeof parsed.properties === "object") ||
          parsed.anyOf ||
          parsed.oneOf ||
          parsed.allOf ||
          parsed.enum ||
          parsed.const ||
          parsed.pattern ||
          parsed.format ||
          parsed.minimum !== undefined ||
          parsed.maximum !== undefined);

      console.error(isSchema, "isSchema");

      const dataResponse = await fetch("/api/generate-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isSchema ? { schema: parsed } : { rawJson: parsed }
        ),
      });

      const dataResult = await dataResponse.json();
      if (!dataResponse.ok)
        throw new Error(dataResult.error || "Failed to generate data");

      setGeneratedData(dataResult.data);
    } catch (err) {
      setError((err as Error).message || "An error occurred generating data.");
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard!");
    } catch {
      setError("Failed to copy to clipboard.");
    }
  };

  const clearAll = () => {
    setInput("");
    setTsOutput([]);
    setGeneratedData(null);
    setJsonSchema(null);
    setError("");
  };

  return (
    <div className="max-w-4xl mx-auto p-6 font-sans">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
        JSON/TypeScript Converter & Data Generator
      </h1>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === "convert"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("convert")}
        >
          TypeScript Converter
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === "generate"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("generate")}
        >
          Data Generator
        </button>
      </div>

      {activeTab === "convert" && (
        <div className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="rootName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Root Interface/Type Name
            </label>
            <input
              id="rootName"
              type="text"
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={rootName}
              onChange={(e) => setRootName(e.target.value)}
              placeholder="e.g., RootObject"
            />
          </div>
          <div>
            <label
              htmlFor="input"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Enter JSON or TypeScript Interface
            </label>
            <textarea
              id="input"
              className="w-full h-48 p-4 text-sm border border-gray-300 rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your JSON or TypeScript interface here..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </div>
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
            <div className="flex gap-2">
              <button
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition"
                onClick={clearAll}
              >
                Clear All
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                onClick={handleConvertToTypeScript}
              >
                Convert to TypeScript
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "generate" && (
        <div className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="schemaInput"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Enter JSON Schema
            </label>
            <textarea
              id="schemaInput"
              className="w-full h-48 p-4 text-sm border border-gray-300 rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your JSON Schema here..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </div>
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {jsonSchema ? (
                <span className="text-green-600">
                  ✓ Schema available from conversion
                </span>
              ) : (
                "Provide a JSON Schema or convert from TypeScript first"
              )}
            </div>
            <div className="flex gap-2">
              <button
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition"
                onClick={clearAll}
              >
                Clear All
              </button>
              {jsonSchema ? (
                <button
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                  onClick={handleGenerateData}
                >
                  Generate from Converted Schema
                </button>
              ) : (
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                  onClick={handleGenerateDataFromSchema}
                >
                  Generate from Schema
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-red-500 text-center mt-4">{error}</p>}

      {tsOutput.length > 0 && (
        <div className="mt-6 p-4 bg-gray-100 rounded-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Generated TypeScript
          </h2>
          <button
            className="mb-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            onClick={() => copyToClipboard(tsOutput.join("\n"))}
          >
            Copy TypeScript
          </button>
          <pre className="whitespace-pre-wrap break-words text-sm bg-white p-3 rounded border">
            {tsOutput.map((item, index) => (
              <code key={index}>
                {useInterface ? item.replace(/type/g, "interface") : item}
                {"\n"}
              </code>
            ))}
          </pre>
        </div>
      )}

      {generatedData && (
        <div className="mt-6 p-4 bg-gray-100 rounded-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Generated Sample Data
          </h2>
          <button
            className="mb-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            onClick={() =>
              copyToClipboard(JSON.stringify(generatedData, null, 2))
            }
          >
            Copy Data
          </button>
          <pre className="whitespace-pre-wrap break-words text-sm bg-white p-3 rounded border">
            {JSON.stringify(generatedData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
