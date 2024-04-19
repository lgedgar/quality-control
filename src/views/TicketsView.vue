<script setup>
import { mapStores } from 'pinia'
import { useQordialAuthStore, PrettyTime } from 'qordial'
import { TicketMixin } from '../mixins/TicketMixin'
</script>

<script>
export default {

    mixins: [TicketMixin],

    data() {
        return {
            showClosed: false,
            data: null,
            searching: false,
            clickableRowIndex: null,
        }
    },

    computed: {
        ...mapStores(useQordialAuthStore),
    },

    async mounted() {
        await this.refreshTickets()
    },

    methods: {

        ticketRowClass(row, index) {
            if (this.clickableRowIndex == index) {
                return 'clickable'
            }
        },

        ticketMouseEnter(row, index, event) {
            this.clickableRowIndex = index
        },

        ticketMouseLeave(row, index, event) {
            this.clickableRowIndex = null
        },

        ticketCellClick(ticket, column, index, colindex, event) {
            this.$router.push(`/tickets/${ticket.raw_name}/${ticket.raw_identifier}`)
        },

        async refreshTickets() {
            this.searching = true
            this.data = []

            let params = {
                action: 'SEARCH_QDN_RESOURCES',
                mode: 'ALL',
                service: 'DOCUMENT',
                identifier: 'APPQC_', // TODO
                prefix: true,
                limit: 20,      // TODO
            }

            for (let raw of await qortalRequest(params)) {

                // TODO: i think i added this prematurely, not sure
                // if qortal would actually return some like this?
                if (!raw.identifier) {
                    continue
                }

                // TODO: why is qortal search returning e.g. APPQCZ_
                // despite my requested prefix??
                if (!raw.identifier.match(/^APPQC_/)) {
                    continue
                }

                // okay try to load the ticket master
                let ticket = await this.loadTicket(raw.name, raw.identifier)
                if (!ticket) {
                    continue
                }

                // maybe filter out closed tickets
                if (!this.showClosed) {
                    if (['closed','rejected'].includes(ticket.status)) {
                        continue
                    }
                }

                // okay we got a good one
                this.data.push(ticket)
            }

            this.searching = false
        },
    },
}
</script>

<template>
  <div class="tickets">

    <h3 class="is-size-3 block">All Tickets</h3>

    <o-field>
      <o-checkbox v-model="showClosed">
        Show tickets which are closed
      </o-checkbox>
    </o-field>

    <o-button variant="primary"
              icon-left="redo"
              @click="refreshTickets()">
      Refresh List
    </o-button>

    <o-table :data="data || []"
             hoverable
             :row-class="ticketRowClass"
             @mouseenter="ticketMouseEnter"
             @mouseleave="ticketMouseLeave"
             @cell-click="ticketCellClick"
             :loading="searching">
      <o-table-column label="App"
                      v-slot="{ row }">
        {{ row.appname }}
      </o-table-column>
      <o-table-column label="Subject"
                      v-slot="{ row }">
        {{ row.subject }}
      </o-table-column>
      <!-- <o-table-column label="Ticket ID" -->
      <!--                 v-slot="{ row }"> -->
      <!--   {{ row.ticket_id }} -->
      <!-- </o-table-column> -->
      <o-table-column label="Ticket Type"
                      v-slot="{ row }">
        {{ row.ticket_type }}
      </o-table-column>
      <o-table-column label="Status"
                      v-slot="{ row }">
        <span style="padding: 0.25rem;"
              :style="getStatusStyle(row)">
          {{ row.status }}
        </span>
      </o-table-column>
      <o-table-column label="Submitted"
                      v-slot="{ row }">
        <PrettyTime :value="row.first_submitted" />
      </o-table-column>
      <o-table-column label="Submitted by"
                      v-slot="{ row }">
        {{ row.first_submitted_by }}
      </o-table-column>
    </o-table>
  </div>
</template>

<style>

.table .clickable td {
    cursor: pointer;
}

</style>
