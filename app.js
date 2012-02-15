var mdns = require('mdns');

var sbrowser = mdns.browseThemAll();

sbrowser.on('serviceUp', function (s) {
  var b = mdns.createBrowser(mdns[s.type.protocol](s.type.name));
  b.on('serviceUp', logPoint);
  b.start();
});

sbrowser.start();

var logPoint = function (p) {
  console.log(p.name);
  console.log(p.addresses[0]);
  console.log(p.host.grey);
}
