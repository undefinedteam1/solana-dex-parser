import dotenv from 'dotenv';
import { hexToUint8Array } from '../utils';
import base58 from 'bs58';

dotenv.config();

describe('Utils', () => {
  describe('Base58', () => {
    it('Get discriminator', async () => {
      const hex =
        //'c1209b3341d69c810e030000003d016400011a64010234640203402c420600000000e953780100000000500000'; // instruction discriminator 
        'e445a52e51cb9a1d9c0f77c61db5dd37c7bb911696d5b17bd0e5f2557997e04873f34949d8edbb5d26fb19fd70f415b62460ec08d00f1995880b50480a3b153281e5e5e1cd41ddd985d6e3ecbb77d520ba8c9c93db250fb3261055c161bb55d8b443e48743a90f8be222747d0f55ceda8abe2d26578868abf1bb1266c0bfb91bdd8e11b637dd1a16ada096d9a0931d8e'; // event discriminator

      const data = hexToUint8Array(hex);

      // console.log(data.slice(0, 8)); // instruction discriminator
      console.log(data.slice(0, 16)); // event discriminator
    });
  });
});