import { Primitive, Visibility } from './ts.type';

export type FieldType = Primitive | Record<string, FieldInfo>;

export interface BlockInfo {
  variables: Record<string, FieldInfo>;
  blocks: BlockInfo[];
  type: 'if' | 'while' | 'for' | 'switch';
  conditions: {
    operator: string;
    first: string;
    second: string;
  }[];
}

export interface FieldInfo {
  values: string[];
  modifiable: boolean;
  type: {
    array?: boolean;
    signature: FieldType;
  };
  name: string;
  visibility: Visibility;
}

export interface MethodInfo {
  visibility: Visibility;
  parameters: Record<string, FieldInfo>;
  returnType: string;
  name: string;
}

export interface ClassInfo {
  methods: Record<string, MethodInfo>;
  creator: MethodInfo;
  fields: Record<string, FieldInfo>;
}

export interface FileInfo {
  imports: Record<string, string>;
  classes: Record<string, ClassInfo>;
  global: {
    function: Record<string, MethodInfo>;
    constant: Record<string, FieldInfo>;
  };
}
