var db = require('./db')
var RSS = require('rss')
var _ = require('lodash')

var feed = {
  title: 'Future In-Space Operations (FISO) Working Group Presentations',
  description: 'Weekly presentations from NASA, industry, and academic leaders in the aerospace field.',
  feed_url: 'http://intergalacticlabs.co/podcasts/fiso/rss',
  site_url: 'http://spirit.as.utexas.edu/~fiso/archivelist.htm',
  image_url: 'http://s3.amazonaws.com/fiso-podcast/logo-min.png',
  managingEditor: 'peter.m.brandt@gmail.com (Peter Brandt)',
  webMaster: 'peter.m.brandt@gmail.com (Peter Brandt)',
  categories: ['Science & Medicine', 'Natural Sciences'],
  language: 'en-us',
  custom_namespaces: {'itunes': 'http://www.itunes.com/dtds/podcast-1.0.dtd'},
  custom_elements: [
      {'itunes:subtitle': 'Weekly presentations from NASA, industry, and academic leaders in the aerospace field.'},
      {'itunes:author': 'FISO Working Group'},
      {'itunes:summary': 'The FISO (Future In-Space Operations) Telecon Series is a weekly meeting that brings space technology, engineering, and science to the widespread space community with presentations from leaders in their field.  Source: http://spirit.as.utexas.edu/~fiso/archivelist.htm'},
      {'itunes:owner': [
        {'itunes:name': 'Peter Brandt'},
        {'itunes:email': 'peter.m.brandt@gmail.com'}
      ]},
      {'itunes:image': {
        _attr: {
          href: 'http://s3.amazonaws.com/fiso-podcast/logo-min.png'
        }
      }},
      {'itunes:category': [
        {_attr: {
          text: 'Science & Medicine'
        }},
        {'itunes:category': {
          _attr: {
            text: 'Natural Sciences'
          }
        }}
      ]},
      {'itunes:explicit': 'no'}
    ]
};

//http://www.apple.com/itunes/podcasts/specs.html
module.exports = function (cb) {
  db.all(`select * from episode_tbl
    where enclosure_url is not null`, (e, episodes) => {
      if (e) {
        console.error(e);
        return cb(e)
      }
      var rss = new RSS(feed)
      episodes.map(function(item) {
        // check for bad characters
        item.title = item.title.replace(/[^\u0000-\u007F]/g, '');

        var options = {
          url: item.link,
          guid: item.link,
          date: item.pubdate,
          enclosure: {
            url: item.enclosure_url.replace('https', 'http'),
            size: item.enclosure_length,
            type: item.enclosure_type
          },
          custom_elements: [
            {'itunes:author': 'Peter Brandt'},
            {'itunes:subtitle': item.title},
            {'itunes:image': {
              _attr: {
                href: 'http://s3.amazonaws.com/fiso-podcast/logo-min.png'
              }
            }},
            // {'itunes:duration': '7:04'}
          ]
        };

        rss.item(_.merge({}, item, options))
      });
      var xml = rss.xml({indent: true});
      cb(null, xml);
    })
}

function item(episode) {
  return `    <item>
      <guid isPermaLink="false">${episode.enclosure_url}</guid>
      <title>${episode.title}</title>
      <link>${episode.link}</link>
      <description>${episode.description}</description>
      <pubDate>${episode.pubdate}</pubDate>
      <enclosure url="${episode.enclosure_url}" length="${episode.enclosure_length}" type="${episode.enclosure_type}"/>
      <itunes:subtitle>${episode.title}</itunes:subtitle>
      <itunes:summary>${episode.description}</itunes:summary>
      <itunes:image href="${episode.image}" />
    </item>`
}

//
function rss(items) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<rss xmlns:atom="http://www.w3.org/2005/Atom" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" version="2.0">
<channel>
    <title>Future In-Space Operations (FISO) Working Group Presentations</title>
    <link>http://spirit.as.utexas.edu/~fiso/archivelist.htm</link>
    <description>Weekly presentations from NASA, industry, and academic leaders in the aerospace field.</description>
    <managingEditor>peter.m.brandt@gmail.com (Peter Brandt)</managingEditor>
    <generator>Node.js</generator>
    <language>en-us</language>
    <itunes:new-feed-url>http://intergalacticlabs.co/podcasts/fiso/rss</itunes:new-feed-url>
    <itunes:author>FISO Working Group</itunes:author>
    <itunes:subtitle>Weekly presentations from NASA, industry, and academic leaders in the aerospace field.</itunes:subtitle>
    <itunes:summary>The FISO (Future In-Space Operations) Telecon Series is a weekly meeting that brings space technology, engineering, and science to the widespread space community with presentations from leaders in their field.  Source: http://spirit.as.utexas.edu/~fiso/archivelist.htm</itunes:summary>
    <itunes:owner>
        <itunes:name>Peter Brandt</itunes:name>
        <itunes:email>peter.m.brandt@gmail.com</itunes:email>
    </itunes:owner>
    <itunes:image href="https://s3.amazonaws.com/fiso-podcast/logo-min.png"/>
    <itunes:category text="Science &amp; Medicine">
    <itunes:category text="Natural Sciences"/>
    </itunes:category>
    <itunes:explicit>no</itunes:explicit>
    <atom:link href="http://intergalacticlabs.co/podcasts/fiso/rss" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;
}

if (!module.parent) {
  module.exports(function(e, r) {
    console.log(e);
    console.log(r)
  })
}
