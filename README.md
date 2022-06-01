# Verida meta-transaction-server
**Verida meta-transaction-server** provide Http GET & POST endpoints for interactions to smart contracts of Verida.
Every contract developers in **Verida** can create supports for his contract.
## Add support for individual contract
### 1. Deploy smart contract to targeting net<br/>
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
### 2. Set up configuration
#### .env - Setup RPC URls
Need to register RPC ursl of chains.
```
...
RPC_URL_POLYGON_MAINNET="https://polygon-rpc.com"
RPC_URL_POLYGON_TESTNET="https://rpc-mumbai.maticvigil.com"
RPC_URL_BSC_TESTNET="https://speedy-nodes-nyc.moralis.io/bd1c39d7c8ee1229b16b4a97/bsc/testnet"
```
Need to update rpc urls for targeting block chain. (Line15 : src/genericcontroller.ts)
#### .env.json - Register company wallet account to project
Create `.env.json` file inside project directory(meaning "blockchain-meta-transaction-server/").
Add private key of company wallet account to this file:
```
{
    "privateKey" : "355...de"
}
```

# VDA-DID-Registry contract
All end-points for VDA-DID-Registry contracts has prefix of "/VeridaDIDRegistry" in its path: 
```
https://hosting-server-url/VeridaDIDRegistry/...
```
_Ex_: https://localhost:5021/VeridaDIDRegistry/identityOwner?identity=0x268c970A5FBFdaFfdf671Fa9d88eA86Ee33e14B1<br/><br/>

There are 9 endpoints for **VDA-DID-Registry** contract:
- identityOwner
- validDelegate
- changeOwner
- addDelegate
- revokeDelegate
- setAttribute
- revokeAttribute
- bulkAdd
- bulkRevoke

## Endpoint Returns
All endpoints returns JSON object. JSON object are a bit different between success & failed.
### Return of Success
```
{success: true, data: <necessary data or transaction hash>}
```
### Return of Fail
```
{success: fail, error: <error message>}
```
## Endpoint Parameters
### 1. identityOwner
Returns owner of DID
#### Parameters
- identity
### 2. validDelegate
Check whether delegate is valid or not.
#### Parameters
- identity
- delegateType
- delegate
### 3. changeOwner
Change owner of DID.
#### Parameters
- identity
- newOwner
- signature
### 4. addDelegate
Add delegate.
#### Parameters
- identity
- delegateType
- delegate
- validity
- signature
### 5. revokeDelegate
Revoke delegate.
#### Parameters
- identity
- delegateType
- delegate
- signature
### 6. setAttribute
Set attribute.
#### Parameters
- identity
- name
- value
- validity
- signature
### 7. revokeAttribute
Revoke attribute.
#### Parameters
- identity
- name
- value
- signature
### 8. bulkAdd
Add multiple delegates & attributes.
#### Parameters
- identity
- delegateParams
- attributeParams
- signature
### 9. bulkRevoke
Revoke multiple delegates & attributes.
#### Parameters
- identity
- revokeDelegateParams
- revokeAttributeParams
- signature
### Parameter Types & Usage example
#### Parameter Types
Here explain parameter types in above.
- identity, delegate, newOwner : 40bytes string.<br/>
_Ex_ : "0x1234567890123456789012345678901234567890"
- delegateType, name : 32Bytes string.<br/>
_Ex_ : "0x12345678901234567890123456789012"
- value : Bytes array string<br/>
_Ex_ : "0x1234..."
- validity : String of UInt256<br/>
_Ex_ : "86400"
- delegateParams : String of following JSON object:<br/>
{delegateType, delegate, validity}[]
- revokeDelegateParams : String of following JSON object:<br/>
{delegateType, delegate}[]
- attributeParams : String of following JSON object:<br/>
{name, value, validity}[]
- revokeAttributeParams : String of following JSON object:<br/>
{name, value}[]<br/>
#### Usage Example
- GET
`https://server-url/vda-did-registry/identityOwner?...`
- POST
Here shows sample code to send POST request using Axios library
```
import Axios from 'axios'
const getAxios = async () => {
    const config: any = {
        headers: {
            "context-name": SENDER_CONTEXT,
        },
    }
    ...
    return Axios.create(config)
}
const server = await getAxios()

const getIdentity = async () => {
  const response: any = await server.post(
    "https://localhost:5021//vda-did-registry/identityOwner,
    {
      identity:"0x268c970A5FBFdaFfdf671Fa9d88eA86Ee33e14B1"
    }
  )
  ...
}
```
