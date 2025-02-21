import dotenv from "dotenv";
import { hexToUint8Array } from "../utils";

dotenv.config();

describe("Utils", () => {
  describe("Base58", () => {
    it("Get discriminator", async () => {
      const hex =
        "851d59df45eeb00aba748773874a0000000000000000000000204aa9d1010000fc1870780100000000";
      const data = hexToUint8Array(hex);

      console.log(data.slice(0, 8));
    });
  });
});
