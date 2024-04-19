
// the v1 schema for a new ticket DOCUMENT as stored in QDN is as follows:
//
// {
//     "appname": "qwiki",
//     "app_referrer": "/",
//     "ticket_type": "comment",        <-- or "bug-report" or "feature-request"
//     "first_submitted_by": "edbob",
//     "first_submitted": 1713488031344,
//     "subject": "just saying hi",
//     "description": "Nothing important, just testing this out.",
//     "version": 1
// }
//
// but since a new ticket is usually not submitted by the relevant app
// owner, the app owner must later accept (or reject) the ticket.  at
// this point a 2nd DOCUMENT is stored on behalf of app owner.
//
// this 2nd ticket should use the same v1 schema as the original,
// but of course the values can now change.
//
// due to this complexity, when the app fetches "complete" details for
// a given ticket, it must (attempt to) fetch multiple resources from
// QDN.  as it gathers more data, the ticket object is updated
// accordingly; so the "final" in-app schema is more like this:

// ticket = {

//     // nb. these come from current resource
//     "appname": "qwiki",
//     "ticket_type": "comment",
//     "first_submitted_by": "edbob",
//     "first_submitted": 1713488031344,
//     "subject": "just saying hi",
//     "description": "Nothing important, just testing this out.",
//     "version": 1,

//     // nb. the remainder are added from elsewhere..

//     // nb. these refer to the current "master" resource for this
//     // ticket (so they may differ from the *original* resource)
//     "qdn_name": "qwiki",
//     "qdn_identifier": "APPQCX_qwiki_123456",
//     "qdn_created": 1713488031344,
//     "qdn_updated": 1713488031344,

//     // nb. must be one of: unconfirmed, accepted, closed, rejected
//     "status": "accepted",
// }


let TicketMixin = {

    methods: {

        getStatusStyle(ticket) {
            let style = {}
            let status = ticket.status

            if (status == 'accepted') {
                style['background-color'] = 'green'
                style['color'] = 'white'

            } else if (status == 'closed') {
                style['background-color'] = 'gray'
                style['color'] = 'white'

            } else if (status == 'rejected') {
                style['background-color'] = 'red'
            }

            return style
        },

        async loadTicket(name, identifier) {

            // fetch original ticket resource
            let original = await this._fetchTicketResource(name, identifier)
            if (!original) {
                return
            }

            // TODO:
            // // so-called original is only *really* considered original
            // // if it has correct identifier pattern.
            // if (identifier.match(/^APPQC_/)) {

            // look for confirmed ticket, only if original identifier pattern is matched
            if (identifier.match(/^APPQC_/)) {

                // (nb. first look for "accepted" and then "rejected")
                let confirmedIdentifier = identifier.replace('APPQC_', 'APPQCX_')
                let confirmed = await this._fetchTicketResource(original.appname, confirmedIdentifier)
                if (!confirmed) {
                    confirmedIdentifier = identifier.replace('APPQC_', 'APPQCZ_')
                    confirmed = await this._fetchTicketResource(original.appname, confirmedIdentifier)
                }

                // use confirmed ticket as master if present; otherwise original
                if (confirmed) {
                    return confirmed
                }
            }

            return original
        },

        async _fetchTicketResource(name, identifier) {

            let ticket
            try {
                ticket = await this.$qordial.fetchResourceObject({
                    service: 'DOCUMENT',
                    name,
                    identifier,
                })
            } catch(error) {
                // TODO: qordial should return a better error for this!
                if (error.toString() == "Error: 404 not found") {
                    return
                }
                throw error
            }

            // sanity check ticket data; ignore invalid
            if (ticket.version != 1) {
                return
            }

            // cleanup data as needed
            if (!ticket.status) {
                ticket.status = 'unconfirmed'
            }

            // TODO: these should be temporary until sample data is fixed
            if (!ticket.first_submitted && ticket.submitted) {
                ticket.first_submitted = ticket.submitted
            }
            if (!ticket.first_submitted_by && ticket.submitted_by) {
                ticket.first_submitted_by = ticket.submitted_by
            }

            // capture true "master" resource info
            ticket.qdn_name = name
            ticket.qdn_identifier = identifier

            return ticket
        },
    },
}

export { TicketMixin }
