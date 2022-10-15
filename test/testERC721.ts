import { expect } from 'chai'
import { ethers } from 'hardhat'

import { TestERC721__factory } from '../typechain-types'

import type { TestERC721 } from '../typechain-types'
import type { ContractReceipt } from 'ethers'

let testERC721: TestERC721
describe('TestERC721', function () {
  beforeEach(async () => {
    const [deployer] = await ethers.getSigners()
    testERC721 = new TestERC721__factory(deployer).attach(
      '0x5e488544cAD0E36C5a6A8964ad6A1117fF26bE2B',
    )
  })

  it('get tokenURI', async function () {
    const tokenId = '1'
    const tokenURI = await testERC721.tokenURI(tokenId)
    console.log(`tokenId: ${tokenId}, tokenURI: ${tokenURI}`)
  })

  it('mint', async function () {
    const receiver = await (await ethers.getSigners())[0].getAddress()
    const tx = await testERC721.batchMint(
      receiver,
      'ipfs://QmeSjSinHpPnmXmspMjwiXyN6zS4E9zccariGR3jxcaWtq/10',
      10,
    )
    console.log('tx id: ', tx)
    const receipt: ContractReceipt = await tx.wait()
    expect(receipt)
    if (receipt.events) {
      for (const event of receipt.events) {
        console.log(`Event ${event.event} with args ${event.args}`)
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 10000))
  })
})
