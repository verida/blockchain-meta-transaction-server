require('dotenv').config()

import { ethers } from 'ethers';
import Axios from 'axios';
import { BlockchainAnchor } from '@verida/types';

/**
 * Get targeting net name of this server.
 * Read value from .env file.
 * @returns Blockchain name
 */
export function getCurrentNet() : BlockchainAnchor {
  const strChain = process.env.RPC_TARGET_NET ?? "polamoy";
  switch (strChain) {
    case "mainnet":
    case "polpos":
    case "0x89":
      return BlockchainAnchor.POLPOS;
    default:
      return BlockchainAnchor.POLAMOY;
  }
}

/**
 * Convert string to Bytes32
 * @param str - Input string
 * @returns - string of Bytes32 value
 */
export function stringToBytes32(str: string) {
  const buffStr = '0x' + Buffer.from(str).slice(0, 32).toString('hex')
  return buffStr + '0'.repeat(66 - buffStr.length)
}

export async function getMaticFee(gasStationUrl: string, mode: string) {
  let maxFeePerGas = ethers.BigNumber.from(40000000000); // fallback to 40 gwei
  let maxPriorityFeePerGas = ethers.BigNumber.from(40000000000); // fallback to 40 gwei
  // const gasLimit = ethers.BigNumber.from(50000000000); // fallback to 50 gwei

  try {
    const { data } = await Axios({
      method: 'get',
      url: gasStationUrl
    });

    maxFeePerGas = ethers.utils.parseUnits(
      Math.ceil(data[mode].maxFee) + '',
      'gwei'
    );
    maxPriorityFeePerGas = ethers.utils.parseUnits(
      Math.ceil(data[mode].maxPriorityFee) + '',
      'gwei'
    );
  } catch {
    // ignore
    console.log('Error in get gasfee from gas station url');
  }

  // return { maxFeePerGas, maxPriorityFeePerGas, gasLimit };
  return { maxFeePerGas, maxPriorityFeePerGas };
}