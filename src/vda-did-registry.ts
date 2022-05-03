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

async function identityOwner(reqData: any) {
  try {
    const {identity} = reqData
    const ret = await controller.methods.identityOwner(identity).call()
    return { success:true, data:ret }
  } catch (e) {
    return { success:false, error:e }
  }
}

async function validDelegate(reqData : any) {
  try {
    const {identity, delegateType, delegate} = reqData
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

async function changeOwner(reqData: any) {
  try {
    const {identity, newOwner, signature} = reqData
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

async function addDelegate(reqData: any) {
  try {
    const {identity, delegateType, delegate, validity, signature} = reqData
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

async function revokeDelegate(reqData: any) {
  try {
    const {identity, delegateType, delegate, signature} = reqData
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

async function setAttribute(reqData: any) {
  try {
    const {identity, name, value, validity, signature} = reqData
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

async function revokeAttribute(reqData: any) {
  try {
    const {identity, name, value, signature} = reqData
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

async function bulkAdd(reqData: any) {
  try {
    const {identity, delegateParams, attributeParams, signature} = reqData
    const dParams = JSON.parse(delegateParams as string) as DelegateParam[]
    const aParams = JSON.parse(attributeParams as string) as AttributeParam[]
    const tx = controller.methods.bulkAdd(
      identity,
      dParams,
      aParams,
      signature
    )
    return await runSendTransction(tx)
  } catch (e) {
    // console.log('Error occured : ', e)
    return { success:false, error:e }
  }
}

async function bulkRevoke(reqData: any) {
  try {
    const {identity, delegateParams, attributeParams, signature} = reqData
    const dParams = JSON.parse(delegateParams as string) as DelegateParam[]
    const aParams = JSON.parse(attributeParams as string) as AttributeParam[]
    const tx = controller.methods.bulkRevoke(
      identity,
      dParams,
      aParams,
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

// Get End Points
didRegistryRouter.get('/identityOwner', async (req, res) => {
  res.send(await identityOwner(req.query))  
  })  

didRegistryRouter.get('/validDelegate', async (req, res) => {
  res.send(await validDelegate(req.query))
  })

didRegistryRouter.get('/changeOwner', async (req, res) => {
  res.send(await changeOwner(req.query))
  })

didRegistryRouter.get('/addDelegate', async (req, res) => {
  res.send(await addDelegate(req.query))
  })

didRegistryRouter.get('/revokeDelegate', async (req, res) => {
  res.send(await revokeDelegate(req.query))
  })

didRegistryRouter.get('/setAttribute', async (req, res) => {
  res.send(await setAttribute(req.query))
  })

didRegistryRouter.get('/revokeAttribute', async (req, res) => {
  res.send(await revokeAttribute(req.query))
  })

didRegistryRouter.get('/bulkAdd', async (req, res) => {
  res.send(await bulkAdd(req.query))
  })

didRegistryRouter.get('/bulkRevoke', async (req, res) => {
  res.send(await bulkRevoke(req.query))
  })

// Post EndPoints
didRegistryRouter.post('/identityOwner', async (req, res) => {
  res.send(await identityOwner(req.body))  
  })  

didRegistryRouter.post('/validDelegate', async (req, res) => {
  res.send(await validDelegate(req.body))
  })

didRegistryRouter.post('/changeOwner', async (req, res) => {
  res.send(await changeOwner(req.body))
  })

didRegistryRouter.post('/addDelegate', async (req, res) => {
  res.send(await addDelegate(req.body))
  })

didRegistryRouter.post('/revokeDelegate', async (req, res) => {
  res.send(await revokeDelegate(req.body))
  })

didRegistryRouter.post('/setAttribute', async (req, res) => {
  res.send(await setAttribute(req.body))
  })

didRegistryRouter.post('/revokeAttribute', async (req, res) => {
  res.send(await revokeAttribute(req.body))
  })

didRegistryRouter.post('/bulkAdd', async (req, res) => {
  res.send(await bulkAdd(req.body))
  })

didRegistryRouter.post('/bulkRevoke', async (req, res) => {
  res.send(await bulkRevoke(req.body))
  })

export default didRegistryRouter;