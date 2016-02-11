var db = require('./db')

//http://www.apple.com/itunes/podcasts/specs.html
module.exports = function (cb) {
  db.all(`select * from episode_tbl
    where enclosure_url is not null`, (e, episodes) => {
      if (e) {
        console.error(e);
        return cb(e)
      }
      var items = episodes.map(item).join('\n');
      var feed = rss(items);
      cb(null, feed)
    })
}

function item(episode) {
  return `    <item>
      <guid isPermaLink="false">${episode.guid}</guid>
      <title>${episode.title}</title>
      <link>${episode.link}</link>
      <description>${episode.description}</description>
      <pubDate>${episode.pubdate}</pubDate>
      <enclosure url="${episode.enclosure_url}" length="${episode.enclosure_length}" type="${episode.enclusure_type}"/>
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
    <itunes:new-feed-url>http://intergalacticlabs.co/podcasts/fiso-rss.xml</itunes:new-feed-url>
    <itunes:author>FISO Working Group</itunes:author>
    <itunes:subtitle>Weekly presentations from NASA, industry, and academic leaders in the aerospace field.</itunes:subtitle>
    <itunes:summary>The FISO (Future In-Space Operations) Telecon Series is a weekly meeting that brings space technology, engineering, and science to the widespread space community with presentations from leaders in their field.</itunes:summary>
    <itunes:owner>
        <itunes:name>Peter Brandt</itunes:name>
        <itunes:email>peter.m.brandt@gmail.com</itunes:email>
    </itunes:owner>
    <itunes:image href="https://planetary.s3.amazonaws.com/assets/images/society/radio/planetary-radio-itunes-logo.png"/>
    <itunes:category text="Science &amp; Medicine">
    <itunes:category text="Natural Sciences"/>
    </itunes:category>
    <itunes:explicit>no</itunes:explicit>
    <atom:link href="http://intergalacticlabs.co/podcasts/fiso-rss.xml" rel="self" type="application/rss+xml"/>
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
