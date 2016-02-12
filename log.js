var fs = require('fs')

fs.writeFileSync('log.txt', new Date())
console.log('wrote', new Date())
