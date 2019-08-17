    
const express = require('express');
const uuid = require('uuid/v4');
const { isWebUri } = require('valid-url');
const logger = require('../logger');
const store = require('../store');

const bookmarksRouter = express.Router();
const bodyParser = express.json();

bookmarksRouter
    .route('/bookmarks')
    .get((req, res) => {
        res.json(bookmarks);
    })
    .post(bodyParser, (req, res) => {
        for (const input of ['title', 'url', 'rating']) {
            if (!req.body[input]) {
                logger.error(`${input} is required`);
                return res.status(400).send(`'${input}' is required`);
            }
        }
        const { title, url, description, rating} = req.body;

        if (!Number.isInteger(rating) || rating < 0 || rating > 5) {
            logger.error(`Invalid rating, '${rating}' supplied`);
            return res.status(400).send(`'rating' must be a number between 0 and 5`);
        }

        // validate url
        if (!isWebUri(url)) {
            logger.error(`Invalid URL '${url}' supplied`);
            return res.status(400).send(`'url' must be a valid URL`);
        }

        const bookmark = { id: uuid(), title, url, description, rating };

        store.bookmarks.push(bookmark);

        logger.info(`Bookmark with id ${bookmark.id} created`);
            res
            .status(201)
            .location(`http://localhost:8000/bookmarks/${bookmark.id}`)
            .json(bookmark);
    });


bookmarksRouter
    .route('/bookmarks/:id')
    .get((req, res) => {
        const { bookmark_id} = req.params;

        const bookmark = storebookmarks.find(c => c.id == bookmark_id)

        if (!bookmark) {
            logger.error(`Bookmark with id ${bookmark_id} not found.`);
            return res 
                .status(404)
                .send('Bookmark Not Found');
        }

        res.json(bookmark);
    })
    .delete((req, res) => {
        const { bookmark_id } = req.params;

        const bookmarkIndex = store.bookmarks.findIndex(b => b.id === bookmark_id);

        if(bookmarkIndex === -1) {
            logger.error(`Bookmark with id ${bookmark_id} not found.`);
            return res
                .status(404)
                .send('Bookmark Not Found');
        }

        store.bookmarks.splice(bookmarkIndex, 1);

        logger.info(`Bookmark with id ${bookmark_id} deleted.`);
            res
            .status(204)
            .end();
    });

module.exports = bookmarksRouter;
