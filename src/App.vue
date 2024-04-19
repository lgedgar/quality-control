<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { mapStores } from 'pinia'
import { useQordialAuthStore, AppFeedback } from 'qordial'
import { useAppSettingsStore } from './stores/settings'
import appsettings from './appsettings'
</script>

<script>
export default {

    data() {
        return {
            appsettings,
            darkMode: false,
        }
    },

    computed: {
        ...mapStores(useQordialAuthStore),
        ...mapStores(useAppSettingsStore),
    },

    mounted() {
        // nb. for some reason the current route does not load automatically
        // in the context of a published q-app, so we do that explicitly
        this.$router.push(window._qdnPath)

        // set dark mode if applicable
        if (window._qdnTheme == 'dark') {
            this.setDarkMode(true)
        }

        if (this.appSettingsStore.alwaysAuthenticate) {
            this.$qordial.authenticate()
        }
    },

    methods: {

        async authButtonClick() {
            if (!this.qordialAuthStore.address) {
                await this.$qordial.authenticate()
            } else {
                await qortalRequest({
                    action: 'OPEN_PROFILE',
                    name: this.qordialAuthStore.username,
                })
            }
        },

        setDarkMode(dark) {
            this.darkMode = dark
            const body = document.querySelector('body')
            body.className = dark ? 'dark' : ''
        },
    },
}
</script>

<template>
   <header>
    <div style="display: flex; gap: 1rem; align-items: center;">

      <h1 class="is-size-1"
          style="flex-grow: 1;">
        <router-link to="/tickets/">{{ appsettings.appTitle }}</router-link>
      </h1>

      <a v-if="!darkMode"
         href="#" @click.prevent="setDarkMode(true)">
        <o-icon icon="moon" size="large" />
      </a>
      <a v-if="darkMode"
         href="#" @click.prevent="setDarkMode(false)">
        <o-icon icon="sun" size="large" />
      </a>

      <app-feedback :appname="appsettings.appTitle" />

      <o-button icon-left="user"
                @click="authButtonClick">
        {{ qordialAuthStore.username || "not authenticated" }}
      </o-button>

    </div>

    <nav>
      <router-link to="/">Home</router-link>
      <router-link to="/tickets">Tickets</router-link>
      <router-link to="/settings">Settings</router-link>
      <router-link to="/about">About</router-link>
    </nav>
  </header>

  <div style="padding: 2rem;">
    <router-view v-slot="{Component}">
      <keep-alive>
        <component :is="Component" />
      </keep-alive>
    </router-view>
  </div>
</template>

<style scoped>

header {
    padding: 1rem;
}

nav {
  text-align: left;
  margin-top: 1rem;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

</style>
