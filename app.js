const express = require('express')
const app = express()
const port = 3000
const axios = require('axios');

var reqsPerSecond = 0;
var queue = [];
var notifications = Object.create(null);

var analytics = {
  longestQueue: 0,
  totalReqs: 0,
  queueSizeSinceLast: 0,
  queues: 0
}

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
    if (req.originalUrl != '/metrics')
      analytics.totalReqs++;
});

app.get('/', (req, res) => res.send('If you do not know what this is you should not be here <3'))

app.get('/maxqueue/v1/', (req, res)=> {
  res.json({longestQueue:analytics.longestQueue});
});

app.get('/metrics', (req, res)=>{
  let timestamp = new Date().getTime()
  res.send(`
# HELP scratch_proxy_request_total The total number of HTTP requests.
# TYPE scratch_proxy_request_total counter
scratch_proxy_request_total ${analytics.totalReqs} ${timestamp}

# HELP scratch_proxy_queue_since The amount of additions to the queue since the last time prometheus checked
scratch_proxy_queue_since ${analytics.queueSizeSinceLast} ${timestamp}

# HELP scratch_proxy_longest_queue The longest queue
scratch_proxy_longest_queue ${analytics.longestQueue} ${timestamp}

# HELP scratch_proxy_queues_total The total queues
# TYPE scratch_proxy_queues_total counter
scratch_proxy_queues_total ${analytics.queues} ${timestamp}
  `)

  analytics.queueSizeSinceLast = 0;
});

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
      queuePush(name);
    }
    
    res.json({count: notifications[name] != undefined? notifications[name]: -1});
    
});

app.get('/notifications/v3/:names', (req, res)=>{
  let names = req.params.names.split(",");
  
  let response = Object.create(null);

  for (let name of names){
    if (queue.indexOf(name) === -1){
      queuePush(name);
    }

    response[name] =  notifications[name] != undefined? notifications[name]: -1;
  }
  
  res.json(response);
  
});

setInterval(function(){

  if (queue.length > analytics.longestQueue){
    analytics.longestQueue = queue.length;
    console.log(`Longest queue length is ${analytics.longestQueue} at ${new Date()}`)
  }

  if (queue.length > 0 && reqsPerSecond <= 9){
    let name = queue.shift();
    reqsPerSecond++;
    axios.get('https://api.scratch.mit.edu/users/' + name + '/messages/count?'+ Date.now().toString())
    .then(response => {
      notifications[name] = response.data.count;
    })
  }
}, 100);

function queuePush(name){
  analytics.queueSizeSinceLast++;
  analytics.queues++;
  queue.push(name);
}

setInterval(function(){
  reqsPerSecond = 0;
}, 1000);

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))