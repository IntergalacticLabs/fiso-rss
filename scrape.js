var db = require('./db')
var scrapequest = require('scrapequest')
var upload = require('./upload')

scrapequest.interval = 1 * 60 * 1000;

scrapequest.scrape('http://spirit.as.utexas.edu/~fiso/archivelist.htm', (e, $) => {
  if (e) { return console.error(e) }

  var links = $('a').get().map((a) => {
    return {
      guid: $(a).attr('href').split('/').slice(-2)[0], // Zuniga_2-10-16
      link: $(a).attr('href'), // url like http://spirit.as.utexas.edu/~fiso/telecon/Zuniga_2-10-16/
      title: $(a).text().replace(/\"/g, '').replace(/\s/g, ' ').trim()
    }
  }).filter((l) => {
    return l.title && l.link && l.link.indexOf('fiso/telecon') >=0;
  }).map((ep) => {
    db.upsert_episode(ep, function(e, episode) {
      if (!episode.enclosure_url) {
        scrape_episode(episode)
      }
    })
  })

  console.log(links.length)
  console.log('done');
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
    console.log(links);

    episode.subtitle = episode.guid;
    episode.description = episode.title + '\n' + episode.guid + '\n' + episode.link;
    episode.image = 'https://s3.amazonaws.com/fiso-podcast/logo-min.png';
    episode.pubdate = (new Date(episode.guid.match(/(\d+-\d+-\d+)/)[1])).toString();


    // upload the links
    links.map((a) => {
      var key = episode.guid + '/' + a.split('/').pop();
      setTimeout(() => {
        console.log('uploading ' + key + ' from ' + a)
        upload(a, key, function(e, file) {
          console.log('uploaded ' + file.Location)
          if (a.match(/\.mp3$/)) {
            episode.enclosure_url = file.Location;
            episode.enclosure_length = file.length;
            episode.enclosure_type = 'audio/mpeg'
          } else {
            episode.description += '\n' + file.Location;
          }
          db.upsert_episode(episode, console.log.bind(console))
        })
      },  Math.random() * .5 * 60 * 1000)
    })
  })
}
