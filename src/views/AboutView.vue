<script setup>
import appsettings from '../appsettings'
</script>

<script>
export default {

    data() {
        return {
            appsettings,
        }
    },

    methods: {

        async showMaintainer() {
            await qortalRequest({
                action: 'OPEN_PROFILE',
                name: this.appsettings.appMaintainer,
            })
        },
    },
}
</script>

<template>
  <div class="about">

    <o-field label="App Name" horizontal>
      <span>{{ appsettings.appTitle }}</span>
    </o-field>

    <o-field label="App Version" horizontal>
      <span>{{ appsettings.appVersion }}</span>
    </o-field>

    <o-field label="Maintainer" horizontal>
      <a href="#" @click.prevent="showMaintainer()">
        {{ appsettings.appMaintainer }}
      </a>
    </o-field>

    <o-field label="Code Repo" horizontal>
      <span>{{ appsettings.appRepository }}</span>
    </o-field>

    <o-field label="Dependencies" horizontal>
      <ul>
        <li v-for="(ver, pkg, i) in appsettings.appDependencies"
            :key="pkg">
          {{ pkg }} {{ ver }}
        </li>
      </ul>
    </o-field>

  </div>
</template>
