var EventEmitter = require('events').EventEmitter;

/**
 * Applies chuckt event functionality to the given socket connection
 *
 * A listener is added to the connection's "data" event that passes the received
 * message to chuckt.process().
 *
 * @constructor
 */
exports.ChuckT = ChuckT = function(connection){
  this.conn = connection;

  var that = this;
  this.conn.on('data', function(data){
    that.process.call(that, data);
  });
};

// inherit from EventEmitter; allow access to original emit()
ChuckT.prototype.__proto__ = EventEmitter.prototype;
ChuckT.prototype.$emit = EventEmitter.prototype.emit;

/**
 * Emits an event that proxies through to the client connection
 *
 * Any additional arguments are passed as arguments for the event.
 *
 * Usage:
 *  chuckt.emit('my-custom-event', 'foo', 'bar');
 *  sends: {"chuckt":{"event":"my-custom-event","args":["foo","bar"]}}
 *
 * @param event
 * @return {*}
 */
ChuckT.prototype.emit = function(event){
  var args = Array.prototype.slice.call(arguments);
  if (event === 'newListener') {
    return this.$emit.apply(this, args);
  }
  var message = this.serialize({ event: event, args: args.slice(1) });
  return this.conn.write(message);
};

/**
 * Serializes the given data into json string with the chuckt prefix
 *
 * Usage:
 *  chuckt.serialize({event:'my-custom-event', args:['foo', 'bar']});
 *  returns: {"chuckt":{"event":"my-custom-event","args":["foo","bar"]}}
 *
 * @param data
 * @return {*}
 */
ChuckT.prototype.serialize = function(data) {
  return JSON.stringify({ chuckt: data });
};

/**
 * Processes the given message string
 *
 * If the message string is a json encoded containing a property named
 * "chuckt", then the value of that property is processes as a chuckt event.
 *
 * @param message
 */
ChuckT.prototype.process = function(message){
  var parsed = JSON.parse(message);

  // don't handle non-chuckt messages
  if (typeof parsed.chuckt !== 'object') return;
  var chuckt = parsed.chuckt;

  var args = [chuckt.event];
  if (typeof chuckt.args === 'object') {
    for (var i in chuckt.args) {
      args.push(chuckt.args[i]);
    }
  }
  if (typeof chuckt.callbackid !== 'undefined') {
    var conn = this.conn;
    var msg = this.serialize({ callbackid: chuckt.callbackid, args: args.slice(1) });
    args.push(function(){
      return conn.write(msg);
    });
  }

  this.$emit.apply(this, args);
};
