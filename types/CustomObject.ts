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
