    
const express = require('express');
const uuid = require('uuid/v4');
// make store

const bookmarksRouter = express.Router();
const bodyParser = express.json();

bookmarksRouter
    .route('/bookmarks')
    .get((req, res) => {
        res.json(bookmarks);
    })
    .post(bodyParser, (req, res) => {
        // stuff here
    });


bookmarksRouter
    .route('/bookmarks/:id')
    .get((req, res) => {
        // stuff here
    })
    .delete((req, res) => {
        // stuff here
    });

module.exports = bookmarksRouter;