export type Schema = {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  properties: Array<any>;
  associations: Array<{
    id: string;
    fromObjectTypeId: string;
    toObjectTypeId: string;
    name?: string;
    createdAt?: string | null;
    updatedAt?: string | null;
  }>;
  labels: {
    singular?: string;
    plural?: string;
  };
  requiredProperties: Array<string>;
  searchableProperties?: Array<string>;
  primaryDisplayProperty?: string;
  fullyQualifiedName?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

export type FetchSchemasResponse = { results: Array<Schema> };
