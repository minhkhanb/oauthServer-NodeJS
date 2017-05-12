// =====================
// get the packages we need ===========
// =====================
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');

// //used to create, sign, add verify tokens
var jwt = require('jsonwebtoken');

// get our config file
var config = require('./config');

// get our mongoose model
var User = require('./app/models/user');

// =====================
// configuration =======
// =====================
// used to create, sign, and verify tokens
var port = process.env.PORT || 8080;

// connect to database
mongoose.connect(config.database);

// secret variable
app.set('superSecret', config.secret);

// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// use morgan to log requrests to the console
app.use(morgan('dev'));

// =========================
// routes ==================
// =========================

// basic route
app.get('/', function (req, res) {
    res.send('Hello! The API is at http://localhost:' + port + '/api');
});

app.get('/setup', function (req, res) {

    // create a sample user
    var nick = new User({
        name: 'KhaLe',
        password: '123',
        admin: true
    });

    // save the sample user
    nick.save(function (err) {
        if (err) throw err;

        console.log('User saved successfully');
        res.json({
            success: true
        });
    });
});

//API ROUTES ----------------------
// we'll get to these in a second
// ============================
// start the server ===========
// ============================
app.listen(port);
console.log('Magic happens at http://localhost:' + port);

// get an instance of the router for api routes
var apiRoutes = express.Router();

// TODO: route to authenticate a user (POST: http://localhost:8080/api/authenticate)
apiRoutes.post('/authenticate', function (req, res) {

    // find the user
    User.findOne({
        name: req.body.name
    }, function (err, user) {
        if (err) throw err;
        if (!user) {
            res.json({
                success: false,
                message: 'Authentication failed. User not found.'
            });
        }
        else if (user) {
            user.password = user.password.trim();
            req.body.password = req.body.password.trim();
            // check if password matches
            if (user.password != req.body.password) {
                res.json({
                    success: false,
                    message: 'Authentication failed. Wrong password.'
                });
            }
            else {

                // if user is found and password is right
                //create a token
                var token = jwt.sign(user, app.get('superSecret'), {
                    expiresIn : 1440 // expires in 24 hours
                });

                // return the information including token as JSON
                res.json({
                    success: true,
                    message: 'Enjoy your token!',
                    token: token
                });
            }
        }
    });
});

// TODO: route middleware to verify a token
apiRoutes.use(function (req, res, next) {

    // check header or url parameters or post parameters for token
    var token = req.body.token || req.query.token || req.headers['x-access-token'];

    // decode token
    if(token) {
        // verifies secret and checks expires
        jwt.verify(token, app.get('superSecret'), function (err, decoded) {
           if(err) {
               return res.json({
                   success: false,
                   message: 'Failed to authenticate token.'
               });
           }
           else {
               //if everything is good, save to request for use in other routes
               req.decoded = decoded;
               next();
           }
        });
    }
    else {
        // if there is no token
        // return a error
        return res.status(403).send({
           success: false,
            message: 'No token provided.'
        });
    }
});

// route to show a random message (GET http://localhost:8080/api/)
apiRoutes.get('/', function (req, res) {
    res.json({
        message: 'Welcome to the coolest API on earth!'
    });
});

// route to return all users (GET http://localhost:8080/api/users)
apiRoutes.get('/users', function (req, res) {
    User.find({}, function (err, users) {
        res.json(users);
    });
});

// apply the routes to our application with the prefix /api
app.use('/api', apiRoutes);





























