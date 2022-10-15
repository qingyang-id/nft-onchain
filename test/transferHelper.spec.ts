import { expect } from 'chai'
import { randomBytes as nodeRandomBytes } from 'crypto'
import { BigNumber } from 'ethers'
import { ethers } from 'hardhat'

import {
  ConduitController__factory,
  Conduit__factory,
  TestERC721__factory,
  TransferHelper__factory,
} from '../typechain-types'

import type {
  ConduitController,
  ConduitInterface,
  TestERC721,
  TransferHelper,
} from '../typechain-types'
import type { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import type { BigNumberish, ContractReceipt } from 'ethers'

interface Transfer {
  itemType: 0 | 1 | 2 | 3 | 4 | 5
  token: string
  from: string
  to: string
  identifier: BigNumber
  amount: BigNumber
}

interface TransferHelperItem {
  itemType: 0 | 1 | 2 | 3 | 4 | 5
  token: string
  identifier: BigNumber
  amount: BigNumber
}

interface TransferWithRecipient {
  items: TransferHelperItem[]
  recipient: string
  validateERC721Receiver: boolean
}

function createTransferHelperItem(transfer: Transfer): TransferHelperItem {
  return {
    itemType: transfer.itemType,
    token: transfer.token,
    identifier: transfer.identifier,
    amount: transfer.amount,
  }
}

function createTransferWithRecipient(
  transfers: Transfer[],
  recipient: string,
  validate: boolean,
): TransferWithRecipient {
  const tempTransferHelperItems = []
  for (let i = 0; i < transfers.length; i++) {
    tempTransferHelperItems[i] = createTransferHelperItem(transfers[i])
  }
  return {
    items: tempTransferHelperItems,
    recipient,
    validateERC721Receiver: validate,
  }
}

const randomBytes: (n: number) => string = (n: number) =>
  nodeRandomBytes(n).toString('hex')

const randomHex = (bytes = 32) => `0x${randomBytes(bytes)}`

const hexRegex = /[A-Fa-fx]/g

const toHex = (n: BigNumberish, numBytes = 0) => {
  const asHexString = BigNumber.isBigNumber(n)
    ? n.toHexString().slice(2)
    : typeof n === 'string'
    ? hexRegex.test(n)
      ? n.replace(/0x/, '')
      : Number(n).toString(16)
    : Number(n).toString(16)
  return `0x${asHexString.padStart(numBytes * 2, '0')}`
}

const toBN = (n: BigNumberish) => BigNumber.from(toHex(n))

describe('TransferHelper', function () {
  let conduitController: ConduitController
  let testERC721: TestERC721
  let conduitControllerAddress: any
  let testERC721Address: any

  let tempConduit: ConduitInterface
  let tempConduitKey: string
  let tempConduitAddress: any
  let tempTransferHelper: TransferHelper

  let signer1: SignerWithAddress
  let signer2: SignerWithAddress
  let signer3: SignerWithAddress
  let sender1: string
  let sender2: string

  before(async () => {
    const signers = await ethers.getSigners()
    const deployer = signers[0]
    signer1 = await signers[1]
    signer2 = await signers[2]
    signer3 = await signers[3]
    sender1 = await signer1.getAddress()
    sender2 = await signer2.getAddress()
    conduitController = await new ConduitController__factory(deployer).deploy()
    // await conduitController.deployTransaction.wait(1)
    conduitControllerAddress = conduitController.address
    tempTransferHelper = await new TransferHelper__factory(deployer).deploy(
      conduitControllerAddress,
    )
    testERC721 = await new TestERC721__factory(deployer).deploy()
    testERC721Address = testERC721.address

    const deployerAddress = await deployer.getAddress()
    tempConduitKey = deployerAddress + randomHex(12).slice(2)
    ;({ conduit: tempConduitAddress } = await conduitController.getConduit(
      tempConduitKey,
    ))
    await conduitController.createConduit(tempConduitKey, deployerAddress)

    tempConduit = await new Conduit__factory(deployer).attach(
      tempConduitAddress,
    )
    await conduitController.updateChannel(
      tempConduit.address,
      tempTransferHelper.address,
      true,
    )
  })

  it('batch transfer ERC721 with a conduit key', async function () {
    const size = 2
    const tx = await testERC721.batchMint(
      sender1,
      'ipfs://QmeSjSinHpPnmXmspMjwiXyN6zS4E9zccariGR3jxcaWtq/1',
      size,
    )
    // await testERC721.connect(signer1).transferFrom(sender1, sender2, 1);
    // await testERC721.connect(signer1).transferFrom(sender1, sender2, 2);
    console.log('tx id: ', tx)
    const receipt: ContractReceipt = await tx.wait()
    expect(receipt)
    if (receipt.events) {
      for (const event of receipt.events) {
        console.log(`Event ${event.event} with args ${event.args}`)
      }
    }

    // Create/Approve numEC721s amount of  ERC721s
    await testERC721.connect(signer1).setApprovalForAll(
      tempConduitAddress, // conduit address
      true,
    )
    expect(
      await testERC721.isApprovedForAll(sender1, tempConduitAddress),
    ).to.equal(true)
    const transfersWithRecipients = []
    const transfers: Transfer[] = []
    for (let i = 1; i <= size; i++) {
      transfers.push({
        itemType: 2,
        token: testERC721Address,
        from: sender1,
        to: sender2,
        identifier: toBN(i),
        amount: toBN('1'),
      })
    }

    for (let i = 0; i < transfers.length; i++) {
      expect(await testERC721.ownerOf(transfers[i].identifier)).to.equal(
        transfers[i].from,
      )
    }

    transfersWithRecipients[0] = createTransferWithRecipient(
      transfers,
      sender2,
      false,
    )

    // Send the bulk transfers
    const tx1 = await tempTransferHelper
      .connect(signer1)
      .bulkTransfer(transfersWithRecipients, tempConduitKey)
    console.log('tx1 id: ', tx1)
    const receipt1: ContractReceipt = await tx1.wait()
    expect(receipt1)
    if (receipt1.events) {
      for (const event of receipt1.events) {
        console.log(`Event ${event.event} with args ${event.args}`)
      }
    }
    console.log(sender1)
    for (let i = 0; i < transfers.length; i++) {
      expect(await testERC721.ownerOf(transfers[i].identifier)).to.equal(
        transfers[i].to,
      )
    }
  })

  it('Revert batch transfer ERC721 with a conduit key', async function () {
    const tx = await testERC721.batchMint(
      sender1,
      'ipfs://QmeSjSinHpPnmXmspMjwiXyN6zS4E9zccariGR3jxcaWtq/1',
      2,
    )
    console.log('tx id: ', tx)
    const receipt: ContractReceipt = await tx.wait()
    expect(receipt)
    if (receipt.events) {
      for (const event of receipt.events) {
        console.log(`Event ${event.event} with args ${event.args}`)
      }
    }

    // Create/Approve numEC721s amount of  ERC721s
    await testERC721.connect(signer1).setApprovalForAll(
      tempConduitAddress, // conduit address
      true,
    )
    const transfersWithRecipients = []

    transfersWithRecipients[0] = createTransferWithRecipient(
      [
        {
          itemType: 2,
          token: testERC721Address,
          from: sender1,
          to: sender2,
          identifier: BigNumber.from('1'),
          amount: BigNumber.from('1'),
        },
      ],
      sender2,
      false,
    )
    // Send the bulk transfers
    await expect(
      tempTransferHelper
        .connect(signer3)
        .bulkTransfer(transfersWithRecipients, tempConduitKey),
    ).to.be.revertedWith(
      `ConduitErrorRevertString("ERC721: transfer from incorrect owner"`,
    )
  })
})
