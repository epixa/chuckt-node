'use strict';

var chucktjs = require('../lib/chuckt')
  , chuckt
  , mockConn;

describe('chuckt.ChuckT', function(){
  beforeEach(function(){
    mockConn = {
      $last: undefined,
      $dataEvent: undefined,
      on: function(name, callback){
        if (name != 'data') return;
        this.$dataEvent = callback;
      },
      write: function(str){
        this.$last = str;
      }
    };
    chuckt = new chucktjs.ChuckT(mockConn);
  });

  it('should register a listener for the "data" event on instantiation', function(){
    expect(typeof mockConn.$dataEvent).toBe('function');
  });

  it('should write to the connection a json string in a chuckt format when an event is emitted', function(){
    chuckt.emit('event with no arguments');
    expect(mockConn.$last).toEqual('{"chuckt":{"event":"event with no arguments","args":[]}}');

    chuckt.emit('event with some string arguments', 'foo', 'bar');
    expect(mockConn.$last).toEqual('{"chuckt":{"event":"event with some string arguments","args":["foo","bar"]}}');

    chuckt.emit('event with some complex arguments', {foo:'bar'}, ['ok', 'go']);
    expect(mockConn.$last).toEqual('{"chuckt":{"event":"event with some complex arguments","args":[{"foo":"bar"},["ok","go"]]}}');
  });

  it('should expose some standard EventEmitter functionality via on() and $emit()', function(){
    // while this is generally already tested by the events module itself, at
    // least some basic testing occurs to help identify any regressions that
    // may be introduced in the way we use the EventEmitter prototype
    var totalArguments = 0;
    chuckt.on('event with a few arguments', function(){
      totalArguments = arguments.length;
    });
    chuckt.$emit('event with a few arguments', 'one', 'two', 'three');
    expect(totalArguments).toEqual(3);
    expect(mockConn.$last).toBe(undefined);
  });

  it('should proxy any emit() of the "newListener" event directly to EventEmitter.prototype.emit', function(){
    var totalArguments = 0;
    chuckt.on('newListener', function(){
      totalArguments = arguments.length;
    });
    chuckt.emit('newListener', 'some event name', function(){});
    expect(totalArguments).toEqual(2);
    expect(mockConn.$last).toBe(undefined);
  });

  it('should intercept chuckt formatted messages to "data" event and fire the appropriate event listeners', function(){
    var totalArguments;
    chuckt.on('some event', function(){
      totalArguments = arguments.length;
    });

    totalArguments = -1;
    mockConn.$dataEvent('{"chuckt":{"event":"some event","args":["one","two"]}}');
    expect(totalArguments).toEqual(2);

    totalArguments = -1;
    mockConn.$dataEvent('{"chuckt":{"event":"some event"}}');
    expect(totalArguments).toEqual(0);
  });

  it('should write to the connection a chuckt callback json string when callback is executed', function(){
    chuckt.on('event with callback', function(callback){
      callback();
    });
    mockConn.$dataEvent('{"chuckt":{"event":"event with callback","callbackid":0}}');
    expect(mockConn.$last).toEqual('{"chuckt":{"callbackid":0,"args":[]}}');

    chuckt.on('event with args and callback', function(foo, bar, callback){
      callback();
    });
    mockConn.$dataEvent('{"chuckt":{"event":"event with args and callback","args":["one","two"],"callbackid":1}}');
    expect(mockConn.$last).toEqual('{"chuckt":{"callbackid":1,"args":[]}}');

    chuckt.on('event with callback with args', function(callback){
      callback('foo', 'bar');
    });
    mockConn.$dataEvent('{"chuckt":{"event":"event with callback with args","callbackid":2}}');
    expect(mockConn.$last).toEqual('{"chuckt":{"callbackid":2,"args":["foo","bar"]}}');
  });
});
