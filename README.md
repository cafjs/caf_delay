# Caf.js

Co-design cloud assistants with your web app and IoT devices.

See https://www.cafjs.com

## Caf.js library to delay method invocation

[![Build Status](https://github.com/cafjs/caf_delay/actions/workflows/push.yml/badge.svg)](https://github.com/cafjs/caf_delay/actions/workflows/push.yml)

Queues methods to be executed some time in the future.

Sets periodic method invocations that could continue until cancelled, or when they reach a fixed number of completions.

## API

See {@link module:caf_delay/proxy_delay}.

An example that calls the method `__ca_increment__` periodically (just for `nTimes`).

```
exports.methods = {
    ...
    async scheduleRepeat(delay, delta, interval, nTimes) {
        const repeater = this.$.delay.newRepeater(interval, nTimes);
        const id = this.$.delay.scheduleWithOffset(
            delay, '__ca_increment__', [delta], repeater, true
        );
        return [null, id];
    },
    async cancel(id) {
        this.$.delay.cancel(id);
        return this.getState();
    },
    async getPending() {
        return [null, this.$.delay.getPending()];
    }
    async __ca_increment__(delta, id) {
        this.$.log.debug(`inc delta:${delta} id:${id}`);
        this.state.counter = this.state.counter + delta;
        return [];
    },
    ...
```

The arguments `delay` and `interval` are in seconds, and they represent the time before the first `__ca_increment__()` invocation, and the time between invocations after that. Instead of a time offset, we can also trigger actions with UTC time with  `schedule()`.

The last `true` argument to `scheduleWithOffset()` ensures that an id identifying the scheduled task is the last argument to `__ca_increment__`. This id was also returned by `scheduleWithOffset()`, and can be used to cancel pending actions.

To query the status of scheduled actions for this CA use `getPending()`.

There are no guarantees that methods execute exactly the required number of times, or timely. Really late tasks can be ignored by setting `ignoreAfterInSec` (defaults to 24 hours), otherwise they will eventually execute at least once.

The internal cron checks for ready tasks every `delayIntervalCheckInSec`, and this defaults to once a second, setting a practical minimum for time resolution.

## Configuration

### framework.json

See {@link module:caf_delay/plug_delay}

### ca.json

See {@link module:caf_delay/plug_ca_delay}
