/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import JsonToTS from 'json-to-ts';

function tsToJsonSchema(tsInput: string, rootName: string): { jsonSchema: any; tsOutput: string[] } {
  const interfaces = tsInput.match(/export interface\s+(\w+)\s*{[^}]*}/g) || [];
  const schemas: { [key: string]: any } = {};
  const tsOutput: string[] = [];

  interfaces.forEach((intf) => {
    const nameMatch = intf.match(/export interface\s+(\w+)/);
    const name = nameMatch ? nameMatch[1] : rootName;
    const properties: { [key: string]: any } = {};
    const required: string[] = [];

    const propMatches = intf.match(/(\w+)\s*:\s*([^;]+);/g) || [];
    propMatches.forEach((prop) => {
      const propMatch = prop.match(/(\w+)\s*:\s*([^;]+)/);
      if (!propMatch) return;
      const [, propName, propType] = propMatch;
      if (propType.includes(' | ')) {
        if (propType.includes('null')) {
          properties[propName] = { type: propType.replace(' | null', '').trim() };
        }
      } else {
        if (propType === 'string') {
          properties[propName] = { type: 'string', faker: propName === 'file_url' ? 'internet.url' : 'lorem.words' };
        } else if (propType === 'number') {
          properties[propName] = { type: 'integer', minimum: 1, maximum: 1000 };
        } else if (propType.includes('[]')) {
          const arrayType = propType.replace('[]', '').trim();
          properties[propName] = {
            type: 'array',
            items: { $ref: `#/definitions/${arrayType}` },
            minItems: 2,
            maxItems: 5,
          };
        } else {
          properties[propName] = { $ref: `#/definitions/${propType}` };
        }
        if (!propType.includes(' | null')) required.push(propName);
      }
    });

    schemas[name] = { type: 'object', properties, required };
    tsOutput.push(intf);
  });

  return {
    jsonSchema: {
      $schema: 'http://json-schema.org/draft-07/schema#',
      definitions: schemas,
      $ref: `#/definitions/${Object.keys(schemas)[0] || rootName}`,
    },
    tsOutput,
  };
}

function jsonToJsonSchema(jsonInput: any, rootName: string): { jsonSchema: any; tsOutput: string[] } {
  const tsOutput = JsonToTS(jsonInput, { rootName });
  const jsonSchema: any = { type: 'object', properties: {}, required: [] };

  const mainInterface = tsOutput[0] || '';
  const propMatches = mainInterface.match(/(\w+)\s*:\s*([^;]+);/g) || [];
  propMatches.forEach((prop) => {
    const propMatch = prop.match(/(\w+)\s*:\s*([^;]+)/);
    if (!propMatch) return;
    const [, propName, propType] = propMatch;
    if (propType.includes(' | ')) {
      if (propType.includes('null')) {
        jsonSchema.properties[propName] = { type: propType.replace(' | null', '').trim() };
      }
    } else {
      if (propType === 'string') {
        jsonSchema.properties[propName] = { type: 'string', faker: propName === 'file_url' ? 'internet.url' : 'lorem.words' };
      } else if (propType === 'number') {
        jsonSchema.properties[propName] = { type: 'integer', minimum: 1, maximum: 1000 };
      } else if (propType.includes('[]')) {
        const arrayType = propType.replace('[]', '').trim();
        jsonSchema.properties[propName] = {
          type: 'array',
          items: { $ref: `#/definitions/${arrayType}` },
          minItems: 2,
          maxItems: 5,
        };
      } else {
        jsonSchema.properties[propName] = { $ref: `#/definitions/${propType}` };
      }
      if (!propType.includes(' | null')) jsonSchema.required.push(propName);
    }
  });

  const definitions: { [key: string]: any } = {};
  tsOutput.slice(1).forEach((intf) => {
    const nameMatch = intf.match(/type\s+(\w+)/) || intf.match(/interface\s+(\w+)/);
    const name = nameMatch ? nameMatch[1] : rootName;
    const properties: { [key: string]: any } = {};
    const required: string[] = [];
    const propMatches = intf.match(/(\w+)\s*:\s*([^;]+);/g) || [];
    propMatches.forEach((prop) => {
      const propMatch = prop.match(/(\w+)\s*:\s*([^;]+)/);
      if (!propMatch) return;
      const [, propName, propType] = propMatch;
      if (propType.includes(' | ')) {
        if (propType.includes('null')) {
          properties[propName] = { type: propType.replace(' | null', '').trim() };
        }
      } else {
        properties[propName] = propType === 'string' ? { type: 'string', faker: 'lorem.words' }
          : propType === 'number' ? { type: 'integer', minimum: 1, maximum: 1000 }
          : propType.includes('[]') ? { type: 'array', items: { $ref: `#/definitions/${propType.replace('[]', '').trim()}` }, minItems: 2, maxItems: 5 }
          : { $ref: `#/definitions/${propType}` };
        if (!propType.includes(' | null')) required.push(propName);
      }
    });
    definitions[name] = { type: 'object', properties, required };
  });

  return {
    jsonSchema: {
      $schema: 'http://json-schema.org/draft-07/schema#',
      definitions,
      ...jsonSchema,
    },
    tsOutput,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { tsInput, jsonInput, rootName = 'RootObject' } = await req.json();

    if (!tsInput && !jsonInput) {
      return NextResponse.json({ error: 'Input is required' }, { status: 400 });
    }

    if (jsonInput) {
      const { jsonSchema, tsOutput } = jsonToJsonSchema(jsonInput, rootName);
      return NextResponse.json({ jsonSchema, tsOutput });
    }

    const { jsonSchema, tsOutput } = tsToJsonSchema(tsInput, rootName);
    return NextResponse.json({ jsonSchema, tsOutput });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message || 'Failed to process input' }, { status: 400 });
  }
}