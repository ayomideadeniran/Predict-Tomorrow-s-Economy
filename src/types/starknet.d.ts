declare module "@starknet-io/get-starknet" {
  export function connect(options?: any): Promise<any>;
  export function disconnect(options?: any): Promise<void>;
}
