export type Schema = {
  id: string;
  createdAt: string;
  updatedAt: string | null;
  properties?: [
    {
      updatedAt: string | null;
      createdAt: string;
      name: string;
      label: string;
      type: string;
      fieldType: string;
      groupName: string;
      displayOrder: number;
      calculated: boolean;
      externalOptions: boolean;
      archived: boolean;
      hasUniqueValue: boolean;
    },
  ];
  associations?: [
    {
      id: string;
      fromObjectTypeId: string;
      toObjectTypeId: string;
      name: string;
    },
  ];
  labels: {
    singular: string;
    plural: string;
  };
  requiredProperties: Array<string>;
  searchableProperties: Array<string>;
  primaryDisplayProperty: Array<string>;
  metaType: string;
  fullyQualifiedName: string;
  name: string;
};

export type FetchSchemasResponse = { results: Array<Schema> };
