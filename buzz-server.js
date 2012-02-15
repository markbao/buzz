#!/usr/bin/env node
var mdns    = require('mdns'),
    net     = require('net'),
    growler = require('growler');

var Buzz = function () {
  var self = this;

  this.clients = {};

  this.refreshClients();
  this.monitorClients();
  this.setupServer();

  this.growler = new growler.GrowlApplication('buzz'); 
  this.growler.setNotifications({
    'message': {}
  });
  this.growler.register();

  var args = process.argv.splice(2);

  this.name = args[0];

  this.broadcastClient(args[0]);

//  setInterval(function(){console.log(self.clients)}, 1000);
};

Buzz.prototype.refreshClients = function () {
  var self = this;

  self.clients = {};
  self.sbrowser = mdns.browseThemAll();

  self.sbrowser.on('serviceUp', function (s) {
    var browser = mdns.createBrowser(mdns[s.type.protocol](s.type.name));
   
    browser.on('serviceUp', function (cli) {
      if (cli.port == 7331) {
        var tempClient = {};
        tempClient.name = cli.name;
        tempClient.ip = cli.addresses[0];
        tempClient.host = cli.host;
        console.log('up: ' + tempClient.ip);
        self.clients[tempClient.ip] = tempClient;
      }
    });

    browser.start();
  });

  self.sbrowser.start();

  setTimeout(function finishRefreshingClients () {
    self.sbrowser = null;
    console.log(self.clients);
  }, 2000);
}

Buzz.prototype.monitorClients = function () {
  var self = this;

  self.browser = mdns.createBrowser(mdns.tcp('http'));

  self.browser.on('serviceUp', function(cli) {
    if (cli.port == 7331) {
      if (!self.clients[cli.addresses[0]]) {
        console.log('up: ' + cli.addresses[0]);

        // TODO: abstract
        var tempClient = {};
        tempClient.name = cli.name;
        tempClient.ip = cli.addresses[0];
        tempClient.host = cli.host;
      } else {
        console.log('went up, but already discovered');
        self.clients[cli.addresses[0]].name = cli.name;
      }
    }
  });

  self.browser.on('serviceDown', function (cli) {
    console.log('down: ' + cli.name);

    // search for name
    for (var ip in self.clients) {
      if (self.clients[ip].name == cli.name) {
        delete self.clients[ip];
      }
    };
  });

  self.browser.start();
}

Buzz.prototype.broadcastClient = function (name) {
  var self = this;
  self.clientAd = mdns.createAdvertisement(mdns.tcp('http'), 7331, {name: name});
  self.clientAd.start();
}

Buzz.prototype.findClient = function (name) {
  var self = this;
  for (var ip in self.clients) {
    if (self.clients[ip].name == name) {
      return ip;
      break;
    }
  }
}

Buzz.prototype.setupServer = function () {
/*  http.createServer(function (req, res) {
    var req.urlParts = 
  }).listen(7331);*/
  var self = this;

  self.server = net.createServer(function (socket) {
    console.log('TCP - connection');
    socket.setEncoding('utf-8');

    socket.on('data', function (data) {
      data = data.toString().replace(/\r/g, '').replace(/\n/g, '');
      if (data == 'exit') {
        socket.end('goodbye!\n\n');
      } else if (data.indexOf('whoami') > -1) {
        socket.write(self.name);
      } else if (data.indexOf('find////') > -1) {
        // find client request
        socket.write(self.findClient(data.replace('find////','')));
      } else if (data.indexOf('message////') > -1) {
        // message to deliver
        var message = data.replace('message////','');
        var messageSplit = message.split('////');
        console.log(messageSplit[0]);
        console.log(messageSplit[1]);
        var from = messageSplit[0];
        var note = messageSplit[1];
        self.growler.sendNotification('message', {
          title: 'buzz from ' + from,
          text: note
        });
      }
    });
  });

  self.server.listen(7331);
}

var buzz = new Buzz();

process.on('uncaughtException', console.log);
