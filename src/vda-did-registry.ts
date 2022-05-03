import {Router} from 'express'

import {
    arrayify,
    concat,
    formatBytes32String,
    hexConcat,
    hexlify,
    keccak256,
    SigningKey,
    toUtf8Bytes,
    zeroPad,
  } from 'ethers/lib/utils.js'

import { stringToBytes32, attributeToHex } from './helpers'

import Web3 from 'web3'
import { BigNumber, BigNumberish } from 'ethers';
import { sign } from 'crypto';

const ControllerContract = require('../artifacts/contracts/EthereumDIDRegistry.sol/EthereumDIDRegistry.json')

// BSC
// Original
// const address = "0x713A5Db664297195061b9558f40e88434cb79C77";
// New with Signature Feature
const address = "0x2862BC860f55D389bFBd1A37477651bc1642A20B";

const web3 = new Web3('https://speedy-nodes-nyc.moralis.io/bd1c39d7c8ee1229b16b4a97/bsc/testnet');

// Polygon main net
// const address = '0xAe8c7BBA52Dfc2346dCa38840389495D38eE7C7c'
// const web3 = new Web3('https://polygon-rpc.com/')
// const web3 = new Web3('https://polygon-mainnet.g.alchemy.com/v2/JT3kfJ7hivnlA2dtPNpw3ahJCjhW26EV');

const { privateKey } = require('../.evn.json')

const { address: admin } = web3.eth.accounts.wallet.add(privateKey)
const controller = new web3.eth.Contract(ControllerContract.abi, address)

// Test Purpose
console.log("Wallet Address :", admin)

// Define Types
type Bytes = ArrayLike<number>;

type BytesLike = Bytes | string;

type DelegateParam = {
  delegateType: BytesLike;
  delegate: string;
  validity?: BigNumberish;
};

type AttributeParam = {
  name: BytesLike;
  value: BytesLike;
  validity?: BigNumberish;
}

async function identityOwner(identity: string) {
  try {
    const ret = await controller.methods.identityOwner(identity).call()
    return { success:true, data:ret }
  } catch (e) {
    return { success:false, error:e }
  }
}

async function validDelegate(identity: string, delegateType: BytesLike, delegate: String) {
  try {
    const ret  = await controller.methods.validDelegate(identity, delegateType, delegate).call();   
    return { success:true, data:ret }
  } catch (e) {
    return { success:false, error:e }
  }
}

async function runSendTransction(tx: any) {
  try {
    // const [gasPrice, gasCost] = await Promise.all([web3.eth.getGasPrice(), tx.estimateGas({ from: admin })])
    const gasPrice = 10000000000
    const gasCost = 100000

    const data = tx.encodeABI()

    const txData = {
        from: admin,
        to: controller.options.address,
        data,
        gas: gasCost,
        gasPrice,
    }

    const receipt = await web3.eth.sendTransaction(txData)
    console.log(`Transaction hash: ${receipt.transactionHash}`)
    // console.log('Receipt', receipt);
    return { success:true, transactionHash: receipt.transactionHash }
  } catch (e) {
    console.log('Error occured in send transaction', )
    return { success:false, error:e }
  }
}

async function changeOwner(
  identity: string, 
  newOwner: string,
  signature: BytesLike) {
  try {
    const tx = controller.methods.changeOwner(
      identity,
      newOwner,
      signature
    )
    // console.log("changeOwner - tx:", tx)
    return await runSendTransction(tx)
  } catch (e) {
    // console.log('Error occured : ', e)
    return { success:false, error:e }
  }
}

async function addDelegate(
  identity: string,
  delegateType: BytesLike,
  delegate: string,
  validity: BigNumberish,
  signature: BytesLike
) {
  try {
    const tx = controller.methods.addDelegate(
      identity,
      delegateType,
      delegate,
      validity,
      signature
    )
    return await runSendTransction(tx)
  } catch (e) {
    // console.log('Error occured : ', e)
    return { success:false, error:e }
  }
}

async function revokeDelegate(
  identity: string,
  delegateType: BytesLike,
  delegate: string,
  signature: BytesLike
) {
  try {
    const tx = controller.methods.revokeDelegate(
      identity,
      delegateType,
      delegate,
      signature
    )
    return await runSendTransction(tx)
  } catch (e) {
    // console.log('Error occured : ', e)
    return { success:false, error:e }
  }
}

async function setAttribute(
  identity: string,
  name: BytesLike,
  value: BytesLike,
  validity: BigNumberish,
  signature: BytesLike
) {
  try {
    const tx = controller.methods.setAttribute(
      identity,
      name,
      value,
      validity,
      signature
    )

    return await runSendTransction(tx)
  } catch (e) {
    // console.log('Error occured : ', e)
    return { success:false, error:e }
  }
}

