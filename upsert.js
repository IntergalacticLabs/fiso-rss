'use strict';

function keys (obj) {
  return Object.keys(obj).filter((k) => obj.hasOwnProperty(k)).sort();
}

module.exports = function(opts) {
  if (!opts.table) {
    throw new Error('must specify options.table')
  }
  if (!opts.key) {
    throw new Error('must specify options.key (usually the name of the primary key column)')
  }
  if (!opts.db) {
    throw new Error('must pass in options.db, the db you created with "let db = new sqlite3.Database()"')
  }
  var db = opts.db;

  return function (obj, cb) {
    if (typeof cb === 'undefined') {
      cb = function() {};
    }

    if (!obj[opts.key]) {
      return cb(new Error(`cannot upsert object without property "${opts.key}"`))
    }


    let columns = keys(obj).join(', ')
    let $columns = keys(obj).map((k) => '$' + k).join(',\n')
    let values = keys(obj).reduce((o, k) => {o['$' + k] = obj[k]; return o}, {})
    db.serialize(function() {
      keys(obj).map(function(column){
        db.run(`update ${opts.table} set ${column} = $val where ${opts.key} = $id`, {$val: obj[column], $id: obj[opts.key]})
      })
      db.run(`insert into ${opts.table} (${columns}) select ${$columns} where changes() = 0`, values)
    })
  }
}

if (!module.parent) {
  var log = console.log.bind(console)
  var sql = require('sqlite3')
  var db = new sql.Database('test.db')

  var obj_1 = {id: 'a'}
  var obj_2 = {id: 'a', text: 'b'}

  db.serialize(function() {
    db.run('create table if not exists s (id int not null primary key, text text);')
    var upsert = module.exports({
      table: 's',
      key: 'id',
      db: db
    })
    upsert(obj_1, log);
    upsert(obj_2, log);
    upsert({text: 'asdfasf'}, log);
  })
}
