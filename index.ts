require("dotenv").config();
import { BigNumber, ethers } from "ethers";
import { sendSlackMessage } from "./slack";

const address = process.env.ADDRESS ?? "";
const highest = process.env.HIGHEST_POWER ?? "";
const starting = process.env.STARTING_POINT ?? "";

const HIGHEST_NUMBER = BigNumber.from(highest);

const getHashFromNonce = (nonce: BigNumber) => {
  const packedValues = ethers.utils.solidityPack(
    ["uint256", "uint256", "address"],
    [HIGHEST_NUMBER, nonce, address]
  );
  const hash = ethers.utils.keccak256(packedValues);
  return BigNumber.from(hash);
};

async function run() {
  await sendSlackMessage(`Started Mining for address: ${address}`);

  let nonce = BigNumber.from(starting);

  let iteration = 0;
  let found = false;
  let highest = null;
  let highestNonce = null;

  while (!found) {
    const nonceHash = getHashFromNonce(nonce);
    const isBigger = nonceHash.gt(HIGHEST_NUMBER);

    if ((highest && nonceHash.gte(highest)) || !highest) {
      highest = nonceHash;
      highestNonce = nonce;
    }

    if (isBigger) {
      found = true;

      await sendSlackMessage(
        `Found the largest value!!  nonce: ${nonce.toHexString()}, value: ${nonceHash.toHexString()}`
      );
    }

    iteration += 1;
    if (iteration === 100000000) {
      iteration = 0;
      console.log(
        `Next Million: current value: ${nonce.toHexString()}, highest: ${highest?.toHexString()}`
      );
      await sendSlackMessage(
        `Next Million: current value: ${nonce.toHexString()}, highest: ${highest?.toHexString()}`
      );
    }

    nonce = nonce.add(1);
  }

  return;
}

run().then(() => process.exit(1));
