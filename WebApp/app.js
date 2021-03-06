// forever -e /root/SmileZone/WebApp/log.err -a -o /root/SmileZone/WebApp/log.log start /root/SmileZone/WebApp/app.js

var fs = require('fs');
var constants = require('constants');
var express = require('express');
var app = express();
var port = process.env.PORT || 8080;
var path = require('path');
var https = require('https');
var http = require('http');
var sessionSecret = require('./sessionSecret.js');
var bcrypt = require('bcrypt');
var mongodb = require('mongodb');
var mongoose = require('mongoose');
var passport = require('passport');
var cookieParser = require('cookie-parser')
var session = require('express-session')
var favicon = require('serve-favicon')
var serveStatic = require('serve-static')

//Models
var userModel = require('./mvc/models/user.js');
var pointModel = require('./mvc/models/point.js');

console.log('Starting app ', new Date());


mongoose.connect('mongodb://localhost:27017/smilezone5', {useNewUrlParser: true});


var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback() {
	console.log('Connected to DB');
});

// Password verification
userModel.userSchema.methods.comparePassword = function(candidatePassword, cb) {
	bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
		if (err) return cb(err);
		cb(null, isMatch);
	});
};
var User = mongoose.model('User', userModel.userSchema);

//Include passport
require('./mvc/controllers/passport.js')(app, passport, User);

var Points = mongoose.model('Points', pointModel.pointsSchema);

// app.use(express.json());
app.use(express.urlencoded());
app.use(cookieParser());
app.use(serveStatic(__dirname + '/public'));
app.use(favicon(__dirname + '/public/img/favicon.ico'));
app.set('views', __dirname + '/mvc/views');
app.set('view engine', 'ejs');
app.use(session({ secret: sessionSecret.secret }));

// Remember Me middleware
app.use(function(req, res, next) {
	if (req.method == 'POST' && req.url == '/login') {
		req.session.cookie.maxAge = 2592000000; // 30*24*60*60*1000 Rememeber 'me' for 30 days
	}
	next();
});
app.use(passport.initialize());
app.use(passport.session());

require('./mvc/controllers/routes.js')(app, passport, Points, User, db);

http.createServer(app).listen(port);
