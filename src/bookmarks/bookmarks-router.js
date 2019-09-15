const express = require('express');
const { isWebUri } = require('valid-url');
const xss = require('xss');
const logger = require('../logger');
const BookmarksService = require('./bookmarks-service');

// const uuid = require('uuid/v4');
// const store = require('../store');

const bookmarksRouter = express.Router();
const bodyParser = express.json();

const serializedBookmark = bookmark => ({
    id: bookmark.id, // not done on id
    title: xss(bookmark.title),
    url: xss(bookmark.url),  // not done on url
    description: xss(bookmark.description),
    rating: Number(bookmark.rating), // not done on number
});

bookmarksRouter
    .route('/bookmarks')
    .get((req, res, next) => {
        BookmarksService.getAllBookmarks(req.app.get('db'))
        .then(bookmarks => {
            res.json(bookmarks.map(serializedBookmark));
        })
        .catch(next);
    })
    .post(bodyParser, (req, res, next) => {
        for (const input of ['title', 'url', 'rating']) {
            if(!req.body[input]) {
                logger.error(`${input} is required`);
                return res.status(400).send({
                    error: { message: `'${input}' is required`}
                });
            }
        }

        const { title, url, description, rating } = req.body;

        const ratingNum = Number(rating);

        if (!Number.isInteger(ratingNum) || rating < 0 || rating > 5) {
            logger.error(`Invalid rating, '${rating}' supplied`);
            return res.status(400).send({
                error: { message: `'rating' must be a number between 0 and 5`}
            });
        }
        if (!isWebUri(url)) {  // validating URL
            logger.error(`Invalid URL '${url}' supplied`);
            return res.status(400).send({
                error: { message: `'url' must be a valid URL`}
            });
        }  // note the return is always for errors 
        
        // store.bookmarks.push(newBookmark);
        //     res
        //     .status(201)
        //     .location(`http://localhost:8000/bookmarks/${bookmark.id}`
        //     .json(bookmark);

        const newBookmark = { title, url, description, rating };

        BookmarksService.insertBookmarks(
            req.app.get('db'),
            newBookmark
        )
        .then(bookmark => {
            // posting to database, we want this logger to tell us this posted without us checking ID in PostMan
            logger.info(`Bookmark with id ${bookmark.id} created`);
            res
                .status(201)
                .location(`/bookmarks/${bookmark.id}`)
                .json(serializedBookmark(bookmark));
        })
        .catch(next);
    });

bookmarksRouter         // v this is a param (bookmark_id)
    .route('/bookmarks/:bookmark_id')
    .all((req, res, next) => {       // similar to const { bookmark_id } = req.params
        BookmarksService.getById(res.app.get('db'), req.params.bookmark_id)
        .then(bookmark => {
            if(!bookmark) {
                logger.error(`Bookmark with id ${req.params.bookmark_id} not found.`); 
                // logging before return
                return res.status(404).json({
                    error: { message: `Bookmark doesn't exist` }
                });
            }
            res.bookmark = bookmark; // save bookmark for next middleware
            next();
        })
        .catch(next);
    })
    .get((req, res, next) => {
        res.json(serializedBookmark(res.bookmark));
        // const knexInstance = req.app.get('db');
        // BookmarksService.getById(knexInstance, req.params.bookmark_id)
        //     .then(bookmark => {
        //         if(!bookmark) {
        //             return res.status(404).json({
        //                 error: { message: `Bookmark doesn't exist`}
        //             });
        //         }
        //         res.json(bookmark);
        //     })
        //     .catch(next);

        // const { bookmark_id} = req.params;
        // const bookmark = store.bookmarks.find(c => c.id == bookmark_id)
        // if (!bookmark) {
        //     logger.error(`Bookmark with id ${bookmark_id} not found.`);
        //     return res 
        //         .status(404)
        //         .send('Bookmark Not Found');
        // }
        // res.json(bookmark)
    })
    .delete((req, res, next) => {
        BookmarksService.deleteBookmark(
            req.app.get('db'),
            req.params.bookmark_id
        )
        .then(() => {  // notice no error to send back
            logger.info(`Bookmark with id ${req.params.bookmark_id} deleted.`);
            res.status(204).end();
        })
        .catch(next);

        // const { bookmark_id } = req.params;
        // const bookmarkIndex = store.bookmarks.findIndex(b => b.id === bookmark_id);

        // if(bookmarkIndex === -1) {
        //     logger.error(`Bookmark with id ${bookmark_id} not found.`);
        //     return res
        //         .status(404)
        //         .send('Bookmark Not Found');
        // }

        // store.bookmarks.splice(bookmarkIndex, 1);
        // logger.info(`Bookmark with id ${bookmark_id} deleted.`);
        //     res
        //     .status(204)
        //     .end()
    });

module.exports = bookmarksRouter;
