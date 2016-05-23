
declare var require: {
   <T>(path: string): T;
   (paths: string[], callback: (...modules: any[]) => void): void;
   ensure: (paths: string[], callback: (require: <T>(path: string) => T) => void) => void;
};

declare module "object-assign" {
  function objectAssign(target: any, ...sources: any[]): any;
  export = objectAssign;
}
