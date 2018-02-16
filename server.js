var express = require('express'),
path = require('path'),
amqp = require('amqp'),
logger = require('morgan')
bodyParser = require('body-parser');

var app = express();
console.log(__dirname);

app.set('views', './views');
app.set('view engine', 'pug')

app.set('port', process.env.PORT || 3000);
app.use(bodyParser.json());
app.use(logger('tiny'));
app.use(express.static(path.join(__dirname, './public')));

app.connectionStatus = 'No server connection';
app.exchangeStatus = 'No exchange established';
app.queueStatus = 'No queue established';

app.get('/', function(req, res){
    res.render('index',
      {
        title: 'Welcome to RabbitMQ and Node/Express on AppFog',
        connectionStatus: app.connectionStatus,
        exchangeStatus: app.exchangeStatus,
        queueStatus: app.queueStatus
      });
});

app.post('/start-server', function(req, res){
    app.rabbitMqConnection = amqp.createConnection({ host: 'localhost' });
    app.rabbitMqConnection.on('ready', function(){
        app.connectionStatus = 'Connected!';
        res.redirect('/');
    });
});

app.post('/new-exchange', function(req, res){
    app.e = app.rabbitMqConnection.exchange('test-exchange');
    app.exchangeStatus = 'An exchange has been established!';
    res.redirect('/');
  });

app.post('/new-queue', function(req, res){
    app.q = app.rabbitMqConnection.queue('test-queue');
    app.queueStatus = 'The queue is ready for use!';
    res.redirect('/');
});

app.get('/message-service', function(req, res){
    app.q.bind(app.e, '#');
    res.render('message-service.pug',
      {
        title: 'Welcome to the messaging service',
        sentMessage: ''
      });
  });

app.post('/newMessage', function(req, res){
    var newMessage = req.body.newMessage;
    app.e.publish('routingKey', { message: newMessage });
  
    app.q.subscribe(function(msg){
        res.render('message-service.pug',
        {
          title: 'You\'ve got mail!',
          sentMessage: msg.message
        });
    });
  });

app.listen(app.get('port'), function(){
  console.log("RabbitMQ + Node.js app running on AppFog!");
});
