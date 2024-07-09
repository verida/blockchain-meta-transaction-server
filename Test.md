# Verida meta-transaction-server test

Here explains the stuffs to do before testing each test files.
There are some stuffs to be done before running the tests.

## DIDLinkage test (test/didLinkage.test.ts)
The contract owner should do the followings:
- Add trusted signer : `signInfo.signerProof`
- Add identifier types : 
```ts
    { name: "facebook", isSelfSigner: false },
    { name: "twitter", isSelfSigner: false },
    { name: "blockchain:eip155", isSelfSigner: true },
```

## SBT test (test/sbt.test.ts)
The contract owner should do the following:
- Add trusted signer : `signInfo.signerProof`