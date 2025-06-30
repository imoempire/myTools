/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import jsf from "json-schema-faker";
import { faker } from "@faker-js/faker";
import generateSchema from "generate-schema";

// Configure JSF with faker
jsf.extend("faker", () => faker);

function normalizeSchema(schema: any): any {
  if (typeof schema !== "object" || schema === null) {
    return schema;
  }

  if (Array.isArray(schema)) {
    return schema.map(normalizeSchema);
  }

  const normalized = { ...schema };

  // Handle type field
  if (typeof normalized.type === "string") {
    if (normalized.type.includes("|")) {
      const rawTypes = normalized.type.split("|").map((t: string) => t.trim());
      const supportedTypes = rawTypes.filter((t: string) =>
        [
          "string",
          "number",
          "boolean",
          "integer",
          "array",
          "object",
          "null",
        ].includes(t)
      );

      if (supportedTypes.length === 0) {
        console.warn(
          `Unrecognized union type "${normalized.type}", defaulting to "string"`
        );
        normalized.type = "string";
      } else {
        // Convert union type to array (e.g., "null | string" -> ["string", "null"])
        normalized.type =
          supportedTypes.length === 1 ? supportedTypes[0] : supportedTypes;
      }
    } else if (
      ![
        "string",
        "number",
        "boolean",
        "integer",
        "array",
        "object",
        "null",
      ].includes(normalized.type)
    ) {
      console.warn(
        `Unrecognized type "${normalized.type}", defaulting to "string"`
      );
      normalized.type = "string";
    } else {
      switch (normalized.type) {
        case "any":
        case "unknown":
          normalized.type = "string";
          break;
        case "Date":
          normalized.type = "string";
          normalized.format = "date-time";
          break;
      }
    }
  }

  // Normalize nested properties
  if (normalized.properties) {
    for (const key in normalized.properties) {
      normalized.properties[key] = normalizeSchema(normalized.properties[key]);
    }
  }

  // Normalize items in arrays
  if (normalized.items) {
    if (Array.isArray(normalized.items)) {
      normalized.items = normalized.items.map(normalizeSchema);
    } else {
      normalized.items = normalizeSchema(normalized.items);
    }
  }

  // Normalize additionalProperties
  if (
    normalized.additionalProperties &&
    typeof normalized.additionalProperties === "object"
  ) {
    normalized.additionalProperties = normalizeSchema(
      normalized.additionalProperties
    );
  }

  // Normalize definitions
  if (normalized.definitions) {
    for (const key in normalized.definitions) {
      normalized.definitions[key] = normalizeSchema(
        normalized.definitions[key]
      );
    }
  }

  // Normalize anyOf, oneOf, allOf
  ["anyOf", "oneOf", "allOf"].forEach((key) => {
    if (normalized[key] && Array.isArray(normalized[key])) {
      normalized[key] = normalized[key].map(normalizeSchema);
    }
  });

  return normalized;
}

export async function POST(req: NextRequest) {
  try {
    const { schema, rawJson } = await req.json();
    let workingSchema = schema;

    if (!schema && rawJson) {
      workingSchema = generateSchema.json("GeneratedSchema", rawJson);
      console.log(
        "Generated Schema from rawJson:",
        JSON.stringify(workingSchema, null, 2)
      );
    }

    if (!workingSchema) {
      return NextResponse.json(
        { error: "Schema or rawJson is required" },
        { status: 400 }
      );
    }

    console.log("Original Schema:", JSON.stringify(workingSchema, null, 2));
    const normalizedSchema = normalizeSchema(workingSchema);
    console.log(
      "Normalized Schema:",
      JSON.stringify(normalizedSchema, null, 2)
    );

    jsf.option({
      fillProperties: true,
      maxItems: 3,
      maxLength: 20,
      useDefaultValue: true,
      useExamplesValue: true,
      alwaysFakeOptionals: true,
    });

    console.log("============================");
    console.log(JSON.stringify(normalizedSchema), "normalizedSchema");
    console.log("============================");

    const generatedData = jsf.generate(normalizedSchema);

    return NextResponse.json({ data: generatedData });
  } catch (err) {
    console.error("Error generating data:", err);
    return NextResponse.json(
      { error: `Error generating data: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}
