'use strict';

/**
 *  Proxy to execute methods sometime in the future.
 *
 * @module caf_delay/proxy_delay
 * @augments external:caf_components/gen_proxy
 */
// @ts-ignore: augments not attached to a class
const caf_comp = require('caf_components');
const genProxy = caf_comp.gen_proxy;

exports.newInstance = async function($, spec) {
    try {
        const that = genProxy.create($, spec);

        // Seconds in a year, month, week, day, and hour.
        that.YEAR = 31536000;
        that.MONTH = 2628000;
        that.WEEK = 604800;
        that.DAY = 86400;
        that.HOUR = 3600;

        /**
         * A helper method to build a repeater configuration.
         *
         * @param {number} interval Time in seconds between repetitions.
         * @param {number=} maxTimes The maximum number of repetitions. When
         * missing it repeats until cancelled.
         * @return {repeaterType} A configuration to repeat scheduled actions.
         *
         * @memberof! module:caf_delay/proxy_delay#
         * @alias newRepeater
         */
        that.newRepeater = function(interval, maxTimes) {
            const repeater = {interval};
            if ((typeof maxTimes === 'number') && (maxTimes > 0)) {
                repeater.maxTimes = maxTimes;
            }
            return repeater;
        };

        /**
         * Queues a method to be invoked sometime in the future.
         *
         *                    **WARNING**
         * There are no authorization checks for delayed methods. If
         * a client can choose the method name, it effectively has ownership of
         * this CA. Therefore, validate inputs before calling `schedule`, or
         * hardwire the method name in the CA code...
         *
         * Method execution is best effort. A method could execute multiple
         * times, or be delayed for an arbitrary amount of time.
         *
         * Use the unique id as an argument to the method to filter duplicates,
         * if at-most-once semantics is needed, or to track that it has been
         * executed. See `addId` below.
         *
         * @param {Number} when A date in milliseconds from 1970 UTC when this
         * methods executes.
         * @param {string} method The name of the method to execute.
         * @param {Array.<jsonType>} args An array with the arguments. They
         * should be JSON serializable.
         * @param {repeaterType=} repeater A configuration to repeat the action.
         * When missing, the action  is done just once.
         * @param {boolean=} addId True if we add the id as the last argument
         * to the method.
         *
         * @return {string} A unique id for this scheduled method.
         *
         * @memberof! module:caf_delay/proxy_delay#
         * @alias schedule
         */
        that.schedule = function(when, method, args, repeater, addId) {
            return $._.schedule(when, method, args, repeater, addId);
        };

        /**
         * Queues a method to be invoked sometime in the future.
         *
         * Similar to `schedule()` but using an offset in seconds from the
         * current time.
         *
         *                    **WARNING**
         * There are no authorization checks for delayed methods. If
         * a client can choose the method name, it effectively has ownership of
         * this CA. Therefore, validate inputs before calling `schedule`, or
         * hardwire the method name in the CA code...
         *
         * Method execution is best effort. A method could execute multiple
         * times, or be delayed for an arbitrary amount of time.
         *
         * Use the unique id as an argument to the method to filter duplicates,
         * if at-most-once semantics is needed, or to track that it has been
         * executed. See `addId` below.
         *
         * @param {Number} offset The number of seconds to wait for the method
         * execution.
         * @param {string} method The name of the method to execute.
         * @param {Array.<jsonType>} args An array with the arguments. They
         * should be JSON serializable.
         * @param {repeaterType=} repeater A configuration to repeat the action.
         * When missing, the action is done just once.
         * @param {boolean=} addId True if we add the id as the last argument
         * to the method.
         *
         * @return {string} A unique id for this scheduled method.
         *
         * @memberof! module:caf_delay/proxy_delay#
         * @alias scheduleWithOffset
         */
        that.scheduleWithOffset = function(offset, method, args, repeater,
                                           addId) {
            const when = Date.now() + 1000*offset;
            return $._.schedule(when, method, args, repeater, addId);
        };

        /**
         * Returns a description of pending methods.
         *
         * @return {Object<string, pendingMethodType>} A description of the
         * pending methods. Keys are the methods unique ids.
         *
         * @memberof! module:caf_delay/proxy_delay#
         * @alias getPending
         */
        that.getPending = function() {
            return $._.getPending();
        };

        /**
         * Stops a future method executing.
         *
         * @param {string} id A unique id for the cancelled method.
         *
         * @memberof! module:caf_delay/proxy_delay#
         * @alias cancel
         */
        that.cancel = function(id) {
            return $._.cancel(id);
        };

        Object.freeze(that);

        return [null, that];
    } catch (err) {
        return [err];
    }
};
