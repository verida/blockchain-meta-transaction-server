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

type SignedDelegateParam = {
  identity: string;
  sigV: BigNumberish;
  sigR: BytesLike;
  sigS: BytesLike;
  delegateType: BytesLike;
  delegate: string;
  validity?: BigNumberish;
}

type SignedAttributeParam = {
  identity: string;
  sigV: BigNumberish;
  sigR: BytesLike;
  sigS: BytesLike;
  delegateType: BytesLike;
  delegate: string;
  validity?: BigNumberish;
}

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

async function addDelegateSigned(
  identity: string,
  sigV: BigNumberish,
  sigR: BytesLike,
  sigS: BytesLike,
  delegateType: BytesLike,
  delegate: string,
  validity: BigNumberish,
) {
  try {
    const tx = controller.methods.addDelegateSigned(
      identity,
      sigV,
      sigR,
      sigS,
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

async function revokeDelegate(
  identity: string,
  delegateType: BytesLike,
  delegate: string,
) {
  try {
    const tx = controller.methods.revokeDelegate(
      identity,
      delegateType,
      delegate,
    )
    return await runSendTransction(tx)
  } catch (e) {
    console.log('Error occured : ', e)
    return { success: false, error: e }
  }
}

async function revokeDelegateSigned(
  identity: string,
  sigV: BigNumberish,
  sigR: BytesLike,
  sigS: BytesLike,
  delegateType: BytesLike,
  delegate: string,
) {
  try {
    const tx = controller.methods.revokeDelegateSigned(
      identity,
      sigV,
      sigR,
      sigS,
      delegateType,
      delegate,
    )
    return await runSendTransction(tx)
  } catch (e) {
    console.log('Error occured : ', e)
    return { success: false, error: e }
  }
}

async function setAttribute(
  identity: string,
  name: BytesLike,
  value: BytesLike,
  validity: BigNumberish
) {
  try {
    const tx = controller.methods.setAttribute(
      identity,
      name,
      value,
      validity
    )
    return await runSendTransction(tx)
  } catch (e) {
    console.log('Error occured : ', e)
    return { success: false, error: e }
  }
}

async function setAttributeSigned(
  identity: string,
  sigV: BigNumberish,
  sigR: BytesLike,
  sigS: BytesLike,
  name: BytesLike,
  value: BytesLike,
  validity: BigNumberish
) {
  try {
    const tx = controller.methods.setAttributeSigned(
      identity,
      sigV,
      sigR,
      sigS,
      name,
      value,
      validity
    )
    return await runSendTransction(tx)
  } catch (e) {
    console.log('Error occured : ', e)
    return { success: false, error: e }
  }
}

async function revokeAttribute(
  identity: string,
  name: BytesLike,
  value: BytesLike,
) {
  try {
    const tx = controller.methods.revokeAttribute(
      identity,
      name,
      value,
    )
    return await runSendTransction(tx)
  } catch (e) {
    console.log('Error occured : ', e)
    return { success: false, error: e }
  }
}

async function revokeAttributeSigned(
  identity: string,
  sigV: BigNumberish,
  sigR: BytesLike,
  sigS: BytesLike,
  name: BytesLike,
  value: BytesLike,
) {
  try {
    const tx = controller.methods.revokeAttributeSigned(
      identity,
      sigV,
      sigR,
      sigS,
      name,
      value,
    )
    return await runSendTransction(tx)
  } catch (e) {
    console.log('Error occured : ', e)
    return { success: false, error: e }
  }
}

async function bulkAdd(
  identity: string,
  delegateParams: DelegateParam[],
  attributeParams: AttributeParam[],
  signedDelegateParams: SignedDelegateParam[],
  signedAttributeParams: SignedAttributeParam[],
) {
  try {
    const tx = controller.methods.bulkAdd(
      identity,
      delegateParams,
      attributeParams,
      signedDelegateParams,
      signedAttributeParams,
    )
    return await runSendTransction(tx)
  } catch (e) {
    console.log('Error occured : ', e)
    return { success: false, error: e }
  }
}

async function bulkRevoke(
  identity: string,
  delegateParams: DelegateParam[],
  attributeParams: AttributeParam[],
  signedDelegateParams: SignedDelegateParam[],
  signedAttributeParams: SignedAttributeParam[],
) {
  try {
    const tx = controller.methods.bulkRevoke(
      identity,
      delegateParams,
      attributeParams,
      signedDelegateParams,
      signedAttributeParams,
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
  try {
    //  console.log("Query = ", req.query)
    let identity  = req.query.identity as string;
    //  let owner = await identityOwner('0x713A5Db664297195061b9558f40e88434cb79C77')
    let owner = await identityOwner(identity)
    res.send({success:true, owner:owner})  
  } catch (e) {
    res.send({success: false, error: 'Invalid argument'})
  }
  
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

didRegistryRouter.get('/addDelegate', async (req, res) => {
  let identity  = req.query.identity as string
  let delegateType = req.query.delegateType as BytesLike
  let delegate = req.query.delegate as string
  let validity = req.query.validity as BigNumberish
  let ret = await addDelegate(identity, delegateType, delegate, validity)
  res.send(ret)
  })

didRegistryRouter.get('/addDelegateSigned', async (req, res) => {
  let identity  = req.query.identity as string
  let sigV = req.query.sigV as BigNumberish
  let sigR = req.query.sigR as BytesLike
  let sigS = req.query.sigS as BytesLike
  let delegateType = req.query.delegateType as BytesLike
  let delegate = req.query.delegate as string
  let validity = req.query.validity as BigNumberish
  let ret = await addDelegateSigned(identity, sigV, sigR, sigS, delegateType, delegate, validity)
  res.send(ret)
  })

didRegistryRouter.get('/revokeDelegate', async (req, res) => {
  let identity  = req.query.identity as string
  let delegateType = req.query.delegateType as BytesLike
  let delegate = req.query.delegate as string
  let ret = await revokeDelegate(identity, delegateType, delegate)
  res.send(ret)
  })

didRegistryRouter.get('/revokeDelegateSigned', async (req, res) => {
  let identity  = req.query.identity as string
  let sigV = req.query.sigV as BigNumberish
  let sigR = req.query.sigR as BytesLike
  let sigS = req.query.sigS as BytesLike
  let delegateType = req.query.delegateType as BytesLike
  let delegate = req.query.delegate as string
  let ret = await revokeDelegateSigned(identity, sigV, sigR, sigS, delegateType, delegate)
  res.send(ret)
  })

didRegistryRouter.get('/setAttribute', async (req, res) => {
  let identity  = req.query.identity as string
  let name = req.query.delegateType as BytesLike
  let value = req.query.delegate as BytesLike
  let validity = req.query.delegate as BigNumberish
  let ret = await setAttribute(identity, name, value, validity)
  res.send(ret)
  })

didRegistryRouter.get('/setAttributeSigned', async (req, res) => {
  let identity  = req.query.identity as string
  let sigV = req.query.sigV as BigNumberish
  let sigR = req.query.sigR as BytesLike
  let sigS = req.query.sigS as BytesLike
  let name = req.query.delegateType as BytesLike
  let value = req.query.delegate as BytesLike
  let validity = req.query.delegate as BigNumberish
  let ret = await setAttributeSigned(identity, sigV, sigR, sigS, name, value, validity)
  res.send(ret)
  })

didRegistryRouter.get('/revokeAttribute', async (req, res) => {
  let identity  = req.query.identity as string
  let name = req.query.delegateType as BytesLike
  let value = req.query.delegate as BytesLike
  let ret = await revokeAttribute(identity, name, value)
  res.send(ret)
  })

didRegistryRouter.get('/revokeAttributeSigned', async (req, res) => {
  let identity  = req.query.identity as string
  let sigV = req.query.sigV as BigNumberish
  let sigR = req.query.sigR as BytesLike
  let sigS = req.query.sigS as BytesLike
  let name = req.query.delegateType as BytesLike
  let value = req.query.delegate as BytesLike
  let validity = req.query.delegate as BigNumberish
  let ret = await revokeAttributeSigned(identity, sigV, sigR, sigS, name, value)
  res.send(ret)
  })

didRegistryRouter.get('/bulkAdd', async (req, res) => {
  let identity  = req.query.identity as string
  let delegateParams = req.query.delegateParams as DelegateParam[]
  let attributeParams = req.query.attributeParams as AttributeParam[]
  let signedDelegateParams = req.query.signedDelegateParams as SignedDelegateParam[]
  let signedAttributeParams = req.query.signedAttributeParams as SignedAttributeParam[]
  let ret = await bulkAdd(identity, delegateParams, attributeParams, signedDelegateParams, signedAttributeParams)
  res.send(ret)
  })

didRegistryRouter.get('/bulkRevoke', async (req, res) => {
  let identity  = req.query.identity as string
  let delegateParams = req.query.delegateParams as DelegateParam[]
  let attributeParams = req.query.attributeParams as AttributeParam[]
  let signedDelegateParams = req.query.signedDelegateParams as SignedDelegateParam[]
  let signedAttributeParams = req.query.signedAttributeParams as SignedAttributeParam[]
  let ret = await bulkRevoke(identity, delegateParams, attributeParams, signedDelegateParams, signedAttributeParams)
  res.send(ret)
  })

export default didRegistryRouter;