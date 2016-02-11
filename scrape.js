var db = require('./db')
var scrapequest = require('scrapequest')

scrapequest.scrape('http://spirit.as.utexas.edu/~fiso/archivelist.htm', (e, $) => {
  if (e) { return console.error(e) }

  var links = $('a').get().map((a) => {
    return {
      guid: $(a).attr('href'),
      link: $(a).attr('href'),
      title: $(a).text().replace(/\"/g, '').replace(/\s/g, ' ').trim()
    }
  }).filter((l) => {
    return l.title && l.link && l.link.indexOf('fiso/telecon') >=0;
  }).map((ep) => {
    db.upsert_episode(ep, console.log.bind(console))
  })

  console.log(links.length)
  console.log('done');
})
