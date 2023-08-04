import { COMPONENT_TYPES, SUBCOMPONENT_TYPES } from '../enums/build';
import { ValueOf } from './Utils';

export type ComponentStructure = {
  [key: string]: Array<string>;
};

export type ComponentStructureResponse = {
  topLevelComponentsWithChildren: ComponentStructure;
};

export type ComponentMetadata = {
  componentIdentifier: string;
  componentName: string;
  componentType:
    | ValueOf<typeof COMPONENT_TYPES>
    | ValueOf<typeof SUBCOMPONENT_TYPES>;
  metadata: {
    appId: string;
  };
  parentComponentType: string;
};

export type ComponentMetadataResponse = {
  results: Array<ComponentMetadata>;
};
