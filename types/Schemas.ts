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

export type CreateObjectsResponse = {
  status: string;
  startedAt: string;
  completedAt: string;
  results: Array<{
    id: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    properties: Array<any>;
    createdAt: string;
    updatedAt: string;
    archived: boolean;
  }>;
};

export type SchemaDefinition = {
  allowsSensitiveProperties?: boolean;
  associatedObjects?: Array<string>;
  description?: string;
  labels: {
    plural: string;
    singular: string;
  };
  searchableProperties?: Array<string>;
  secondaryDisplayProperties?: Array<string>;
  name: string;
  primaryDisplayProperty?: string;
  properties: [
    {
      isPrimaryDisplayLabel: true;
      label: string;
      name: string;
    },
  ];
  requiredProperties: Array<string>;
};

export type ObjectDefinition = {
  inputs: [
    {
      associations?: [
        {
          types: [
            {
              associationCategory: string;
              associationTypeId: number;
            },
          ];
          to: {
            id: string;
          };
        },
      ];
      objectWriteTraceId?: number;
      properties: {
        [key: string]: string;
      };
    },
  ];
};
