'use strict';
var app = require('koat')
var star = require('thunkify-wrap').genify;
var feed = star(require('./feed'))
var fork = require('child_process').fork;

app.get('/fiso/rss', function *() {
  this.body = yield feed()
  this.type = 'text/xml; charset=utf-8'
})

app.get('/fiso/scrape', function *() {
  fork('./scrape.js')
  this.body = 'Scraping! 🍻'
})

// oh hey this is also the cron scheduler for scraping
var cron = require('node-cron')
cron.schedule('0 4-7 * * 2', function() {
  fork('./scrape.js');
})

app.listen(5330)
console.log('listening on port 5330')
