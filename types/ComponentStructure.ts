import { COMPONENT_TYPES, SUBCOMPONENT_TYPES } from '../enums/build';
import { ValueOf } from './Utils';

export type ComponentStructure = {
  [key: string]: Array<string>;
};

export type ComponentStructureResponse = {
  topLevelComponentsWithChildren: ComponentStructure;
};

export type ProjectComponentsMetadata = {
  topLevelComponentMetadata: TopLevelComponents[];
};

export interface ComponentMetadata<T> {
  componentName: string;
  type: {
    name: T;
  };
  deployOutput: unknown;
}

export interface TopLevelComponent
  extends ComponentMetadata<ValueOf<typeof COMPONENT_TYPES>> {
  featureComponents: FeatureComponents[];
}

export interface PrivateAppComponentMetadata extends TopLevelComponent {
  deployOutput: {
    cardId: number;
    appId: number;
  };
}

export type TopLevelComponents =
  | PrivateAppComponentMetadata
  | TopLevelComponent;

export interface FeatureComponent<T = unknown>
  extends ComponentMetadata<ValueOf<typeof SUBCOMPONENT_TYPES>> {
  deployOutput: T;
}

export type AppFunctionComponentMetadata = FeatureComponent<{
  appId: number;
  appFunctionName: string;
  endpoint?: {
    path: string;
    methods: string[];
  };
}>;

export type FeatureComponents = FeatureComponent | AppFunctionComponentMetadata;
