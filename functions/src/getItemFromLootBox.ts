import { lookupBoxesForTiers } from "./index"
import { LootboxTier } from "../../src/attire"
import _ = require("lodash")

const randPercent = (perc: 50 | 25 | 12.5 | 5 | 2.5 | 1.5 | 1 | 0.5) => {
    switch (perc) {
        case 50:
            return rand(0, 1) === 1
        case 25:
            return rand(0, 3) === 2
        case 12.5:
            return rand(0, 7) === 2
        case 5:
            return rand(0, 19) === 3
        case 2.5:
            return rand(0, 9) === 3
        case 1:
            return rand(0, 99) === 4
        case 1.5:
            return rand(0, 149) === 4
        case 0.5:
            return rand(0, 199) === 5
    }
}

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min

export const tierForScore = (score: number): LootboxTier | undefined => {
    if (score >= 30) {
        if (rand(1, 100) <= 10) return 3
        if (rand(1, 100) <= 80) return 2
        if (rand(1, 100) <= 25) return 1
        if (rand(1, 100) <= 10) return 0
    } else if (score >= 20) {
        if (rand(1, 100) <= 1) return 3
        if (rand(1, 100) <= 50) return 2
        if (rand(1, 100) <= 25) return 1
        if (rand(1, 100) <= 10) return 0
    } else if (score >= 10) {
        if (rand(1, 100) <= 1) return 3
        if (rand(1, 100) <= 3) return 2
        if (rand(1, 100) <= 25) return 1
        if (rand(1, 100) <= 10) return 0
    } else if (score >= 2) {
        if (rand(1, 100) <= 1) return 3
        if (rand(1, 100) <= 2) return 2
        if (rand(1, 100) <= 5) return 1
        if (rand(1, 100) <= 10) return 0
    } else if (score >= 1) {
        if (rand(1, 100) <= 5) return 0
    }

    return undefined
}

export const getItemFromLootBoxStartingWith = (
    initialTier: LootboxTier,
    allPlayfabTables: PlayFabAdminModels.RandomResultTableListing[],
    playerInventoryIDs: string[]
) => {
    const getItemForTableID = (tier: LootboxTier): undefined | PlayFabServerModels.ResultTableNode => {
        const id = lookupBoxesForTiers[tier]
        const table = allPlayfabTables.find(t => t.TableId === id)
        if (!table) {
            if (process.env.JEST_WORKER_ID === undefined) console.error(`Could not find a table for ${id}`)
            return undefined
        }

        // Remove all items the player already has
        const availableNodes = table.Nodes.filter(n => !_.includes(playerInventoryIDs, n.ResultItem))
        if (availableNodes.length === 0) {
            return undefined
        }

        return _.sample(availableNodes)
    }

    if (initialTier === -1) return // Should never happen, but narrows the LootboxTier union to less members

    const item = getItemForTableID(initialTier)
    if (item) return item

    // First look downwards so you get the rarest first
    const walkDownFirst = [3, 2, 1, 0] as const
    const currentIndex = walkDownFirst.indexOf(initialTier)
    for (let i = currentIndex; i < walkDownFirst.length; i++) {
        const tier = walkDownFirst[i]
        const item = getItemForTableID(tier)
        if (item) return item
    }

    const walkUp = [1, 2, 3] as const
    for (let i = 0; i < walkUp.length; i++) {
        const tier = walkUp[i]
        const item = getItemForTableID(tier)
        if (item) return item
    }

    return undefined
}
