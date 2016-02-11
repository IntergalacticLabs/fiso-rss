'use strict';
var sqlite3 = require('sqlite3')
var db = new sqlite3.Database('podcast.db')
var upserter = require('./upsert')

// Just run "node db" to initialize the database
if (!module.parent) {
  db.run(`create table if not exists episode_tbl (
    guid text not null primary key,
    title text,
    link text,
    description text,
    pubdate text,
    enclosure_url text,
    enclosure_length int,
    enclusure_type text,
    subtitle text,
    image text
  )`, (e) => {
    console.log(e);
    console.log('database initialized')
  });
}

db.upsert_episode = upserter({
  table: 'episode_tbl',
  key: 'guid',
  db: db
})

module.exports = db;
