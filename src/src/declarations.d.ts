declare module "generate-schema" {
  interface SchemaObject {
    [key: string]: any;
  }

  function json(title: string, input: any): SchemaObject;
  function object(title: string, input: object): SchemaObject;
  function array(title: string, input: any[]): SchemaObject;

  const generateSchema: {
    json: typeof json;
    object: typeof object;
    array: typeof array;
  };

  export = generateSchema;
}
