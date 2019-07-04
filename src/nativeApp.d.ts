import { haptics } from "./haptics"

declare global {
    interface Window {
        // iOS
        isAppleApp: boolean
        webkit: {
            messageHandlers: { [key: string]: WebkitHandler }
        }

        /** Like 15 or something */
        buildVersion: string
        /** Release version, e.g. 1.1 */
        appVersion: string

        // Android
        ModalAdPresenter?: {
            requestAd: (currentState: number) => void
            prepareAd: (currentState: number) => void
        }

        Analytics?: {
            event: (name: string, params: any) => void
            userProperty: (name: string, value: string) => void
            setId: (id: string) => void
        }

        Sharing?: {
            shareScreenshot: (name: string) => void
        }

        URLLoader?: {
            openURL: (url: string) => void
        }

        ga?(id: "send", event: "event", category: string, action: string, label: string, value?: number)
        playfabAuth?: {
            method: string
            payload: any
        }
    }
}

interface WebkitHandler {
    postMessage: (args: string | integer | boolean) => void
}
