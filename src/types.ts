import * as es from 'estree'

export enum SBaseType {
  Number,
  String,
  Function,
}

export type SType = {
  base: SBaseType,
  params?: SType[],
}

export type SUntyped = {
  name: string,
  loc: es.SourceLocation,
}

export type STyped = SUntyped & {
  type: SType,
}
