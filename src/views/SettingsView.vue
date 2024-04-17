<script setup>
import { mapStores } from 'pinia'
import {useAppSettingsStore} from '@/stores/settings'
</script>

<script>
export default {

    computed: {
        ...mapStores(useAppSettingsStore),
    },
}
</script>

<template>
  <div class="settings">
    <h2 class="is-size-2">App Settings</h2>

    <p class="block">
      These are stored only on your computer (in the browser), not on QDN.
    </p>

    <div class="card">
      <div class="card-content">
        <o-field>
          <o-checkbox v-model="appSettingsStore.alwaysAuthenticate"
                      @update:model-value="appSettingsStore.setAlwaysAuthenticate">
            Attempt authentication on app startup
          </o-checkbox>
        </o-field>
      </div>
    </div>
  </div>
</template>
