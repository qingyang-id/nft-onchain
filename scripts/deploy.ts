// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from 'hardhat'

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // Fetch the compiled contract using ethers.js
  const TestERC721 = await ethers.getContractFactory('TestERC721')
  // calling deploy() will return an async Promise that we can await on
  const testERC721 = await TestERC721.deploy()
  console.log(`TestERC721 contract deployed to address: ${testERC721.address}`)
  // Fetch the compiled contract using ethers.js
  const ConduitController = await ethers.getContractFactory('ConduitController')
  // calling deploy() will return an async Promise that we can await on
  const conduitController = await ConduitController.deploy()
  console.log(
    `ConduitController contract deployed to address: ${conduitController.address}`,
  )
  // Fetch the compiled contract using ethers.js
  const TransferHelper = await ethers.getContractFactory('TransferHelper')
  // calling deploy() will return an async Promise that we can await on
  const transferHelper = await TransferHelper.deploy(conduitController.address)
  console.log(
    `TransferHelper contract deployed to address: ${transferHelper.address}`,
  )
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
