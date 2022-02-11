
/**
 * @global
 * @typedef {Object | Array | string | number | null | boolean} jsonType
 *
 */

/**
 * @global
 * @typedef {Object} repeaterType
 * @property {Number} interval Time in seconds between repetitions.
 * @property {Number=} completed The number of times an action was executed.
 * @property {Number=} whenLastCompleted A date in msec after 1970 UTC when
 * this action was last executed.
 * @property {Number=} maxTimes The maximum number of repetitions. When
 * missing it repeats until cancelled.
 */

/**
 * @global
 * @typedef {Object} scheduledTaskType
 * @property {String} id A unique identifier for this task.
 * @property {Number} when A date in msec since 1970 UTC when the task executes.
 * @property {function(string)} handlerF The handler to trigger the task.
 */

/**
 * @global
 * @typedef {Object} pendingMethodType
 * @property {String} id A unique identifier for this method.
 * @property {Number} when A date in msec since 1970 when the method executes.
 * @property {String} method  The method name.
 * @property {repeaterType|null} repeater Configuration to repeat the method
 * call. When `null` it does not repeat.
 * @property {Array.<jsonType>} args The method arguments.
 */
