import { defineStore } from 'pinia'

const getDefaults = () => {

    let alwaysAuthenticate = localStorage.getItem('appSettings.alwaysAuthenticate')
    if (alwaysAuthenticate == null) {
        alwaysAuthenticate = false
    } else {
        alwaysAuthenticate = JSON.parse(alwaysAuthenticate)
    }

    return {
        alwaysAuthenticate,
    }
}

export const useAppSettingsStore = defineStore('appSettings', {

    state: () => {
        return getDefaults()
    },

    actions: {

        setAlwaysAuthenticate(value) {
            this.alwaysAuthenticate = value
            localStorage.setItem('appSettings.alwaysAuthenticate', JSON.stringify(value))
        },
    },
})
