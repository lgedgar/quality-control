import './assets/main.scss'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Oruga from '@oruga-ui/oruga-next'
import { bulmaConfig } from '@oruga-ui/theme-bulma'

import { library } from "@fortawesome/fontawesome-svg-core"
import { fas } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"

import App from './App.vue'
import router from './router'
import {QordialPlugin} from 'qordial'

library.add(fas)

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.component('VueFontawesome', FontAwesomeIcon)
app.use(Oruga, {
    ...bulmaConfig,
    iconComponent: 'vue-fontawesome',
    iconPack: 'fas',
})
app.use(QordialPlugin)

app.mount('#app')
