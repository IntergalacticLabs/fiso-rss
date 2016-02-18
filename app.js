'use strict';
var app = require('koat')
var star = require('thunkify-wrap').genify;
var feed = star(require('./feed'))
var fork = require('child_process').fork;

app.get('/fiso/rss', function *() {
  this.set('Cache-Control', 'no-store, no-cache, must-revalidate')
  this.set('Pragma', 'no-cache')
  this.set('Expires', 0)
  this.body = yield feed()
  this.type = 'text/xml; charset=utf-8'
})

app.get('/fiso/scrape', function *() {
  fork('./scrape.js')
  this.body = 'Scraping! 🍻'
})

// oh hey this is also the cron scheduler for scraping
var cron = require('node-cron')
cron.schedule('0 19 * * 2', function() {
  fork('./scrape.js');
})

app.listen(5330)
console.log('listening on port 5330')
