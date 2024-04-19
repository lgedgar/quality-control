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

            accepting: false,
            closing: false,
            rejecting: false,
            reopening: false,

            editShowDialog: false,
            editSubject: null,
            editDescription: null,
            editSaving: false,
        }
    },

    computed: {
        ...mapStores(useQordialAuthStore),

        canAcceptTicket() {
            if (!this.qordialAuthStore.username) {
                return false
            }

            // current user can accept IFF:
            // - current user is app owner
            // - ticket is unconfirmed
            // - ticket is owned by a different user
            if (this.ticket.status == 'unconfirmed'
                && this.qordialAuthStore.username == this.ticket.appname
                && this.qordialAuthStore.username != this.ticket.qdn_name) {
                return true
            }

            return false
        },

        canEditTicket() {
            if (!this.qordialAuthStore.username) {
                return false
            }

            // current user can edit IFF:
            // - ticket is owned by current user
            if (this.qordialAuthStore.username == this.ticket.qdn_name) {
                return true
            }

            return false
        },

        canCloseTicket() {
            if (!this.qordialAuthStore.username) {
                return false
            }

            // current user can close IFF:
            // - ticket is open
            // - ticket is owned by current user
            if (['unconfirmed', 'accepted'].includes(this.ticket.status)
                && this.qordialAuthStore.username == this.ticket.qdn_name) {
                return true
            }

            return false
        },

        canRejectTicket() {
            if (!this.qordialAuthStore.username) {
                return false
            }

            // current user can reject IFF:
            // - ticket is owned by current user
            // - ticket is unconfirmed
            if (this.ticket.status == 'unconfirmed'
                && this.qordialAuthStore.username == this.ticket.qdn_name) {
                return true
            }

            // current user can reject IFF:
            // - current user is app owner
            // - ticket is unconfirmed
            if (this.ticket.status == 'unconfirmed'
                && this.qordialAuthStore.username == this.ticket.appname) {
                return true
            }

            return false
        },

        canReopenTicket() {
            if (!this.qordialAuthStore.username) {
                return false
            }

            // current user can reopen IFF:
            // - ticket is closed or rejected
            // - ticket is owned by current user
            if (['closed', 'rejected'].includes(this.ticket.status)
                && this.qordialAuthStore.username == this.ticket.qdn_name) {
                return true
            }

            return false
        },

        editSaveDisabled() {
            if (!this.editSubject) {
                return true
            }
            if (!this.editDescription) {
                return true
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

        async refreshTicket() {
            this.ticket = null
            await this.setTicket()
        },

        async launchApp(appname) {
            await qortalRequest({
                action: 'OPEN_NEW_TAB',
                qortalLink: `qortal://APP/${appname}`,
            })
        },

        copyTicket() {
            return {
                appname: this.ticket.appname,
                ticket_type: this.ticket.ticket_type,
                first_submitted_by: this.ticket.first_submitted_by,
                first_submitted: this.ticket.first_submitted,
                subject: this.ticket.subject,
                description: this.ticket.description,
                ticket_id: this.ticket.ticket_id,
                version: this.ticket.version,
            }
        },

        async acceptTicket() {
            this.accepting = true
            await this.updateTicket('accepted', () => {
                this.accepting = false
            })
        },

        async editTicketInit() {
            this.editSubject = this.ticket.subject
            this.editDescription = this.ticket.description
            this.editShowDialog = true
        },

        async editTicketSave() {
            this.editSaving = true

            let ticket = this.copyTicket()
            ticket.subject = this.editSubject
            ticket.description = this.editDescription
            ticket.status = this.ticket.status

            if (await this.publishTicket(ticket, this.ticket.qdn_identifier)) {
                this.editShowDialog = false
            }

            this.editSaving = false
        },

        async publishTicket(ticket, identifier) {
            try {
                return await qortalRequest({
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
            }
        },

        async updateTicket(status, wrapup) {
            let ticket = this.copyTicket()
            ticket.status = status

            // nb. original ticket identifier is like APPQC_xxx
            let identifier = this.ticket.qdn_identifier

            // sometimes we will update the original ticket, but
            // other times we will create a new ticket master.
            // so the identifier we use here will reflect that.
            if (this.qordialAuthStore.username != this.ticket.qdn_name) {
                let prefix = (status == 'rejected') ? 'APPQCZ_' : 'APPQCX_'
                identifier = identifier.replace('APPQC_', prefix)
            }

            this.publishTicket(ticket, identifier)
            if (wrapup) {
                wrapup()
            }

            this.$router.push(`/tickets/${this.qordialAuthStore.username}/${identifier}`)
        },

        async closeTicket() {
            this.closing = true
            await this.updateTicket('closed', () => {
                this.closing = false
            })
        },

        async rejectTicket() {
            this.rejecting = true
            await this.updateTicket('rejected', () => {
                this.rejecting = false
            })
        },

        async reopenTicket() {
            this.reopening = true
            await this.updateTicket('accepted', () => {
                this.reopening = false
            })
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
          <a href="#" @click.prevent="launchApp(ticket.appname)">
            {{ ticket.appname }}
          </a>
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
        <div class="buttons"
             style="margin-left: 2rem;">
          <o-button variant="primary"
                    @click="refreshTicket()"
                    icon-left="redo">
            Refresh Ticket
          </o-button>
          <o-button v-if="canEditTicket"
                    variant="primary"
                    @click="editTicketInit()"
                    icon-left="edit">
            Edit Ticket
          </o-button>
        </div>
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
           style="border: 1px solid gray; padding: 1rem; white-space: pre;">
        {{ ticket.description }}
      </div>

      <div class="block buttons">
        <o-button v-if="canAcceptTicket"
                  variant="primary"
                  @click="acceptTicket()"
                  icon-left="check"
                  :disabled="accepting">
          {{ accepting ? "Working, please wait..." : "Accept Ticket" }}
        </o-button>
        <o-button v-if="canCloseTicket"
                  variant="primary"
                  @click="closeTicket()"
                  icon-left="check"
                  :disabled="closing">
          {{ closing ? "Working, please wait..." : "Close Ticket" }}
        </o-button>
        <o-button v-if="canRejectTicket"
                  variant="warning"
                  @click="rejectTicket()"
                  icon-left="ban"
                  :disabled="rejecting">
          {{ rejecting ? "Working, please wait..." : "Reject Ticket" }}
        </o-button>
        <o-button v-if="canReopenTicket"
                  variant="primary"
                  @click="reopenTicket()"
                  icon-left="check"
                  :disabled="reopening">
          {{ reopening ? "Working, please wait..." : "Re-open Ticket" }}
        </o-button>
      </div>

    <o-modal v-model:active="editShowDialog">
      <div class="card">

        <div class="card-header">
          <div class="card-header-title">Edit Ticket</div>
        </div>

        <div class="card-content">

          <o-field label="Subject">
            <o-input v-model.trim="editSubject" />
          </o-field>

          <o-field label="Description">
            <o-input v-model="editDescription"
                     type="textarea" />
          </o-field>

        </div>

        <div class="card-footer">
          <div class="card-footer-item buttons">

            <o-button variant="primary"
                      @click="editTicketSave()"
                      icon-left="save"
                      :disabled="editSaveDisabled">
              {{ editSaving ? "Working, please wait..." : "Save" }}
            </o-button>

            <o-button @click="editShowDialog = false">
              Cancel
            </o-button>
          </div>
        </div>
      </div>
    </o-modal>

    </div>
  </div>
</template>
