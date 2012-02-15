var mdns = require('mdns');

var Buzz = function () {
  this.clients = {};
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
    console.log(cli);
    if (cli.port == 7331) {
      if (!self.clients[cli.addresses[0]]) {
        console.log('up: ' + cli.addresses[0]);

        // TODO: abstract
        var tempClient = {};
        tempClient.name = cli.name;
        tempClient.ip = cli.addresses[0];
        tempClient.host = cli.host;
      } else {
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

var buzz = new Buzz();

buzz.refreshClients();
buzz.monitorClients();

var args = process.argv.splice(2);

buzz.broadcastClient(args[0]);
