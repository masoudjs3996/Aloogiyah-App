export type Row = Record<string, any>;
export type Field = {name:string;type:string;required:boolean;csType?:string;options?:string[];default?:unknown;maxLength?:number;min?:number;max?:number};
export type Endpoint = {id:string;controller:string;method:string;path:string;action:string;query:Field[];body:Field[];params:Field[];encoding:string;bodyType:string;roles:string[]};
export type Resource = {id:string;title:string;description:string;group:string;icon:string;columns:string[];statusEntity?:string;listAction?:string;detailAction?:string;defaults?:Row;disabledActions?:string[];note?:string};
export type Lookups={statuses:Row[];roles:Row[];fileTypes:Row[]};
