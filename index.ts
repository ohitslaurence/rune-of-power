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

const getNextHighestHash = (nonce: BigNumber) => {
  const hashes: BigNumber[] = [];

  for (let index = 0; index < 1000; index++) {
    const hash = getHashFromNonce(nonce.add(index));
    hashes.push(hash);
  }

  const largest = hashes.reduce((acc, cur) => {
    return acc.gte(cur) ? acc : cur;
  });
  const index = hashes.indexOf(largest);

  return { nonceHash: largest, index };
};

async function run() {
  await sendSlackMessage(`Started Mining for address: ${address}`);

  let nonce = BigNumber.from(starting);

  let iteration = 0;
  let found = false;
  let highest = null;

  while (!found) {
    const { nonceHash, index } = getNextHighestHash(nonce);
    const isBigger = nonceHash.gt(HIGHEST_NUMBER);

    if ((highest && nonceHash.gte(highest)) || !highest) {
      highest = nonceHash;
    }

    if (isBigger) {
      found = true;
      const finalNonce = nonce.add(index);
      await sendSlackMessage(
        `Found the largest value!! current nonce: ${nonce}, index: ${index}, final nonce: ${finalNonce.toHexString()}, value: ${nonceHash.toHexString()}`
      );
    }

    iteration += 1;
    if (iteration === 100) {
      iteration = 0;
      await sendSlackMessage(
        `Next Million: current value: ${nonce.toHexString()}, highest: ${highest?.toHexString()}`
      );
    }

    nonce = nonce.add(1000);
  }

  return;
}

run().then(() => process.exit(1));
