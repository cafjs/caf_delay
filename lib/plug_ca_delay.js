/*!
Copyright 2022 Caf.js Labs and contributors

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
'use strict';

/**
 * Delays methods for this CA.
 *
 *
 * @module caf_delay/plug_ca_delay
 * @augments external:caf_components/gen_plug_ca
 */
// @ts-ignore: augments not attached to a class

const caf_comp = require('caf_components');
const myUtils = caf_comp.myUtils;
const genPlugCA = caf_comp.gen_plug_ca;
const json_rpc = require('caf_transport').json_rpc;
const assert = require('assert');

exports.newInstance = async function($, spec) {
    try {
        const that = genPlugCA.create($, spec);

        /*
         * The contents of this variable are always checkpointed before
         * any state externalization (see `gen_transactional`).
         */
        that.state = {}; // pendingMethods:Object<string, pendingMethodType>

        const handlerF = function(id) {
            /** @type {Object.<string, pendingMethodType>}*/
            const pendingMethods = that.state.pendingMethods || {};

            if (!that.__ca_isShutdown__ && pendingMethods[id]) {
                const {method, args} = pendingMethods[id];

                /* Response processed in a separate transaction, i.e.,
                   using a fresh message */
                const m = json_rpc.systemRequest($.ca.__ca_getName__(),
                                                 method, ...args);
                $.ca.__ca_process__(m, function(err) {
                    /* Note that this is NOT transactional. We could execute
                     * the delayed method, checkpoint, and do not delete the
                     * pending method because we crashed. But this just means
                     * that we execute it multiple times, something that
                     * is ok because we don't guarantee at-most-once semantics.
                     */
                    if (pendingMethods[id]) {
                        const {when, repeater} = pendingMethods[id];
                        if (repeater) {
                            repeater.whenLastCompleted = Date.now();
                            repeater.completed++;
                            if (repeater.completed >= repeater.maxTimes) {
                                delete pendingMethods[id];
                            } else {
                                const newWhen = 1000*repeater.interval + when;
                                pendingMethods[id].when = newWhen;
                                $._.$.delay.schedule({id, when: newWhen,
                                                      handlerF});
                                $.ca.$.log && $.ca.$.log.trace(
                                    `Rescheduling id:${id} when: ${newWhen} ` +
                                        ` ${JSON.stringify(repeater)}`
                                );
                            }
                        } else {
                            delete pendingMethods[id];
                        }
                    }

                    err && $.ca.$.log && $.ca.$.log.error(
                        `Ignoring exception in delayed method ${method} ` +
                            `with args ${args}: ${myUtils.errToPrettyStr(err)}`
                    );
                });
            } else {
                $.ca.$.log && $.ca.$.log.debug(
                    `Ignoring delayed method ${id} with isShutdown ` +
                        `${!!that.__ca_isShutdown__}`
                );
            }
        };

        // transactional ops
        const target = {
            async scheduleImpl(id, when) {
                $._.$.delay.schedule({id, when, handlerF});
                return [];
            },
            async cancelImpl(id) {
                $._.$.delay.cancel(id);
                return [];
            }
        };

        that.__ca_setLogActionsTarget__(target);

        that.schedule = function(when, method, args, repeater, addId) {
            assert(typeof when === 'number', 'Invalid delay');
            assert(typeof method === 'string', 'Invalid method');
            assert(Array.isArray(args), 'Invalid arguments');
            if (repeater) {
                assert(typeof repeater.interval === 'number',
                       'Invalid repeater');
                repeater.maxTimes && // ignore 0
                    assert(typeof repeater.maxTimes === 'number',
                           'Invalid repeater');
                repeater = {
                    interval: repeater.interval,
                    completed: 0,
                    maxTimes: repeater.maxTimes || Number.MAX_SAFE_INTEGER
                };
            } else {
                repeater = null;
            }
            const id = myUtils.uniqueId();
            (typeof addId === 'boolean') && args.push(id);
            /** @type {Object.<string, pendingMethodType>}*/
            const pendingMethods = that.state.pendingMethods || {};
            pendingMethods[id] = {id, when, method, args, repeater};
            that.state.pendingMethods = pendingMethods;
            that.__ca_lazyApply__('scheduleImpl', [id, when]);

            return id;
        };

        that.getPending = function() {
            return myUtils.deepClone(that.state.pendingMethods || {});
        };

        that.cancel = function(id) {
            that.state.pendingMethods && delete that.state.pendingMethods[id];
            that.__ca_lazyApply__('cancelImpl', [id]);
        };

        const super__ca_shutdown__ =
            myUtils.superiorPromisify(that, '__ca_shutdown__');
        that.__ca_shutdown__ = async function(data) {
            try {
                const res = await super__ca_shutdown__(data);
                const pendingMethods = that.state.pendingMethods || {};
                Object.keys(pendingMethods).forEach((id) => {
                    // remove handlers
                    $._.$.delay.cancel(id);
                });
                return [null, res];
            } catch (err) {
                return [err];
            }
        };

        const super__ca_resume__ =
            myUtils.superiorPromisify(that, '__ca_resume__');
        that.__ca_resume__ = async function(cp) {
            try {
                const data = await super__ca_resume__(cp);
                const pendingMethods = that.state.pendingMethods || {};
                Object.values(pendingMethods).forEach(({id, when}) => {
                    // restore handlers
                    $._.$.delay.schedule({id, when, handlerF});
                });
                return [null, data];
            } catch (err) {
                return [err];
            }
        };


        return [null, that];
    } catch (err) {
        return [err];
    }
};
