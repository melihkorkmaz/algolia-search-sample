var express = require('express');
var path = require('path');
var config = require('./config');
var bodyParser = require('body-parser');

var algoliasearch = require('algoliasearch');

var client = algoliasearch('application id', 'algolia api key');
var index = client.initIndex('books');

const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;

let db;

MongoClient.connect(config.dbConn, function (err, client) {
    if(err){
        console.log(err);
        return;
    }
    console.log("Connected successfully to server");
    db = client.db(config.dbName);
});

var app = express();
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.set('view engine', 'ejs');


app.get('/', (req, res) => {
    res.render('index');
});

app.get('/add-book', (req, res) => {
    res.render('add-book');
});

app.get('/list-books', (req, res) => {

    var key = req.query.key;

    if(key){
        index.search({ query : key}, function(err, data){

            var ids = data.hits.map(x => new ObjectID(x.objectID));

            
            db.collection('books').find({
                _id : {
                    $in : ids
                }
            }).toArray(function(err, data) {
                console.log("data", data);
                res.render('list-books', { books : data});
            })

        });
    }else{
        db.collection('books').find({}).toArray(function(err, data){
            res.render('list-books', { books : data});
        });
    }    
});

app.post('/add-book', (req, res) => {
    db.collection('books').insertOne(req.body, function(err, data){
        console.log("data", data);
        var book = data.ops[0];
        book.objectID = book._id;
        delete book._id;

        index.addObject(book, function(err){
            res.send("Kitap kaydı yapıldı");
        });
    });
});

app.listen(8080, () => console.log("Runs on 8080"));