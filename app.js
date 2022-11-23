const http = require('https');
const fs = require('fs');

const req = http.request('https://www.basketball-reference.com/players/j/jamesle01.html', res => {
	const data = [];

	res.on('data', _ => data.push(_))
	res.on('end', () => console.log(data.join()))


  fs.writeFile(__dirname + "/cheese2.txt", data, err => {
    if(err){
      console.error(err);
      return;
    }
  })

});

req.end();
