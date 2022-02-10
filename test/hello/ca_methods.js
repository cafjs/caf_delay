'use strict';

const APP_SESSION = 'default';

exports.methods = {
    async __ca_init__() {
        this.$.log.debug("++++++++++++++++Calling init");
        this.state.counter = 0;
        return [];
    },

    async schedule(delay, delta) {
        const id = this.$.delay.scheduleWithOffset(
            delay, '__ca_inc__', [delta], true
        );
        return [null, id];
    },

    async cancel(id) {
        this.$.delay.cancel(id);
        return this.getState();
    },

    async __ca_inc__(delta, id) {
        this.$.log.debug(`inc delta:${delta} id:${id}`);
        this.state.counter = this.state.counter + delta;
        return [];
    },


    async getState() {
        return [null, {...this.state, pending: this.$.delay.getPending()}];
    }
};
