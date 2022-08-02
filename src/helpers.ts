import { hexlify, hexValue, isBytes } from '@ethersproject/bytes'
import * as base64 from '@ethersproject/base64'
import { Base58 } from '@ethersproject/basex'
import { toUtf8Bytes } from '@ethersproject/strings'

require('dotenv').config()

/**
 * Get targeting net name of this server.
 * Read value from .env file.
 * @returns Blockchain name
 */
export function getCurrentNet() {
  const defaultNet = "RPC_URL_POLYGON_MAINNET";
  return process.env.RPC_TARGET_NET != undefined ? process.env.RPC_TARGET_NET :  defaultNet;
}

/**
 * Get RPC URL of chain.
 * Read value from .env file.
 * @param net Blockchain name
 * @returns 
 */
export function getRPCURLofNet(net : string) {
  const defaultNetURL = "https://polygon-rpc.com";
  let rpcURL = process.env[net];
  rpcURL = rpcURL != undefined ? rpcURL : defaultNetURL;
  return rpcURL;
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

/**
 * Decode attribute value by encoding method
 *
 * @param value Attribute value from attributeToHex() function
 * @param encoding Encoding method from attributetoHex() function
 * @returns Decoded hex string
 */
 function decodeAttrValue(value: string, encoding: string | undefined) {
  const matchHexString = value.match(/^0x[0-9a-fA-F]*$/)
  if (encoding && !matchHexString) {
    if (encoding === 'base64') {
      return hexlify(base64.decode(value))
    }
    if (encoding === 'base58') {
      return hexlify(Base58.decode(value))
    }
  } else if (matchHexString) {
    return <string>value
  }

  return hexlify(toUtf8Bytes(value))
}

/**
 * Convert string to hex format. Used in DIDRegistryContract interaction
 * @param key - Attribute key
 * @param value - Attribute value
 * @returns {string} string value in hex format
 */
export function attributeToHex(key: string, value: string | Uint8Array): string {
  if (value instanceof Uint8Array || isBytes(value)) {
    return hexlify(value)
  }
  const matchKeyWithEncoding = key.match(/^did\/(pub|auth|svc)\/(\w+)(\/(\w+))?(\/(\w+))?$/)
  const encoding = matchKeyWithEncoding?.[6]

  // const matchValueWithContext =
  //   matchKeyWithEncoding?.[1] === 'svc'
  //     ? (<string>value).match(/(.*)\?context=(.*)&type=(\w+)/)
  //     : (<string>value).match(/(.*)\?context=(.*)/)
  const matchValueWithContext = value.match(/(.*)(\?context=(.*))/)

  // console.log('attributeToHex value : ', value)
  // console.log('attributeToHex matched : ', matchValueWithContext)

  const attrVal = matchValueWithContext ? matchValueWithContext?.[1] : <string>value
  const attrContext = matchValueWithContext?.[2]

  let returnValue = decodeAttrValue(attrVal, encoding)

  if (attrContext) {
    const contextTag = Buffer.from(attrContext, 'utf-8').toString('hex')
    returnValue = `${returnValue}${contextTag}`
  }
  return returnValue
}