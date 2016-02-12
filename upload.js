var aws = require('aws-sdk')
var http = require('http')
var https = require('https')

var BUCKET = 'fiso-podcast'
var s3 = new aws.S3({
  params: {
    Bucket: BUCKET
  }
})


// url like http://spirit.as.utexas.edu/~fiso/telecon/Zuniga_2-10-16/Zuniga_2-10-16.pdf
module.exports = function(url, key, callback) {
  var total;
  var protocol = url.indexOf('https') === 0 ? https : http;
  protocol.get(url, function(stream) {
    var options = {
      Bucket: BUCKET,
      ACL: 'public-read',
      Key: key,
      Body: stream
    };

    if (url.match(/\.mp3$/i)) {
      options.ContentType = 'audio/mpeg'
    }

    s3.upload(options)
    .on('httpUploadProgress', function(evt) {
      console.log(evt);
      total = evt.total;
    })
    .send(function(err, data) {
      data = data || {};
      data.length = total;
      console.log(err, data)
      callback(err, data)
    });
  })
}

if (!module.parent) {
  module.exports('http://spirit.as.utexas.edu/%7Efiso/telecon/Boston_1-6-16/Boston.mp3', 'Boston_1-6-16/Boston.mp3', console.log.bind(console))
}
