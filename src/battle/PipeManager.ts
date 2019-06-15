import { BattleScene } from "./Scene"
import * as constants from "../constants"
import * as Phaser from "phaser"
import { createSprite } from "./utils/createSprite"

export const addRowOfPipes = (x: number, scene: BattleScene): Phaser.Physics.Arcade.Group => {
    // Randomly pick a number between 1 and 7
    // This will be the hole positioning
    const slots = 7

    const windowHeight = constants.GameAreaHeight

    // Distance from the top / bottom of the space
    const pipeEdgeBuffer = 170

    // Distance from the bottom
    const floorAvoidanceHeight = 40

    const gapHeight = constants.gapHeight - Math.min(Math.floor(scene.score / 20), 6)

    // get the distance between each potential interval
    const pipeIntervals = (windowHeight - pipeEdgeBuffer / 2 - gapHeight / 2) / slots

    const holeSlot = Math.floor(scene.rng() * 5) + 1
    const holeTop = Math.round(
        pipeIntervals * holeSlot +
            pipeEdgeBuffer / 2 -
            gapHeight / 2 -
            floorAvoidanceHeight +
            constants.GameAreaTopOffset
    )
    const holeBottom = Math.round(
        pipeIntervals * holeSlot +
            pipeEdgeBuffer / 2 +
            gapHeight / 2 -
            floorAvoidanceHeight +
            constants.GameAreaTopOffset
    )

    const pipeTop = createSprite(x, holeTop, "pipe-top", scene)
    const pipeBottom = createSprite(x, holeBottom, "pipe-bottom", scene)

    const pipeTopBody = createSprite(x, holeTop - 5, "pipe-body", scene)
    pipeTopBody.setScale(1, 4000)

    const pipeBottomBody = createSprite(x, windowHeight, "pipe-body", scene)
    pipeBottomBody.setScale(1, windowHeight - holeBottom - 5)

    pipeTop.setDepth(constants.zLevels.pipe)
    pipeTopBody.setDepth(constants.zLevels.pipe)
    pipeBottom.setDepth(constants.zLevels.pipe)
    pipeBottomBody.setDepth(constants.zLevels.pipe)

    const pipes = [pipeTop, pipeTopBody, pipeBottom, pipeBottomBody]

    const group = scene.physics.add.group(pipes)
    group.setVelocityX(-1 * constants.pipeSpeed)
    pipes.forEach(configurePipeSprite)

    return group
}

const configurePipeSprite = (pipe: Phaser.Physics.Arcade.Sprite) => {
    const body = pipe.body as Phaser.Physics.Arcade.Body
    body.setAllowGravity(false)
}

export const pipeOutOfBoundsCheck = (pipes: Phaser.Physics.Arcade.Group[]) => {
    pipes.forEach(pipeGroup => {
        const obj = pipeGroup.getChildren()[0].body as Phaser.Physics.Arcade.Body
        if (obj.x < -60) {
            pipes.shift()
            pipeGroup.destroy()
        }
    })
}

export const nudgePipesOntoPixelGrid = (pipes: Phaser.Physics.Arcade.Group[]) => {
    pipes.forEach(pipeGroup => {
        pipeGroup.getChildren().forEach(p => {
            const body = p.body as Phaser.Physics.Arcade.Body
            body.position.x = Math.floor(body.position.x)
        })
    })
}

export const preloadPipeSprites = (scene: Phaser.Scene) => {
    scene.load.image("pipe-top", require("../../assets/battle/PipeTop.png"))
    scene.load.image("pipe-body", require("../../assets/battle/PipeLength.png"))
    scene.load.image("pipe-bottom", require("../../assets/battle/PipeBottom.png"))
}
