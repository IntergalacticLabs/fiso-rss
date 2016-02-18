var aws = require('aws-sdk')
var fs = require('fs')

var BUCKET = 'fiso-podcast'
var s3 = new aws.S3({
  params: {
    Bucket: BUCKET
  }
})

var keys = fs.readFileSync('./keys.txt', 'utf8').split('\n')

keys.map(function(k) {
  s3.copyObject({
    Bucket: BUCKET,
    CopySource: BUCKET + '/' + k,
    Key: k,
    ACL: 'public-read',
    StorageClass: 'STANDARD_IA'
  }, function(e, data) {
    if (e) { console.error(e) }
    console.log(data);
  })
})
