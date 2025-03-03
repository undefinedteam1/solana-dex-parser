import dotenv from 'dotenv';
import { hexToUint8Array } from '../utils';
import base58 from 'bs58';

dotenv.config();

describe('Utils', () => {
  describe('Base58', () => {
    it('Get discriminator', async () => {
      const hex =
        // "01fecbdbb8670000000000ca9a3b0000000000203d88792d0000";
        '66063d1201daebea4d8a436be80600003c4613c400000000';
     
      const data = hexToUint8Array(hex);
      console.log(data.slice(0, 8));
    });
  });
});