import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


export function getAptosClient() {
  const config = new AptosConfig({ network: Network.TESTNET });
  return new Aptos(config);
}
