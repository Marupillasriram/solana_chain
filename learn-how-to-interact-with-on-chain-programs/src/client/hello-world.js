//import { PublicKey } from "@metaplex-foundation/js";
import { Connection, PublicKey, Keypair, Transaction, TransactionInstruction, sendAndConfirmTransaction, SystemProgram } from "@solana/web3.js";
import { readFile } from "fs/promises"
import * as borsh from 'borsh';


class HelloWorldAccount {
    constructor(fields) {
        if (fields) {
            this.counter = fields.counter;
        }else {
            this.counter = 0;
        }
    }
} 

const HelloWorldSchema = new Map([
    [HelloWorldAccount, { kind: 'struct', fields: [['counter', 'u32']] }]
]);

const ACCOUNT_SIZE = borsh.serialize(HelloWorldSchema, new HelloWorldAccount()).length;

export function establishConnection() {
    const connection = new Connection('http://localhost:8899');
    return connection;
}

export async function establishPayer(connection) {
    let secretKeyString = await readFile("../../../workspace/.config/solana/id.json", 'utf-8');
    let secretKey = Uint8Array.from(JSON.parse(secretKeyString));
    return Keypair.fromSecretKey(secretKey);
}

export async function getProgramId() {
    let secretKeyString = await readFile("dist/program/helloworld-keypair.json", 'utf8');
    let secretKey = Uint8Array.from(JSON.parse(secretKeyString));
    let keypair = Keypair.fromSecretKey(secretKey);
    return keypair.publicKey;
}

export async function getAccountPubkey(payer, programId) {
    return await PublicKey.createWithSeed(payer.publicKey, "ntg", programId);
}

export async function checkProgram(connection, payer, programId, accountPubkey) {
    const accountInfo =  await connection.getAccountInfo(programId);
    
    if (accountInfo === null) {

        throw new Error('Program account not found');
    }
    const dataAccountInfo = await connection.getAccountInfo(accountPubkey);

    if (dataAccountInfo === null) {
        await createAccount(connection, payer, programId, accountPubkey);
    }
    if (!accountInfo.executable) {
        throw new Error('Program account is not executable');
    }

    return accountInfo;
}

export async function createAccount(connection, payer, programId, accountPubkey) {
    let lamports = await connection.getMinimumBalanceForRentExemption(ACCOUNT_SIZE);

    const instruction = {
        basePubkey: payer.publicKey,
        fromPubkey: payer.publicKey,
        lamports,
        newAccountPubkey: accountPubkey,
        programId,
        seed : "ntg",
        space : ACCOUNT_SIZE,
    };
    const tx = SystemProgram.createAccountWithSeed(instruction);

    const transaction = new Transaction();
    transaction.add(tx);
    await sendAndConfirmTransaction(connection, transaction, [payer]);
}

export async function sayHello(connection, payer, programId, accountPubkey) {
    const transaction = {
        keys: [{ pubkey: accountPubkey, isSigner: false, isWritable: true}],
        programId,
        data: Buffer.alloc(0),
    }
    const instruction = new TransactionInstruction(transaction);
    await sendAndConfirmTransaction(connection, new Transaction().add(instruction), [payer]);
}

export async function getHelloCount(connection, accountPubkey) {
    const accountInfo = await connection.getAccountInfo(accountPubkey);
    const greeting = borsh.deserialize(HelloWorldSchema, HelloWorldAccount, accountInfo.data);
    return greeting.counter;


}