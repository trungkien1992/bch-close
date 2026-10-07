declare module "bchaddrjs/dist/bchaddrjs-0.5.2.min.js" {
  const bchaddr: {
    isValidAddress(address: string): boolean;
    isMainnetAddress(address: string): boolean;
    toCashAddress(address: string): string;
    toLegacyAddress(address: string): string;
  };
  export default bchaddr;
}
