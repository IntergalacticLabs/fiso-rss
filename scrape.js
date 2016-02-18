var db = require('./db')
var scrapequest = require('scrapequest')
var upload = require('./upload')
var cheerio = require('cheerio')
var request = require('request')

var freshScrape = function(url, cb) {
  request(url, function(e, r, b) {
    if (e) {
      return cb(e)
    }
    var $ = cheerio.load(b);
    cb(null, $);
  })
}

freshScrape('http://spirit.as.utexas.edu/~fiso/archivelist.htm', (e, $) => {
  if (e) { return console.error(e) }

  var links = $('a').get().map((a) => {
    var episode = {
      guid: $(a).attr('href').split('/').slice(-2)[0], // Zuniga_2-10-16
      link: $(a).attr('href'), // url like http://spirit.as.utexas.edu/~fiso/telecon/Zuniga_2-10-16/
      title: $(a).text().replace(/\"/g, '').replace(/\s/g, ' ').trim()
    }

    // attempt to get the speaker
    var speaker = episode.guid.split('_')[0];
    episode.speaker = $($(`span:contains(${speaker})`)[0]).text().replace(/\s+/g, ' ').replace(' ,', ',').trim()
    var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

    months.map(function(month) {
      episode.speaker = episode.speaker.split(month)[0].trim();
    })
    return episode;
  }).filter((l) => {
    return l.title && l.link && l.link.indexOf('fiso/telecon') >=0;
  }).map((ep) => {
    db.all(`select * from episode_tbl where guid = ?`, ep.guid, function(err, rows) {
      if (err) { return console.error(err) }
      if (rows.length === 0) {
        db.upsert_episode(ep, function(e, episode) {
          if (!episode.enclosure_url) {
            scrape_episode(episode)
          }
        })
      }
    })
  })
})


function scrape_episode(episode) {
  scrapequest.scrape(episode.link, function(e, $) {
    var links = $('a').get().map((a) => {
      return $(a).attr('href')
    }).filter((a) => {
      return a.indexOf('.') > 0; //make sure we only catch files, not parent dirs
    }).map((a) => {
      if (a.indexOf('http') === 0) {
        return a;
      } else {
        return episode.link + a;
      }
    })

    var awskeys = links.map(function(l) {
      return 'https://s3.amazonaws.com/fiso-podcast/' + episode.link.split('/').slice(-2)[0] + '/' + l.split('/').slice(-1)[0]
    })

    episode.subtitle = episode.guid;
    episode.image = 'https://s3.amazonaws.com/fiso-podcast/logo-min.png';
    episode.pubdate = (new Date(episode.guid.match(/(\d+-\d+-\d+)/)[1])).toString();

    var desc = [
      '<h3>' + episode.speaker + '</h3>',
      '<ul>'
    ]

    desc.push('<li><a href="' + episode.link + '">' + decodeURIComponent(episode.link) + '</a></li>')

    awskeys.map(function(l) {
      l = decodeURIComponent(l);
      var lname = l.split('/').slice(-1)[0];
      desc.push('<li><a href="' + l + '">' + l + '</a></li>')
    })

    desc.push('</ul>')
    episode.description = desc.join('\n')

    db.upsert_episode(episode);

    // upload the links
    links.map((a, i) => {
      var key = episode.guid + '/' + a.split('/').pop();
      setTimeout(() => {
        console.log('uploading ' + key + ' from ' + a)
        upload(a, key, function(e, file) {
          console.log('uploaded ' + file.Location)
          if (a.match(/\.mp3$/)) {
            episode.enclosure_url = file.Location;
            episode.enclosure_length = file.length;
            episode.enclosure_type = 'audio/mpeg';
            db.upsert_episode(episode, console.log.bind(console))
          }
        })
      },  i * 60 * 1000)
    })
  })
}
