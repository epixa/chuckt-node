# ChuckT node module

ChuckT-node is a node server component for triggering and/or listening to
events over the [SockJS](https://github.com/sockjs/sockjs-node) websocket
API. This client is intended to be used in conjunction with the client-side
ChuckT JavaScript library:

 * [chuckt](https://github.com/epixa/chuckt)

# Usage:

### Initialization

ChuckT instances require a socket connection:

```javascript
var sockjs = require('sockjs');
var chuckt = require('chuckt');

var sock = sockjs.createServer();
sock.on('connection', function(conn) {
  var chuckt = new ChuckT(conn);
  // ... do chuckt stuff like add listeners or emit events
```

### Emit an event to the frontend

```javascript
chuckt.emit('some-event', 'bar');
```

### Listen to events fired from the frontend

Any number of arguments and even a callback can be passed with events. The
callback is essentially just a proxy to a callback that is defined (and
executed) on the frontend:

```javascript
chuckt.on('another-event', function(arg1, arg2, callback) {
  // ... do stuff with arguments
  callback();
});
```

Some events may only pass a callback:

```javascript
chuckt.on('another-event-2', function(callback) {
  // ... do stuff without arguments
  callback();
});
```

You may want to pass arguments back to the frontend's callback:

```javascript
chuckt.on('another-event-3', function(callback) {
  // ... do stuff without arguments
  callback('dear frontend', 'you may find these arguments compelling');
});
```

And sometimes, your event may not come with any arguments nor a callback:

```javascript
chuckt.on('another-event-4', function() {
  // ... do stuff without ever acknowledging receipt
});
```
