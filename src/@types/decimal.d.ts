/// <reference types="decimal.js" />
export {};
declare global {
  namespace decimal {
    interface Decimal {
      toNumber(): number;
    }
  }
}
export {};
