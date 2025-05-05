import { DexParser } from "../dex-parser";
import { tx, tx2 } from "./tx-grpc.test.case";

const rs = new DexParser().parseAll(tx.transaction.transaction as any);

console.log(rs, JSON.stringify(rs, null, 2));