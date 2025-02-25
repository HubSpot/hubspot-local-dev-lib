export type ObjectDefinition = {
  associations: [
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
  objectWriteTraceId: string;
  properties: {
    [key: string]: string;
  };
};
