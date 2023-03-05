# Verida meta-transaction-server

**Verida meta-transaction-server** provide Http GET & POST endpoints for interactions to smart contracts of Verida.
Every contract developers in **Verida** can create supports for his contract.

## Add support for individual contract

### 1. Deploy smart contract to targeting net

Verida smart contracts should be deployed to support meta transactions.
Once deployed, you will get contract address & contract abi file.

### 2. Configure settings to support meta-transactions in `meta-transaction-server` project.

Create a folder named by contract name inside "contracts" directory.

- Copy contract abi file (from step 1) to newly created directory. ABI file must be named as `abi.json`.
- Create `config.ts` file inside directory and set up necessary functions.<br/><br/>

*Ex*: You can see `abi.json` and `config.ts` files inside "contracts/VeridaDIDRegistry/".

### 3. Create test code

- Create a test code inside "src" directory

_EX_: Please refer "tests/vda-did-registry.test.ts".

## Test

### 1. Install dependencies

After clone this repo, please run following command inside project directory:

```
yarn install
```

### 2. Run server
You can start server by following command:

```
yarn start
```

Server will be hosted at https://localhost:5021/

### 3. Run test

- Test for all contracts: You can test all test codes by following command:

```
yarn tests
```

- Test for individual contract

```
yarn test <testcode file name>
```

_Ex_: `yarn test tests/vda-did-registry.test.ts`

## Hosting server as production

### 1. Get ready company wallet account

To host meta-transaction-server, we need company wallet account that will pay gas fees on meta transactions.

### 2. Set up configuration - .env file

#### Private key
This is an private key of wallet. This account is in charge of paying fees for transactions.
We should replace this with private key of company wallet account.
```
PRIVATE_KEY = "35...7de"
```

#### Select chains
```
RPC_TARGET_NET = "RPC_URL_POLYGON_TESTNET"
RPC_URL_POLYGON_MAINNET="https://polygon-rpc.com"
RPC_URL_POLYGON_TESTNET="https://rpc-mumbai.maticvigil.com"
```
`RPC_TARGET_NET` is the chain that this server send transactions. The value should be one of following:
```
RPC_URL_POLYGON_MAINNET
RPC_URL_POLYGON_TESTNET
```

## Lambda configuration

1. Ensure timeout is set to `20` seconds for API gateway and the lambda. Otherwise you may see `Service Unavailable` or weird `Invalid signature` errors when things timeout.

# Returns of Meta-transaction-Server

All endpoints returns JSON object. JSON object are a bit different between success & failed.

## Return of Success

```
{success: true, data: <necessary data or transaction hash>}
```

## Return of Fail

```
{success: fail, error: <error message>}
```

# Supporting contracts
## DID-Registry contract

All end-points for **VDA-DID-Registry** contracts has prefix of "/VeridaDIDRegistry" in its path: 
```
https://hosting-server-url/VeridaDIDRegistry/...
```

## NameRegistry contract
All end-points for **NameRegistry** contracts has prefix of "/NameRegistry" in its path: 
```
https://hosting-server-url/NameRegistry/...
```

## DID-Linkage contract
All end-points for **VDA-DID-Linkage** contracts has prefix of "/VeridaDIDLinkage" in its path: 
```
https://hosting-server-url/VeridaDIDLinkage/...
```

## SBT contract
All end-points for **SBT** contracts has prefix of "/VeridaDIDLinkage" in its path: 
```
https://hosting-server-url/SoulboundNFT/...
```

### Caution
Some functions of SBT contract can't be called via **meta-transaction-server**. <br>For example, `getClaimedSBTList()` & `burnSBT()` functions should be called by only the owner of the SBTs. If you called these functions via **meta-transaction-server**, it'd be always failed.

