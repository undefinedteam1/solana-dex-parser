import dotenv from "dotenv";
import { hexToUint8Array } from "../utils";

dotenv.config();

describe("Utils", () => {
  describe("Base58", () => {
    it("Get discriminator", async () => {
      const hex =
        // "01fecbdbb8670000000000ca9a3b0000000000203d88792d0000";
        "03d0c00a0900000000cb6b4774000000000100000000000000a1d6990800000000";
      const data = hexToUint8Array(hex);

      console.log(data.slice(0, 8));
    });
  });
});
