#!/usr/bin/env node
var net = require('net');

var args = process.argv.splice(2);

var message = '';

// collect args if more than two
for (var i in args) {
  if (i >= 1) {
    if (message != '') message += ' ';
    message += args[i];
  }
}

console.log(message);

var client = net.connect(7331, function() {
});

client.setEncoding('utf-8');

client.once('data', function (data) {
  data = data.toString().replace(/\r/g, '').replace(/\n/g);
  if (data == 'notfound') {
    console.log('user not found.');
  } else {
    var host = data;
    console.log(host);

    // ask whoami
    client.once('data', function (data) {
      var name = data;
      client.end();

      // have client, will ping with message
      var remoteClient = net.connect(7331, host, function() {
      });

      remoteClient.write('message////' + name + '////' + args[1]);

      remoteClient.end();
    });

    client.write('whoami');
  }
});

// get data on a specific client name
client.write('find////' + args[0]);

