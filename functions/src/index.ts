import * as functions from "firebase-functions"
import * as admin from "firebase-admin"
import { SeedsResponse } from "./api-contracts"
import * as pako from "pako"
import { SeedDataZipped, SeedData } from "../../src/firebase"
import { processNewRecording } from "./processNewRecording"

const cors = require("cors")({
    origin: true
})

const numberOfDifferentRoyaleReplays = 12

// So we can access the db
admin.initializeApp()

/** Gets a consistent across all API versions seed for a day */
export const dailySeed = (version: string, offset: number) => {
    const date = new Date()
    return `${version}-${date.getFullYear()}-${date.getMonth()}-${date.getDate() + offset}`
}

/** Gets a consistent across all API versions seed for an hour */
export const hourlySeed = (version: string, offset: number) => {
    const date = new Date()
    return `${version}-${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours() + offset}}`
}

/** We currently change seeds every hour on the hour.
 * So the next time the client needs to re-fetch seeds is on the next hour boundary
 */
const currentSeedExpiry = (): Date => {
    const expiry = new Date()
    expiry.setMilliseconds(0)
    expiry.setSeconds(0)
    expiry.setMinutes(0)
    expiry.setHours(expiry.getHours() + 1)

    return expiry
}

export const seeds = functions.https.onRequest((request, response) => {
    cors(request, response, () => {
        const version = request.query.version || request.params.version
        const responseJSON: SeedsResponse = {
            royale: [...Array(numberOfDifferentRoyaleReplays).keys()].map(i => `${version}-royale-${i}`),
            daily: {
                dev: dailySeed(version, 2),
                staging: dailySeed(version, 1),
                production: dailySeed(version, 0)
            },
            hourly: {
                dev: hourlySeed(version, 2),
                staging: hourlySeed(version, 1),
                production: hourlySeed(version, 0)
            },
            expiry: currentSeedExpiry().toJSON()
        }
        response.status(200).send(responseJSON)
    })
})

export interface ReplayUploadRequest {
    uuid?: string
    version: string
    seed: string
    mode: number
    data: import("../../src/firebase").PlayerData
}

export const addReplayToSeed = functions.https.onRequest(async (request, response) => {
    cors(request, response, async () => {
        const { seed, uuid, version, data, mode } = JSON.parse(request.body) as ReplayUploadRequest

        if (!uuid) {
            return response.status(400).send({ error: "Needs a uuid in request" })
        }
        if (!version) {
            return response.status(400).send({ error: "Needs a version in request" })
        }
        if (!data) {
            return response.status(400).send({ error: "Needs a data of type PlayerData in request" })
        }
        if (!mode) {
            return response.status(400).send({ error: "Needs a game mode in request" })
        }

        const db = admin.firestore()
        const recordings = db.collection("recordings")
        const dataRef = await recordings.doc(seed)
        const zippedSeedData = (await dataRef.get()).data() as SeedDataZipped

        // Mainly to provide typings to dataRef.set
        const saveToDB = (a: SeedDataZipped) => dataRef.set(a)

        if (!zippedSeedData) {
            // We need too make the data
            const document = { replaysZipped: zippedObj([data]) }
            await saveToDB(document)
        } else {
            const seedData = unzipSeedData(zippedSeedData)
            const newData = processNewRecording(seedData, data, uuid, mode)
            await saveToDB({ replaysZipped: zippedObj(newData.replays) })
        }

        const responseJSON = { success: true }
        return response.status(200).send(responseJSON)
    })
})

/**
 * Converts from the db representation where the seed data is gzipped into
 * a useable model JSON on the client
 */
export const unzipSeedData = (seed: SeedDataZipped): SeedData => {
    return {
        replays: unzip(seed.replaysZipped)
    }
}

const unzip = (bin: string) => {
    if (!bin) {
        throw new Error("No bin param passed to unzip")
    }
    let uncompressed = ""
    try {
        uncompressed = pako.inflate(bin, { to: "string" })
    } catch (error) {
        console.error("Issue unzipping")
        console.error(error)
    }
    let decoded = decodeURIComponent(escape(uncompressed))
    try {
        let obj = JSON.parse(decoded)
        return obj
    } catch (error) {
        console.error("Issue parsing JSON: ", decoded)
        console.error(error)
    }
}

const zippedObj = (obj: object) => {
    const str = JSON.stringify(obj)
    const data = unescape(encodeURIComponent(str))
    const zipped = pako.deflate(data, { to: "string" })
    return zipped
}
