import dotenv from 'dotenv';
import { hexToUint8Array } from '../utils';
import base58 from 'bs58';

dotenv.config();

describe('Utils', () => {
  describe('Base58', () => {
    it('Get discriminator', async () => {
      const hex =
        // "01fecbdbb8670000000000ca9a3b0000000000203d88792d0000";
        // '66063d1201daebeabf0e0775430300008000596200000000'; // buy 
        // [
        //   102, 6, 61, 18, 1, 218, 235, 234
        // ]
        // '33e685a4017f83adc0565a5a050000003808970000000000'; // sell
        // '33e685a4017f83ade208eaa60a010000bbd44b0100000000'; // sell
        // [
        //   51, 230, 133, 164, 1, 127, 131, 173,
        //   192, 86, 90, 90, 5, 0, 0, 0
        // ]
      //   'e992d18ecf6840bc0000010801a92cbc000007f7d1c913000000';// create pool
      //'e992d18ecf6840bc0000010801a92cbc00003af6d1c913000000';// create pool
      // [
      //   233, 146, 209, 142, 207, 104, 64, 188,0, 0, 1, 8, 1, 169, 44, 188
      // ]

      //'b712469c946da1227bd5a3a61c5900008ba89cbc097ee96dff70cf4600000000';//
      'e445a52e51cb9a1db1310cd2a076a774844fe2670000000000006a53866d4fd3550dcbe064ff9a9c2bfece8c59b5fff442a98e70fb13ab1b3ec92deb532af92861cc1ddd39de51d81182faea3d4a9bf3cb675a8033fbb37fd7ef069b8857feab8184fb687f634618c035dac439dc1aeb3b5598a0f000000000010609000801a92cbc000010f6d1c913000000000801a92cbc000010f6d1c9130000006400000000000000ec426b59d003000088426b59d0030000fd70f6a674b098d3988873172a5a4820db23b2009344fde1a0a2d60b02be64d970884b95114930cd0432a146f54d1f687bc818eba6a425446631f3243c6e2aae89a6b474742f7675a5406f7b8597e91ad039a56fcbb27ac1a0e7e24120514016feb043edee9d7ff2927f59df30c97d882d778d3347e31501420f8d4e61f97930ca';
      // console.log(base58.decode('8nmTBSEU4R482wHEyxYUupdiHoW4c1a4PL53y2Wsdxg2Ux4D7mHwhUQsngDh3W3oz5JdWbUKJoVXWeQd8Ra7B9ehrDmzkdWCd8RKCHUjT8nsWwEEfYgVsyRMBDAFXzoTJqoZE6ShRZRj9Sq6S58B3ooxachSBedFVKoe4dNYS75ZDGKg5pvaz82539L91xU2dcDtHoT88czjBnDk2BJ12ki9r3iMqgRw4DqE4J291jpQ8NeE799EriDg4LiuezZVCJaAao3gDDVdt6MgK8tTvEnfff2shZfD391Yw5pz8rYCZEcFrT4ixmiakaKJKgYmVW5MsL9TgmpTSFAEspYSRDuyTT5q7GYGPFhzm3kUD'))
      const data = hexToUint8Array(hex);
      console.log(Buffer.from(hex).slice(16));
      console.log(data.slice(0, 16));
    });
  });
});