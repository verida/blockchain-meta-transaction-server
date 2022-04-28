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
import { BigNumberish } from 'ethers';

const ControllerContract = require('../artifacts/contracts/EthereumDIDRegistry.sol/EthereumDIDRegistry.json')

// BSC
const address = "0x713A5Db664297195061b9558f40e88434cb79C77";
const web3 = new Web3('https://speedy-nodes-nyc.moralis.io/bd1c39d7c8ee1229b16b4a97/bsc/testnet');

// Polygon main net
// const address = '0xAe8c7BBA52Dfc2346dCa38840389495D38eE7C7c'
// const web3 = new Web3('https://polygon-rpc.com/')
// const web3 = new Web3('https://polygon-mainnet.g.alchemy.com/v2/JT3kfJ7hivnlA2dtPNpw3ahJCjhW26EV');

const { privateKey } = require('../.evn.json')

const { address: admin } = web3.eth.accounts.wallet.add(privateKey)
const controller = new web3.eth.Contract(ControllerContract.abi, address)

// Define Types
type Bytes = ArrayLike<number>;

type BytesLike = Bytes | string;

async function identityOwner(identity: string) {
  let ret = await controller.methods.identityOwner(identity).call()
  return ret
}

async function validDelegate(identity: string, delegateType: BytesLike, delegate: String) {
  let ret  = await controller.methods.validDelegate(identity, delegateType, delegate);
  return ret
}

async function runSendTransction(tx: any) {
  try {
    const [gasPrice, gasCost] = await Promise.all([web3.eth.getGasPrice(), tx.estimateGas({ from: admin })])

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
    return { success: true, transactionHash: receipt.transactionHash }
  } catch (e) {
    console.log('Error occured : ', e)
    return { success: false, error: e }
  }
}

async function changeOwner(
  identity: string, 
  newOwner: string) {
  try {
    const tx = controller.methods.changeOwner(
      identity,
      newOwner
    )
    return await runSendTransction(tx)
  } catch (e) {
    console.log('Error occured : ', e)
    return { success: false, error: e }
  }
}

async function changeOwnerSigned(
  identity: string,
  sigV: BigNumberish,
  sigR: BytesLike,
  sigS: BytesLike,
  newOwner: string
) {
  try {
    const tx = controller.methods.changeOwnerSigned(
      identity,
      sigV,
      sigR,
      sigS,
      newOwner
    )
    return await runSendTransction(tx)
  } catch (e) {
    console.log('Error occured : ', e)
    return { success: false, error: e }
  }
}

async function addDelegate(
  identity: string,
  delegateType: BytesLike,
  delegate: string,
  validity: BigNumberish,
) {
  try {
    const tx = controller.methods.addDelegate(
      identity,
      delegateType,
      delegate,
      validity
    )
    return await runSendTransction(tx)
  } catch (e) {
    console.log('Error occured : ', e)
    return { success: false, error: e }
  }
}

// Setting Routes
const didRegistryRouter = Router();

didRegistryRouter.get('/identityOwner', async (req, res) => {
  //  console.log("Query = ", req.query)
  let identity  = req.query.identity as string;
  //  let owner = await identityOwner('0x713A5Db664297195061b9558f40e88434cb79C77')
  let owner = await identityOwner(identity)
    res.send(owner)
  })

didRegistryRouter.get('/validDelegate', async (req, res) => {
  let identity  = req.query.identity as string;
  let delegateType = req.query.delegateType as BytesLike
  let delegate = req.query.delegate as string
  let ret = await validDelegate(identity, delegateType, delegate)
  res.send(ret)
  })

didRegistryRouter.get('/changeOwner', async (req, res) => {
  let identity  = req.query.identity as string
  let newOwner = req.query.newOwner as string
  let ret = await changeOwner(identity, newOwner)
  res.send(ret)
  })

didRegistryRouter.get('/changeOwnerSigned', async (req, res) => {
  let identity  = req.query.identity as string
  let sigV = req.query.sigV as BigNumberish
  let sigR = req.query.sigR as BytesLike
  let sigS = req.query.sigS as BytesLike
  let newOwner = req.query.newOwner as string
  let ret = await changeOwnerSigned(identity, sigV, sigR, sigS, newOwner)
  res.send(ret)
  })

didRegistryRouter.get('/changeOwnerSigned', async (req, res) => {
  let identity  = req.query.identity as string
  let sigV = req.query.sigV as BigNumberish
  let sigR = req.query.sigR as BytesLike
  let sigS = req.query.sigS as BytesLike
  let newOwner = req.query.newOwner as string
  let ret = await changeOwnerSigned(identity, sigV, sigR, sigS, newOwner)
  res.send(ret)
  })

export default didRegistryRouter;