async function revokeAttribute(
  identity: string,
  name: BytesLike,
  value: BytesLike,
  signature: BytesLike
) {
  try {
    const tx = controller.methods.revokeAttribute(
      identity,
      name,
      value,
      signature
    )
    return await runSendTransction(tx)
  } catch (e) {
    // console.log('Error occured : ', e)
    return { success:false, error:e }
  }
}

async function bulkAdd(
  identity: string,
  delegateParams: DelegateParam[],
  attributeParams: AttributeParam[],
  signature: BytesLike
) {
  try {
    const tx = controller.methods.bulkAdd(
      identity,
      delegateParams,
      attributeParams,
      signature
    )
    return await runSendTransction(tx)
  } catch (e) {
    // console.log('Error occured : ', e)
    return { success:false, error:e }
  }
}

async function bulkRevoke(
  identity: string,
  delegateParams: DelegateParam[],
  attributeParams: AttributeParam[],
  signature: BytesLike
) {
  try {
    const tx = controller.methods.bulkRevoke(
      identity,
      delegateParams,
      attributeParams,
      signature
    )
    return await runSendTransction(tx)
  } catch (e) {
    // console.log('Error occured : ', e)
    return { success:false, error:e }
  }
}

// Setting Routes
const didRegistryRouter = Router();

didRegistryRouter.get('/identityOwner', async (req, res) => {
  try {
    //  console.log("Query = ", req.query)
    const identity  = req.query.identity as string;
    const ret = await identityOwner(identity)
    res.send(ret)  
  } catch (e) {
    res.send({success:false, error:'Invalid argument'})
  }
  
  })

didRegistryRouter.get('/validDelegate', async (req, res) => {
  try {
    const {identity, delegateType, delegate} = req.query

    const ret = await validDelegate(identity as string, delegateType as BytesLike, delegate as string)
    res.send(ret)
  } catch (e) {
    res.send({success:false, error:'Invalid argument'})
  }
  })

didRegistryRouter.get('/changeOwner', async (req, res) => {
  try {
    const {identity, newOwner, signature} = req.query
    const ret = await changeOwner(
      identity as string, 
      newOwner as string, 
      signature as BytesLike)
    res.send(ret)
  } catch (e) {
    res.send({success:false, error:'Invalid argument'})
  }
  })

didRegistryRouter.get('/addDelegate', async (req, res) => {
  try {
    const {identity, delegateType, delegate, validity, signature} = req.query
    const ret = await addDelegate(
      identity as string, 
      delegateType as BytesLike, 
      delegate as string, 
      validity as BigNumberish, 
      signature as BytesLike)
    res.send(ret)
  } catch (e) {
    res.send({success:false, error:'Invalid argument'})
  }
  })

didRegistryRouter.get('/revokeDelegate', async (req, res) => {
  try {
    const {identity, delegateType, delegate, signature} = req.query
    const ret = await revokeDelegate(
      identity as string, 
      delegateType as BytesLike, 
      delegate as string, 
      signature as BytesLike)
    res.send(ret)
  } catch (e) {
    res.send({success:false, error:'Invalid argument'})
  }
  })

didRegistryRouter.get('/setAttribute', async (req, res) => {
  try {
    const {identity, name, value, validity, signature} = req.query
    const ret = await setAttribute(
      identity as string,
      name as BytesLike,
      value as BytesLike,
      validity as BigNumberish,
      signature as BytesLike)
    res.send(ret)
  } catch (e) {
    res.send({success:false, error:'Invalid argument'})
  }  
  })

didRegistryRouter.get('/revokeAttribute', async (req, res) => {
  try {
    const {identity, name, value, signature} = req.query
    const ret = await revokeAttribute(
      identity as string,
      name as BytesLike,
      value as BytesLike,
      signature as BytesLike)
    res.send(ret)
  }  catch (e) {
    res.send({success:false, error:'Invalid argument'})
  }
  })

didRegistryRouter.get('/bulkAdd', async (req, res) => {
  try {
    const {identity, delegateParams, attributeParams, signature} = req.query
    const ret = await bulkAdd(
      identity as string,
      JSON.parse(delegateParams as string) as DelegateParam[],
      JSON.parse(attributeParams as string) as AttributeParam[],
      signature as BytesLike
    )
    res.send(ret)
  } catch (e) {
    res.send({success:false, error:'Invalid argument'})
  }  
  })

didRegistryRouter.get('/bulkRevoke', async (req, res) => {
  try {
    const {identity, delegateParams, attributeParams, signature} = req.query
    const ret = await bulkRevoke(
      identity as string,
      JSON.parse(delegateParams as string) as DelegateParam[],
      JSON.parse(attributeParams as string) as AttributeParam[],
      signature as BytesLike
    )
    res.send(ret)
  } catch (e) {
    res.send({success:false, error:'Invalid argument'})
  }
  })

export default didRegistryRouter;