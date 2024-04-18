<script setup>
import { mapStores } from 'pinia'
import { useQordialAuthStore, PrettyTime } from 'qordial'
</script>

<script>
export default {

    data() {
        return {
            data: null,
            searching: false,
        }
    },

    computed: {
        ...mapStores(useQordialAuthStore),
    },

    async mounted() {
        await this.refreshTickets()
    },

    methods: {

        async refreshTickets() {
            this.searching = true
            this.data = []

            let params = {
                action: 'SEARCH_QDN_RESOURCES',
                mode: 'ALL',
                service: 'DOCUMENT',
                name: this.qordialAuthStore.username,
                exactMatchNames: true,
                identifier: 'APPQC_', // TODO
                prefix: true,
                limit: 20,      // TODO
            }

            for (let raw of await qortalRequest(params)) {
                if (!raw.identifier) {
                    continue
                }

                let appname = null
                let ticketID = null
                let match = raw.identifier.match(/^APPQC_([^_]+)_(.+)$/)
                if (match) {
                    appname = match[1]
                    ticketID = match[2]
                }
                if (!appname) {
                    continue
                }

                let json = await this.$qordial.fetchResourceObject(raw)

                // TODO: are these good ideas?
                // if (json.version != 1) {
                //     continue
                // }
                // if (json.ticket_id != ticketID) {
                //     continue
                // }

                json.appname = appname
                json.qdn_created = raw.created
                json.qdn_updated = raw.updated
                this.data.push(json)
            }

            this.searching = false
        },
    },
}
</script>

<template>
  <div class="tickets">
    <h3 class="is-size-3 block">All Tickets</h3>

    <o-button variant="primary"
              icon-left="redo"
              @click="refreshTickets()">
      Refresh List
    </o-button>

    <o-table :data="data || []"
             hoverable
             :loading="searching">
      <o-table-column label="App"
                      v-slot="{ row }">
        {{ row.appname }}
      </o-table-column>
      <o-table-column label="Ticket ID"
                      v-slot="{ row }">
        {{ row.ticket_id }}
      </o-table-column>
      <o-table-column label="Ticket Type"
                      v-slot="{ row }">
        {{ row.ticket_type }}
      </o-table-column>
      <o-table-column label="Subject"
                      v-slot="{ row }">
        {{ row.subject }}
      </o-table-column>
      <o-table-column label="Submitted"
                      v-slot="{ row }">
        <PrettyTime :value="row.qdn_created" />
      </o-table-column>
      <o-table-column label="Submitted by"
                      v-slot="{ row }">
        {{ row.submitted_by }}
      </o-table-column>
    </o-table>
  </div>
</template>
