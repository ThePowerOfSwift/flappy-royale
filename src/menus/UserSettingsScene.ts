import * as Phaser from "phaser"
import { getUserSettings, changeSettings, Attire, getUserStatistics } from "../user/userManager"
import { GameWidth, GameHeight } from "../constants"
import { launchMainMenu } from "./MainMenuScene"
import { builtInAttire } from "../attire"

export const UserSettingsKey = "UserSettings"

export class UserSettings extends Phaser.Scene {
    constructor() {
        super(UserSettingsKey)
    }

    preload() {
        // Adds the HTML file to the game cache
        this.load.html("Settings", require("../../assets/html/Settings.html"))
        this.load.image("back-button", require("../../assets/menu/Back2.png"))
        this.load.image("bottom-sash", require("../../assets/menu/BottomSash.png"))
        this.load.image("white-circle", require("../../assets/menu/Circle.png"))
        this.load.image("attire-empty", require("../../assets/menu/AttireSelectionEmpty.png"))
        this.load.image("attire-selected", require("../../assets/menu/AttireSelected.png"))
    }

    create() {
        // Fill the BG
        this.add.rectangle(GameWidth / 2, GameHeight / 2, GameWidth, GameHeight, 0xe7d866)

        // Make a HTML form
        var element = this.add.dom(GameWidth / 2, GameHeight / 2).createFromCache("Settings")
        element.addListener("click")

        // Set the circle BG on the you bird
        const you = document.getElementById("you-sticky")
        const youBG = you.getElementsByTagName("img").item(0)
        youBG.src = require("../../assets/menu/Circle.png")

        // Grab the username via the DOM API
        const usernameInput = element.node.getElementsByTagName("input").item(0)
        const settings = getUserSettings()
        usernameInput.value = settings.name

        /**
         * Runs on every selection change and asserts whether an LI
         * corresponding to attire is selected or not
         */
        const updateWearables = () => {
            const settings = getUserSettings()
            for (const element of document.getElementsByTagName("li")) {
                const id = element.id
                const isWearing = settings.aesthetics.attire.find(a => a.id === id)
                const wearing = `url(${require("../../assets/menu/AttireSelected.png")})`
                const notWearing = `url(${require("../../assets/menu/AttireSelectionEmpty.png")})`
                element.style.backgroundImage = isWearing ? wearing : notWearing
            }

            const attires = settings.aesthetics.attire.filter(a => !a.base)
            const styleCount = document
                .getElementById("style-title")
                .getElementsByTagName("span")
                .item(0)
            styleCount.textContent = `${attires.length}/3`
        }

        /** Generates the HTML to create a clickable item for attire, and adds it to the element  */
        const makeClickableAttire = (attire: Attire, element: Element) => {
            const li = document.createElement("li")
            li.id = attire.id

            const div = document.createElement("div")
            div.className = "render"
            li.appendChild(div)

            if (!attire.base) {
                const img = document.createElement("img")
                img.src = require("../../assets/bases/BirdBody.png")
                img.style.opacity = "0.1"
                div.appendChild(img)
            }

            const img = document.createElement("img")
            img.src = attire.href
            div.appendChild(img)

            element.appendChild(li)
        }

        /** Goes up the parent tree till it finds a particular tag */
        const findUpTag = (el: any, tag: string): Element | null => {
            while (el.parentNode) {
                el = el.parentNode
                if (el.tagName === tag) return el
            }
            return null
        }

        /** Creates and updates the unique 'you' preview */
        const showUser = () => {
            const settings = getUserSettings()

            const user = document.getElementById("you")
            while (user.hasChildNodes()) {
                user.removeChild(user.lastChild)
            }

            const userBase = settings.aesthetics.attire.find(a => a.base)
            const img = document.createElement("img")
            img.src = userBase.href
            img.className = "you-attire"
            user.appendChild(img)

            settings.aesthetics.attire
                .filter(a => !a.base)
                .forEach(a => {
                    const attireImg = document.createElement("img")
                    attireImg.src = a.href
                    attireImg.className = "you-attire"
                    user.appendChild(attireImg)
                })

            const wings = document.createElement("img")
            wings.src = require("../../assets/battle/flap-gif.gif")
            wings.className = "you-attire"
            user.appendChild(wings)
        }

        // Click handling
        element.on("click", function(event) {
            const target = event.target as Element

            // Getting a potential attire is tricky, you could hit
            // either the li, the div or the img, so always get to the li.
            const maybeLI = findUpTag(target, "LI")
            if (maybeLI && maybeLI.id) {
                const attire = maybeLI as Element

                const settings = getUserSettings()
                const currentAttire = settings.aesthetics.attire
                const clickedAttire = builtInAttire.find(att => att.id === attire.id)

                // Should we be replacing the body
                if (clickedAttire.base) {
                    // Replace the base
                    const currentClothes = currentAttire.filter(a => !a.base)
                    changeSettings({ aesthetics: { attire: [clickedAttire, ...currentClothes] } })
                } else {
                    const isWearingAttire = currentAttire.find(a => a.id === clickedAttire.id)
                    if (!isWearingAttire) {
                        // Add the clothes, up to three items
                        const currentAttireLength = currentAttire.filter(a => !a.base).length
                        if (currentAttireLength < 3) {
                            changeSettings({ aesthetics: { attire: [...currentAttire, clickedAttire] } })
                        }
                    } else {
                        // remove it
                        const currentClothes = currentAttire.filter(a => a.id !== clickedAttire.id)
                        changeSettings({ aesthetics: { attire: currentClothes } })
                    }
                }

                showUser()
                updateWearables()
            }

            if (event.target.name === "loginButton") {
                const usernameInput = element.node.getElementsByTagName("input").item(0)
                changeSettings({ name: usernameInput.value })
                this.removeListener("click")
            }
        })

        // Sets up the attires
        const bases = builtInAttire.filter(a => a.base)
        const attires = builtInAttire.filter(a => !a.base)

        const basesUL = element.node.getElementsByClassName("bases").item(0)
        const attiresUL = element.node.getElementsByClassName("attires").item(0)

        bases.forEach(a => makeClickableAttire(a, basesUL))
        attires.forEach(a => makeClickableAttire(a, attiresUL))

        // Sets up the stats which lives under the settings
        setUpStatsHTML()

        // Run all the interactions upfront
        updateWearables()
        showUser()

        const header = document.getElementById("header") as HTMLImageElement
        header.src = require("../../assets/menu/RedSash.png")
        const footer = document.getElementById("footer") as HTMLImageElement
        footer.src = require("../../assets/menu/BottomSash.png")

        const back = document.getElementById("back") as HTMLImageElement
        back.src = require("../../assets/menu/Back2.png")

        back.onclick = () => {
            this.game.scene.remove(this)
            launchMainMenu(this.game)
        }
    }
}

