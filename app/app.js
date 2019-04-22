/**
 * Created on 29/05/2018.
 */

'use strict';

let express = require('express'),
    debug = require('debug')('darkstar-auctionhouse-stockist'),
    path = require('path'),
    compression = require('compression'),
    cookieParser = require('cookie-parser'),
    createError = require('http-errors'),
    logger = require('morgan'),
    expressHandlebars = require('express-handlebars'),
    hbs = require('hbs');

let applicationStatus = {
    version: require('../package.json').version,
    name: require('../package.json').name,
    serverPort: process.env.PORT || 5000,
    environment: process.env.NODE_ENV || 'development',
    started: new Date()
};

let app = express(),
    // expressApplicationLocalFunctions = require('./middleware/expressApplicationLocalFunctions'),
    // routingPathsMiddleware = require('./middleware/routingPathsMiddleware'),
    dataContent = require('./lib/dataContent');
//indexRouter = require('./routes/index')(applicationStatus),
//apiRouter = require('./routes/api')(applicationStatus);

hbs.registerPartials(path.join(__dirname, 'views/partials'));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('hbs', expressHandlebars({ defaultLayout: 'layout', extname: '.hbs', layoutsDir: __dirname + '/views', partialsDir: __dirname + '/views/partials' }));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(compression());
app.use('/static/', express.static(path.join(__dirname, 'public'), { maxAge: 3600 }));

// app.locals = expressApplicationLocalFunctions;

app.use(function (req, res, next) {
    res.removeHeader("x-powered-by");
    res.setHeader('X-Frame-Options', 'deny');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Cache-Control', 'public, max-age=' + 3600);
    next();
});

app.get('/', function (req, res) {
    res.render('index');
});

app.get('/status', function (req, res) {
    res.json({ status: 200, updated: new Date().getTime() });
});

// app.use('/', indexRouter);
// app.use('/api', apiRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.json(res.locals.message);
});

app.listen(applicationStatus.serverPort, function () {
    debug('');
    debug('############################################################');
    debug('##              darkstar-auctionhouse-stockist            ##');
    debug('############################################################');
    debug('');
    debug('Version: ' + applicationStatus.version);
    debug('Started: ' + applicationStatus.started);
    debug('Running environment: ' + applicationStatus.environment);
    debug('Listening on port: ' + applicationStatus.serverPort);
    debug('View folder: ' + path.join(__dirname, 'views'));
    debug('Partials folder: ' + path.join(__dirname, 'views/partials'));
    debug('Public folder: ' + path.join(__dirname, 'public'));
    debug('');
    debug('Application ready and listening... ');
    debug('');
});


// need to tidy this up...

/**
 * process.env.PORT
 *
 * set DATABASE_HOST=
 * set DATABASE_NAME=
 * set DATABASE_USER=
 * set DATABASE_PASSWORD=
 */

let playerId = process.env.PLAYER_ID || 10000;
let auctionList = [];
let auctionItemAvailable = [];

dataContent.query('select *, (BaseSell * 8) as RRP from item_basic where BaseSell > 100 AND aH > 0 AND aH <= 32 AND NoSale = 0 and BaseSell > 0;')
    .then(function (result) {
        auctionItemAvailable = result;
        stockAuctionHouse();
    })
    .catch(function (err) {
        console.log(err);
        process.exit();
    });

function stockAuctionHouse() {
    auctionList = [];
    for (let i = 0; i < 10; i++) {
        let itemPicked = Math.floor(Math.random() * auctionItemAvailable.length);
        auctionList.push({
            itemid: auctionItemAvailable[itemPicked].itemid,
            stack: (auctionItemAvailable[itemPicked].stackSize == 1 ? 0 : auctionItemAvailable[itemPicked].stackSize),
            seller: playerId,
            seller_name: 'Zeus',
            date: Math.floor(new Date().getTime() / 1000), // this should match c++ time() object
            price: Math.floor(auctionItemAvailable[itemPicked].BaseSell * ((Math.random() * 5) + 2))
        });
    }

    for (let i = 0; i < auctionList.length; i++) {

        // update insert method to allow for an array; bulk sql inserts

        dataContent.insert('auction_house', auctionList[i]);
    }

    console.log('Zeus has placed some items on the auction house.');

    setTimeout(function () {
        stockAuctionHouse();
    }, 600000);
};
