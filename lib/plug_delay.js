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
 * Plug to delay requests.
 *
 *
 * @module caf_delay/plug_delay
 * @augments external:caf_components/gen_plug
 *
 */
// @ts-ignore: augments not attached to a class

const assert = /**@ignore @type {typeof import('assert')} */(require('assert'));
const caf_comp = require('caf_components');
const myUtils = caf_comp.myUtils;
const genPlug = caf_comp.gen_plug;
const genCron = caf_comp.gen_cron;
const {Heap} = require('heap-js');

exports.newInstance = async function($, spec) {
    try {
        // a,b are of type scheduledTaskType
        const isEqualTaskF = (a, b) => a.id === b.id;
        const heap = new Heap((a, b) => a.when - b.when);

        const that = genPlug.create($, spec);

        $._.$.log && $._.$.log.debug('New delay plug');

        assert.equal(typeof spec.env.delayIntervalCheckInSec, 'number',
                     "'spec.env.delayIntervalCheckInSec' is not a number");

        assert.equal(typeof spec.env.ignoreAfterInSec, 'number',
                     "'spec.env.ignoreAfterInSec' is not a number");

        const cronSpec = {
            name: spec.name + '_cron__',
            module: 'gen_cron', // module ignored
            env: {interval: spec.env.delayIntervalCheckInSec*1000}
        };
        const schedulerCron = genCron.create(null, cronSpec);

        // task is scheduledTaskType
        that.schedule = function(task) {
            //TODO: this is O(N) in this heap implementation, combine with a set
            heap.remove(task, isEqualTaskF); // no duplicates...
            heap.push(task);
        };

        that.cancel = function(id) {
            heap.remove({id}, isEqualTaskF);
        };

        that.dispatchTasks = function() {
            try {
                if (heap.size() > 0) {
                    const now = Date.now();
                    const lastChance = now + spec.env.ignoreAfterInSec * 1000;
                    let top = heap.peek();
                    while (top && (top.when > now)) {
                        top = heap.pop();
                        if (top.when < lastChance) {
                            top.handlerF(top.id);
                        } else {
                            $._.$.log && $._.$.log.warn(
                                `Ignoring late task ${top.id} now: ${now} ` +
                                    `when: ${top.when}`
                            );
                        }
                        top = heap.peek();
                    }
                }
            } catch (err) {
                $._.$.log && $._.$.log.warn(
                    `Ignoring in delay cron ${myUtils.errToPrettyStr(err)}`
                );
            }
        };

        const super__ca_shutdown__ =
              myUtils.superiorPromisify(that, '__ca_shutdown__');
        that.__ca_shutdown__ = async function(data) {
            try {
                schedulerCron && schedulerCron.__ca_stop__();
                const res = await super__ca_shutdown__(data);
                return [null, res];
            } catch (err) {
                return [err];
            }
        };

        schedulerCron.__ca_start__(that.dispatchTasks);

        return [null, that];
    } catch (err) {
        return [err];
    }
};
