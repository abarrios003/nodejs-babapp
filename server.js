//  OpenShift sample Node application
var express = require('express'),
    fs      = require('fs'),
    app     = express(),
    eps     = require('ejs'),
    emailjs = require('emailjs'),
    mongoose = require('mongoose'),                    // mongoose for mongodb     
    bodyParser = require('body-parser'),   // pull information from HTML POST
    morgan  = require('morgan'),
    moment = require('moment'); 
	
Object.assign=require('object-assign')

app.engine('html', require('ejs').renderFile);
app.use(bodyParser.urlencoded({'extended':'true'}));            // parse application/x-www-form-urlencoded
app.use(bodyParser.json());                                     // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
app.use(morgan('combined'));
app.use(function(req, res, next) {
   res.header("Access-Control-Allow-Origin", "*");
   res.header('Access-Control-Allow-Methods', 'DELETE, PUT');
   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
   next();
})

var mailServer  = emailjs.server.connect({
   user:    "alex.barrios.ureta", 
   password:"6Fovajo9", 
   host:    "smtp.gmail.com", 
   ssl:     true
});

mongoose.connect('mongodb://abarrios:6fovajo9@ds157809.mlab.com:57809/babapdb');
    

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0',
    mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL,
    mongoURLLabel = "";

if (mongoURL == null && process.env.DATABASE_SERVICE_NAME) {
  var mongoServiceName = process.env.DATABASE_SERVICE_NAME.toUpperCase(),
      mongoHost = process.env[mongoServiceName + '_SERVICE_HOST'],
      mongoPort = process.env[mongoServiceName + '_SERVICE_PORT'],
      mongoDatabase = process.env[mongoServiceName + '_DATABASE'],
      mongoPassword = process.env[mongoServiceName + '_PASSWORD']
      mongoUser = process.env[mongoServiceName + '_USER'];

  if (mongoHost && mongoPort && mongoDatabase) {
    mongoURLLabel = mongoURL = 'mongodb://';
    if (mongoUser && mongoPassword) {
      mongoURL += mongoUser + ':' + mongoPassword + '@';
    }
    // Provide UI label that excludes user id and pw
    mongoURLLabel += mongoHost + ':' + mongoPort + '/' + mongoDatabase;
    mongoURL += mongoHost + ':' +  mongoPort + '/' + mongoDatabase;

  }
}

var db = null,
    dbDetails = new Object();
	
var initDb = function(callback) {
  if (mongoURL == null) return;

  var mongodb = require('mongodb');
  if (mongodb == null) return;

  mongodb.connect(mongoURL, function(err, conn) {
    if (err) {
      callback(err);
      return;
    }

    db = conn;
    dbDetails.databaseName = db.databaseName;
    dbDetails.url = mongoURLLabel;
    dbDetails.type = 'MongoDB';

    console.log('Connected to MongoDB at: %s', mongoURL);
  });
};

//Schema
var Schema = mongoose.Schema;
var userSchema = new Schema({
	name: String,
	username: String,
    	password: String,
	email: { type: String, required: true, unique : true},
	country: String,
	phone: String,
	created_at: { type: Date, default: Date.now },
  	updated_at: { type: Date, default: Date.now }
});
 
// Models
var User = mongoose.model('User', userSchema);
var db = null,
    dbDetails = new Object();

var apiRoutes = express.Router();

// connect the api routes under /api/*
app.use('/api', apiRoutes);

app.get('/', function (req, res) {
  // try to initialize the db on every request if it's not already
  // initialized.
  if (!db) {
    initDb(function(err){});
  }
  if (db) {
    var col = db.collection('counts');
    // Create a document with request IP and current time of request
    col.insert({ip: req.ip, date: Date.now()});
    col.count(function(err, count){
      res.render('index.html', { pageCountMessage : count, dbInfo: dbDetails });
    });
  } else {
    res.render('index.html', { pageCountMessage : null});
  }
});

