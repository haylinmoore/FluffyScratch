const express = require('express')
const app = express()
const port = 3000
const axios = require('axios');

var longestQueue = 0;
var reqsPerSecond = 0;
var queue = [];
var notifications = Object.create(null);

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

app.get('/', (req, res) => res.send('If you do not know what this is you should not be here <3'))

app.get('/notifications/v1/:name', (req, res)=>{
  if (reqsPerSecond <= 9){
    axios.get('https://api.scratch.mit.edu/users/' + req.params.name + '/messages/count?'+ Date.now().toString())
    .then(response => res.json(response.data))
    reqsPerSecond++;
  } else {
    res.status(429).send('The server has gotten to many requests this second');
  }
});

app.get('/notifications/v2/:name', (req, res)=>{
    let name = req.params.name;
    if (queue.indexOf(name) === -1){
      queue.push(name);
    }
    
    res.json({count: notifications[name] != undefined? notifications[name]: -1});
    
});

app.get('/notifications/v3/:names', (req, res)=>{
  let names = req.params.names.split(",");
  
  let response = Object.create(null);

  for (let name of names){
    if (queue.indexOf(name) === -1){
      queue.push(name);
    }

    response[name] =  notifications[name] != undefined? notifications[name]: -1;
  }
  
  res.json(response);
  
});

setInterval(function(){

  if (queue.length > longestQueue){
    longestQueue = queue.length;
    console.log(`Longest queue length is ${longestQueue} at ${new Date()}`)
  }

  if (queue.length > 0 && reqsPerSecond <= 9){
    let name = queue.shift();
    reqsPerSecond++;
    axios.get('https://api.scratch.mit.edu/users/' + name + '/messages/count?'+ Date.now().toString())
    .then(response => {
      notifications[name] = response.data.count;
    })
  }
}, 150);

setInterval(function(){
  reqsPerSecond = 0;
}, 1000);

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))