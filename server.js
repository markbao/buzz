var mdns = require('mdns');

var Buzz = function () {
  this.clients = [];
};

Buzz.prototype.refreshClients = function () {
  var self = this;

  self.clients = [];
  self.sbrowser = mdns.browseThemAll();

  self.sbrowser.on('serviceUp', function (s) {
    var browser = mdns.createBrowser(mdns[s.type.protocol](s.type.name));
   
    browser.on('serviceUp', function (cli) {
      if (cli.port != 7331) {
        var tempClient = {};
        tempClient.name = cli.name;
        tempClient.ip = cli.addresses[0];
        tempClient.host = cli.host;
        self.clients.push(tempClient);
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

var buzz = new Buzz();

buzz.refreshClients();
