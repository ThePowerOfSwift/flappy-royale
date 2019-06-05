import * as Phaser from "phaser"
import { changeSettings, UserSettings } from "../user/userManager"
import { GameWidth, GameHeight } from "../constants"
import { launchMainMenu } from "./MainMenuScene"
import { fetchRecordingsForSeed } from "../firebase"
import { preloadBirdAttire } from "../battle/BirdSprite"
import { BattleScene } from "../battle/Scene"
import { GameMode } from "../battle/utils/gameMode"

export const RoyaleLobbyKey = "RoyaleLobby"

export interface RoyaleLobbyProps {
    seed: string
}

export class RoyaleLobby extends Phaser.Scene {
    private seed: string

    constructor(props: RoyaleLobbyProps) {
        super("RoyaleLobbyScene")
        this.seed = props.seed
        console.log("Starting Royale with seed: " + props.seed)
    }

    preload() {
        // Adds the HTML file to the game cache
        this.load.html("RoyaleLobby", require("../../assets/html/RoyaleLobby.html"))
        this.load.image("back-button", require("../../assets/menu/back.png"))
        this.load.image("bottom-sash", require("../../assets/menu/BottomSash.png"))
        this.load.image("white-circle", require("../../assets/menu/Circle.png"))
        this.load.image("purple-sash", require("../../assets/menu/PurpleishSash.png"))
        this.load.image("white-sash", require("../../assets/menu/WhiteTriangleSlashShape.png"))
        this.load.image("attire-selected", require("../../assets/menu/AttireSelected.png"))
    }

    create() {
        // Fill the BG
        this.add.rectangle(GameWidth / 2, GameHeight / 2, GameWidth, GameHeight, 0xacd49d)

        // Make a HTML form
        var element = this.add.dom(GameWidth / 2, GameHeight / 2).createFromCache("RoyaleLobby")

        // Set the circle BG on the you bird
        const you = document.getElementById("you-sticky")
        // const youBG = you.getElementsByTagName("img").item(0)
        // youBG.src = require("../../assets/menu/Circle.png")

        // Click handling
        element.on("click", function(event) {
            const target = event.target as Element

            if (event.target.name === "loginButton") {
                const usernameInput = element.node.getElementsByTagName("input").item(0)
                changeSettings({ name: usernameInput.value })
                this.removeListener("click")
            }
        })

        // const lobby = this.add.bitmapText(40, 80, "nokia16", "...")
        // const royale = this.add
        //     .image(80, 160, "royale-button")
        //     .setAlpha(0.2)
        //     .setInteractive()

        const createUserImage = (user: UserSettings) => {
            const root = document.createElement("div")

            const userBase = user.aesthetics.attire.find(a => a.base)
            const img = document.createElement("img")
            img.src = userBase.href
            img.className = "you-attire"
            root.appendChild(img)

            user.aesthetics.attire
                .filter(a => !a.base)
                .forEach(a => {
                    const attireImg = document.createElement("img")
                    attireImg.src = a.href
                    attireImg.className = "you-attire"
                    root.appendChild(attireImg)
                })

            const wings = document.createElement("img")
            wings.src = require("../../assets/battle/flap-gif.gif")
            wings.className = "you-attire"
            root.appendChild(wings)

            return root
        }

        fetchRecordingsForSeed(this.seed).then(seedData => {
            const birdCount = document.getElementById("you-vs")
            console.log(seedData)
            this.tweens.addCounter({
                from: 0,
                to: seedData.replays.length,
                ease: "Cubic",
                duration: Math.floor(Math.random() * 2000),
                repeat: 0,
                onUpdate: (v: Phaser.Tweens.Tween) =>
                    (birdCount.innerHTML = `You vs <span>${pad(Math.round(v.getValue()), 2)}</span> birds`)
            })

            const birds = document.getElementById("birds")
            seedData.replays.forEach(score => {
                preloadBirdAttire(this, score.user)

                const birdLi = document.createElement("li")
                const previewDiv = createUserImage(score.user)
                const theirName = document.createElement("p")
                theirName.innerText = score.user.name

                birdLi.appendChild(previewDiv)
                birdLi.appendChild(theirName)
                birds.appendChild(birdLi)
            })

            const preloadAssetsDone = () => {
                const goButton = document.getElementById("button")

                goButton.onclick = () => {
                    this.game.scene.remove(this)
                    const scene = new BattleScene({ seed: this.seed, data: seedData, gameMode: GameMode.Royale })
                    this.game.scene.add("BattleScene" + this.seed, scene, true, {})
                }
            }

            this.load.once("complete", preloadAssetsDone, this)
            this.load.start()
        })

        const header = document.getElementById("header") as HTMLImageElement
        header.src = require("../../assets/menu/PurpleishSash.png")

        const footer = document.getElementById("footer") as HTMLImageElement
        footer.src = require("../../assets/menu/BottomSash.png")

        const back = document.getElementById("back") as HTMLImageElement
        back.src = require("../../assets/menu/Back2.png")

        const whiteSlash = document.getElementById("white-slash") as HTMLImageElement
        whiteSlash.src = require("../../assets/menu/WhiteTriangleSlashShape.png")

        const whiteCircle = document.getElementById("white-circle") as HTMLImageElement
        whiteCircle.src = require("../../assets/menu/Circle.png")

        const buttonBG = document.getElementById("button-bg") as HTMLImageElement
        buttonBG.src = require("../../assets/menu/ButtonBG.png")

        document.getElementById("back").onclick = () => {
            this.game.scene.remove(this)
            launchMainMenu(this.game)
        }
    }
}

function pad(n: any, width: any, z?: any) {
    z = z || "0"
    n = n + ""
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n
}