function setUpStatsHTML() {
    const statsElement = document.getElementById("stats")
    const stats = getUserStatistics()

    let seconds = Math.floor(stats.totalTime / 1000)
    let minutes = Math.floor(seconds / 60)
    let hours = Math.floor(minutes / 60)
    let days = Math.floor(hours / 24)

    hours = hours - days * 24
    minutes = minutes - days * 24 * 60 - hours * 60
    seconds = seconds - days * 24 * 60 * 60 - hours * 60 * 60 - minutes * 60

    const time = [days, hours, minutes, seconds].filter(d => !!d)
    const postThing = time.length == 1 ? "s" : ""

    // User facing names for the stats
    const presentation = {
        "Royale Wins": stats.royaleWins,
        "Best Position": stats.bestPosition,
        "Top Score": stats.bestScore,
        "Games Played": stats.gamesPlayed,
        "First pipe fails": stats.instaDeaths,
        "Birds Past": stats.birdsBeaten,
        "Play Time": `${time.join(":")}${postThing}`,
        Flaps: stats.totalFlaps
    }

    // Show either top position or royale wins
    if (stats.royaleWins === 0) delete presentation["Royale Wins"]
    if (stats.bestPosition === 0) delete presentation["Best Position"]

    // convert ^ to HTML
    Object.keys(presentation).forEach(key => {
        const value = presentation[key]
        const dataDiv = document.createElement("p")
        dataDiv.innerHTML = `${key}<span>${value}</span>`
        statsElement.appendChild(dataDiv)
        statsElement.appendChild(document.createElement("hr"))
    })
}