app.get('/pagecount', function (req, res) {
  // try to initialize the db on every request if it's not already
  // initialized.
  if (!db) {
    initDb(function(err){});
  }
  if (db) {
    db.collection('counts').count(function(err, count ){
      res.send('{ pageCount: ' + count + '}');
    });
  } else {
    res.send('{ pageCount: -1 }');
  }
});

// Get users
    app.get('/api/users', function(req, res) {
 
        console.log("fetching users");
 
        // use mongoose to get all users in the database
        User.find(function(err, users) {
 
            // if there is an error retrieving, send the error. nothing after res.send(err) will execute
            if (err)
                res.send(err)
 
            res.json(users); // return all reviews in JSON format
			console.log("Consulta OK");
			console.log(users);
        });
    });

app.get('/api/username/:username', function(req, res) {
 
        console.log("fetching user ");
 
        // use mongoose to get all users in the database
        User.find({username : req.params.username},function(err, user) {
 
            // if there is an error retrieving, send the error. nothing after res.send(err) will execute
            if (err)
                res.send(err)
 
            res.json(user); // return all reviews in JSON format
			console.log("Consulta OK");
			console.log(user);
        });
    });

   app.get('/api/email/:email', function(req, res) {
 
        console.log("fetching user ");
 
        // use mongoose to get all users in the database
        User.find({email : req.params.email},function(err, user) {
 
            // if there is an error retrieving, send the error. nothing after res.send(err) will execute
            if (err)
                res.send(err)
 
            res.json(user); // return all reviews in JSON format
			console.log("Consulta OK");
			console.log(user);
        });
    });
	
    app.post('/api/login', function(req, res) {
 
        console.log("login user ");
 
        // use mongoose to get all users in the database
        User.find({email : req.body.email, password: req.body.password},function(err, user) {
 
            // if there is an error retrieving, send the error. nothing after res.send(err) will execute
            if (err)
                res.send(err)
 
            res.json(user); // return all reviews in JSON format
			console.log("Consulta OK");
			console.log(user);
        });
    });

   app.post('/api/update', function(req, res){
	   var obj = req.body;
	   console.log('update');
	   console.log(obj.id);
	   User.remove({
            _id : obj.id
        }, function(err, user) {
 		if(err)
 			res.send(err)

 		User.create({
	    	name : req.body.name,
            username : req.body.username,
            password : req.body.password,
            email: req.body.email,
	    	country : req.body.country,
            phone : req.body.phone,
            done : false
        }, function(err, user) {
            if (err)
                res.send(err);
            res.send(user);
        });
 
    });

   });
	
 
    // create review and send back all reviews after creation
    app.post('/api/users', function(req, res) {
 
        console.log("creating users");
		console.log(req);
 
        // create a user, information comes from request from Ionic
        User.create({
			name : req.body.name,
            username : req.body.username,
            password : req.body.password,
            email: req.body.email,
			country : req.body.country,
            phone : req.body.phone,
            done : false
        }, function(err, user) {
            if (err)
                res.send(err);
 
            // get and return all the users after you create another
            User.find(function(err, users) {
                if (err)
                    res.send(err)
                res.json(users);
            });
        });
 
    });
 
    // delete a user
    app.delete('/api/users/:user_id', function(req, res) {
        User.remove({
            _id : req.params.user_id
        }, function(err, user) {
 
        });
    });

// on every save, add the date
/*userSchema.pre('save', function(next) {
  // get the current date
  var currentDate = new Date();
  
  // change the updated_at field to current date
  this.updated_at = currentDate;

  // if created_at doesn't exist, add to that field
  if (!this.created_at)
    this.created_at = currentDate;

  next();
});*/


// error handling
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500).send('Something bad happened!');
});

initDb(function(err){
  console.log('Error connecting to Mongo. Message:\n'+err);
});

app.listen(port, ip, function(){
  console.log("BaBap Listening on " + ip + ", server_port " + port)
});

/*app.listen(port, ip);
console.log('BaBap Server running on http://%s:%s', ip, port);*/

module.exports = app ;
