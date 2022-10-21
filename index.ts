require("dotenv").config();
import { BigNumber, ethers } from "ethers";
import { sendSlackMessage } from "./slack";

const address = process.env.ADDRESS ?? "";

const HIGHEST_NUMBER = BigNumber.from(
  "115792089237315814261404855957085707744247292360214651484117184484849245078057"
);

const getHashFromNonce = (nonce: BigNumber) => {
  console.log({ address });
  const packedValues = ethers.utils.solidityPack(
    ["uint256", "uint256", "address"],
    [HIGHEST_NUMBER, nonce, address]
  );
  const hash = ethers.utils.keccak256(packedValues);
  return BigNumber.from(hash);
};

const getNextHighestHash = (nonce: BigNumber) => {
  const hashes: BigNumber[] = [];

  for (let index = 0; index < 10; index++) {
    const hash = getHashFromNonce(nonce.add(index));
    hashes.push(hash);
  }

  return hashes.reduce((acc, cur) => {
    return acc.gte(cur) ? acc : cur;
  });
};

async function run() {
  await sendSlackMessage(`Started Mining for address: ${address}`);

  let nonce = BigNumber.from("600274300000");

  let iteration = 0;
  let found = false;

  while (!found) {
    const nonceHash = getNextHighestHash(nonce);
    const isBigger = nonceHash.gt(HIGHEST_NUMBER);

    if (isBigger) {
      found = true;
    }

    iteration += 1;
    if (iteration === 100000) {
      iteration = 0;
      await sendSlackMessage(
        `Next Million: current value: ${nonce.toHexString()}, `
      );
    }

    nonce = nonce.add(10);
  }

  await sendSlackMessage(`Found the largest value: ${nonce.toHexString()}`);
  return;
}

run().then(() => process.exit(1));
