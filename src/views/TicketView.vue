<script setup>
import { mapStores } from 'pinia'
import { useQordialAuthStore, PrettyName, PrettyIdentifier, PrettyTime } from 'qordial'
import { TicketMixin } from '../mixins/TicketMixin'
</script>

<script>
export default {

    mixins: [TicketMixin],

    data() {

        return {
            name: null,
            identifier: null,
            ticket: null,
            loading: false,
            rejecting: false,
        }
    },

    computed: {
        ...mapStores(useQordialAuthStore),

        allowAcceptReject() {
            // app owner gets Accept/Reject buttons for unconfirmed tickets
            if (this.ticket.status == 'unconfirmed') {
                if (this.qordialAuthStore.username
                    && this.qordialAuthStore.username == this.ticket.appname
                    && this.qordialAuthStore.username != this.ticket.raw_name) {
                    return true
                }
            }
            return false
        },
    },

    async mounted() {
        await this.setTicket()
    },

    watch: {

        async '$route' (to, from) {
            if (to.name == 'ticket') {
                this.ticket = null
                this.loading = true
                this.setTicket(to)
            }
        },
    },

    methods: {

        async setTicket(route) {
            if (!route) {
                route = this.$route
            }
            this.name = route.params.name
            this.identifier = route.params.identifier

            this.loading = true
            let ticket = await this.loadTicket(this.name, this.identifier)
            this.ticket = ticket
            this.loading = false
        },

        acceptTicket() {
            alert('accepting')
        },

        async rejectTicket() {
            this.rejecting = true

            let ticket = {
                appname: this.ticket.appname,
                ticket_type: this.ticket.ticket_type,
                first_submitted_by: this.ticket.first_submitted_by,
                first_submitted: this.ticket.first_submitted,
                subject: this.ticket.subject,
                description: this.ticket.description,
                ticket_id: this.ticket.ticket_id,
                version: this.ticket.version,
                status: 'rejected',
            }

            // publish rejected ticket to QDN
            let identifier = this.ticket.raw_identifier.replace('APPQC_', 'APPQCZ_')
            let response
            try {
                response = await qortalRequest({
                    action: 'PUBLISH_QDN_RESOURCE',
                    name: this.qordialAuthStore.username,
                    service: 'DOCUMENT',
                    identifier,
                    data64: await this.$qordial.objectToBase64(ticket),
                })
            } catch (error) {

                // ignore error if user just declined txn fee; otherwise alert
                // TODO: this check seems fragile, but i'm not seeing another way?
                if (error.error != 'User declined request') {

                    // TODO: this should work, according to
                    // https://oruga.io/components/Notification.html#programmatically
                    // but i am just getting an error for now, cf.
                    // https://github.com/oruga-ui/oruga/issues/734#issuecomment-1900862765
                    // this.$oruga.notification.open({
                    //     message: error?.error || error.toString(),
                    //     rootClass: 'toast toast-notification',
                    //     position: 'top',
                    // })

                    // TODO: so for now we just do this instead
                    alert(`ERROR\n\n${error?.error || error.toString()}`)
                }

                // in any case, abort on error
                this.rejecting = false
                return
            }

            this.$router.push(`/tickets/${this.qordialAuthStore.username}/${identifier}`)
        },
    },
}
</script>

<template>
  <div class="ticket">

    <div class="block"
         style="display: flex; gap: 2rem; align-items: center; white-space: nowrap;">

      <h2 class="is-size-2">View Ticket</h2>

      <div>
        <o-field label="Resource Owner">
          <pretty-name :value="name" />
        </o-field>
      </div>

      <div>
        <o-field label="Resource ID">
          <pretty-identifier :value="identifier" />
        </o-field>
      </div>

    </div>

    <div v-if="loading">
      <p class="block is-italic">
        Please wait while the ticket data is being retrieved...
      </p>
    </div>

    <div v-if="ticket">

      <o-field grouped>
        <o-field label="App Name">
          <span>{{ ticket.appname }}</span>
        </o-field>
        <!-- TODO: should record this in the initial feedback json -->
        <!-- <o-field label="App Route"> -->
        <!--   <span>{{ ticket.app_route }}</span> -->
        <!-- </o-field> -->
        <o-field label="Ticket ID">
          <span>{{ ticket.ticket_id }}</span>
        </o-field>
        <o-field label="Submitted">
          <pretty-time :value="ticket.first_submitted" />
        </o-field>
        <o-field label="Submitted By">
          <pretty-name :value="ticket.first_submitted_by" />
        </o-field>
      </o-field>

      <div class="block"
           style="margin-top: 2rem; display: flex; gap: 1rem; align-items: center;">

        <div style="border: 1px solid black; padding: 0.25rem; font-weight: bold;"
             :style="getStatusStyle(ticket)">
          {{ ticket.status || "(unknown)" }}
        </div>

        <div style="border: 1px solid black; padding: 0.25rem; font-weight: bold;">
          {{ ticket.ticket_type }}
        </div>

        <h3 class="is-size-3">
          {{ ticket.subject || "(no subject)" }}
        </h3>
      </div>

      <div class="block"
           style="border: 1px solid gray; padding: 1rem;">
        {{ ticket.description }}
      </div>

      <div v-if="allowAcceptReject"
           class="block buttons">
        <o-button variant="primary"
                  @click="acceptTicket()"
                  icon-left="check">
          Accept Ticket
        </o-button>
        <o-button variant="warning"
                  @click="rejectTicket()"
                  icon-left="ban"
                  :disabled="rejecting">
          {{ rejecting ? "Working, please wait..." : "Reject Ticket" }}
        </o-button>
      </div>

    </div>
  </div>
</template>
