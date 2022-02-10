
/**
 * @global
 * @typedef {Object | Array | string | number | null | boolean} jsonType
 *
 */

/**
 * @global
 * @typedef {Object} scheduledTaskType
 * @property {String} id A unique identifier for this task.
 * @property {Number} when A date in msec since 1970 when the task executes.
 * @property {function(string)} handlerF The handler to trigger the task.
 */

/**
 * @global
 * @typedef {Object} pendingMethodType
 * @property {String} id A unique identifier for this method.
 * @property {Number} when A date in msec since 1970 when the method executes.
 * @property {String} method  The method name.
 * @property {Array.<jsonType>} args The method arguments.
 */
