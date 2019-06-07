/** Makes a phaser image act a bit more like a button*/
export const becomeButton = (button: Phaser.GameObjects.Image, action: Function, context?: any) =>
    button
        .setInteractive()
        .on("pointerover", () => {
            button.setY(button.y + 1)
        })
        .on("pointerout", () => {
            button.setY(button.y - 1)
        })
        .on("pointerup", action, context)
