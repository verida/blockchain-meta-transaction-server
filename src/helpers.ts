require('dotenv').config()

/**
 * Get targeting net name of this server.
 * Read value from .env file.
 * @returns Blockchain name
 */
export function getCurrentNet() {
  const defaultNet = "testnet";
  return process.env.RPC_TARGET_NET != undefined ? process.env.RPC_TARGET_NET :  defaultNet;
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