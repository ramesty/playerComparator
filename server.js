const express = require('express');
const bodyParser = require('body-parser');
const https = require('https');
const fs = require('fs');

//app.use is needed to parse through the html form sent
//to the server whenever players are input
var app = express();
app.use(bodyParser.urlencoded({
  extended: true
}));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.set('views', __dirname + '/views');

app.use(express.static('.'))

//labels for stats
const categories = ['PLA', 'G', 'PTS', 'TRB', 'AST', 'FG%', 'FG3%', 'FT%', 'eFG%'];
var player1 = '';
var player2 = '';

app.get("/", function(req, res) {
  res.sendFile(__dirname + "/views/index.html");
})
//
app.post("/", function(req, res) {

  player1 = req.body.player1.toUpperCase();
  player2 = req.body.player2.toUpperCase();

  var player1Formatted = checkInput(player1);
  var player2Formatted = checkInput(player2);

  url1 = "https://www.basketball-reference.com/players/" + player1Formatted + "01.html";
  url2 = "https://www.basketball-reference.com/players/" + player2Formatted + "01.html";

  // https.get(url, function(response){
  //   response.on('data', function(d){
  //     console.log(response.html.body);
  //   })
  // })

  //Why cant I use body parser to use the dom model within the
  //basketball reference website(Use dom tree)

  var stats = [];
  var picture = [];

  stats.push(categories);
  get(url1, stats, picture, function(status, stats){
    if(status === 'success'){
      return;
    }
  })
  get(url2, stats, picture, function(status, stats){
    if(status === 'success'){
      orderStats(stats, picture, res);
    }
  })
})

//I believe this connects our server to a local port?
app.listen(8080, function() {
  console.log("Server listening on port 8080");
});

//Functionality of site

function get(url, stats, picture, callback){
  //This makes a request to basketball reference site to recieve the Stats
  //of the specified players
  var printout = "";

  https.get(url, function(response) {
    //console.log(res.statusCode);
    response.setEncoding('utf8'); //converts website data into string format

    //Everytime data is recieved from the site, the print out string
    //is updated
    response.on('data', function(d) {
      printout += d;
    });
    //Once all the data is collected from the site, we use a bit of regex
    //to pick out the data we want, which is the html table
    response.on('end', () => {
      let regex = /p1(.|\n)*?p3/;
      var allResults = regex.exec(printout);
      var result = allResults[0];
      stats.push(parseData(result));
      picture.push(playerPic(printout));
      callback('success', stats);
    });
  }).on('error', function(err) {
    callback('error', err);
  });
}

//creates a 2D array with all the player data we need as well as its label
function parseData(data) {
  //More regex to isolate the specific data we need in each category of the table
  let regex = /<p>.+<\/p>/gm;
  var allResults = data.match(regex);

  if(allResults.length === 16){
    var stats = current(allResults);
  }else{
    var stats = legend(allResults);
  }
  return stats;
}

//Populates data for current players, includes current season as well
function current(allResults) {
  //for loop that populates our 2d array with regex matches
  var stats = [];

  var j = 0;
  for (var i = 1; i < 17; i += 2) {
    stats.push(allResults[i].replace(/(<([^>]+)>)/gi, "")); //, allResults[i + 1].replace(/(<([^>]+)>)/gi, "")
  }
  return stats;
}

//populates data for retired players, does not include current season
function legend(allResults) {
  //for loop that populates our 2d array with regex matches
  var stats = [];

  for (var i = 0; i < 8; i++) {
    stats.push(allResults[i].replace(/(<([^>]+)>)/gi, ""));
  }
  return stats;
}

//retrieves the web address to where the player pic is stored
function playerPic(data) {
  let regex = /contentUrl.+/gm;
  var pictureLink = data.match(regex);

  let reg = /https.+\.jpg/gm;
  var pic = pictureLink[0].match(reg);
  return pic;
}

//Not complete, still needs to check whether the user input is correct
//However it formats a useable format for the name to use in our url
function checkInput(input) {
  input = input.toLowerCase();
  var names = input.split(" ");
  fname = names[0].substring(0, 2);
  lname = names[1].substring(0, 5);
  fletter = lname.charAt(0);
  return (fletter + "/" + lname + fname).toLowerCase();
}

function orderStats(stats, picture, res) {

  writeToHTML(stats, picture, res);

  // console.log(stats);
  // console.log(stats[1] + " " + picture[1]);
  // res.send('cheese');

}


function writeToHTML(stats, picture, res) {

  var picture1 = picture[0];
  var picture2 = picture[1];

  stats[0].unshift(player1.substr(0, 3));
  stats[1].unshift(player2.substr(0, 3));

  res.render("result.ejs", {
    player1: player1,
    player2: player2,
    picture1: picture1,
    picture2: picture2,
    stats: stats
    // pivture2: pictures[1],
    // stats2: stats[1]
  })
}
