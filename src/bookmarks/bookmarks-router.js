const path = require('path');
const express = require('express');
// const { isWebUri } = require('valid-url');
const xss = require('xss');
const logger = require('../logger');
const BookmarksService = require('./bookmarks-service');
const { getBookmarkValidationError } = require('./bookmark-validator');

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
    .route('/')
    .get((req, res, next) => {
        BookmarksService.getAllBookmarks(req.app.get('db'))
        .then(bookmarks => {
            res.json(bookmarks.map(serializedBookmark));
        })
        .catch(next);
    })
    .post(bodyParser, (req, res, next) => {
        const { title, url, description, rating } = req.body;
        const newBookmark = { title, url, description, rating };

        for (const input of ['title', 'url', 'rating']) {
            if(!req.body[input]) {
                logger.error(`Missing '${input}' in request body`);
                return res.status(400).send({
                    error: { message: `Missing '${input}' in request body`}
                });
            }
        }

        const error = getBookmarkValidationError(newBookmark);
        if (error) return res.status(400).send(error);

        // const ratingNum = Number(rating);

        // if (!Number.isInteger(ratingNum) || rating < 0 || rating > 5) {
        //     logger.error(`Invalid rating, '${rating}' supplied`);
        //     return res.status(400).send({
        //         error: { message: `'rating' must be a number between 0 and 5`}
        //     });
        // }
        // if (!isWebUri(url)) {  // validating URL
        //     logger.error(`Invalid URL '${url}' supplied`);
        //     return res.status(400).send({
        //         error: { message: `'url' must be a valid URL`}
        //     });
        // }  // note the return is always for errors 
    
        // store.bookmarks.push(newBookmark);
        //     res
        //     .status(201)
        //     .location(`http://localhost:8000/bookmarks/${bookmark.id}`
        //     .json(bookmark);

        BookmarksService.insertBookmarks(
            req.app.get('db'),
            newBookmark
        )
        .then(bookmark => {
            // posting to database, we want this logger to tell us this posted without us checking ID in PostMan
            logger.info(`Bookmark with id ${bookmark.id} created`);
            res
                .status(201)
                .location(path.posix.join(req.originalUrl, `/${bookmark.id}`))
                .json(serializedBookmark(bookmark));
        })
        .catch(next);
    });

bookmarksRouter         // v this is a param (bookmark_id)
    .route('/:bookmark_id')
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
    })
    .patch(bodyParser, (req, res, next) => {
        const { title, url, description, rating } = req.body;
        const bookmarkToUpdate = { title, url, description, rating };

        const numberOfValues = Object.values(bookmarkToUpdate).filter(Boolean).length;
        if(numberOfValues === 0) {
            return res.status(400).json({
                error: {
                    message: `Request body must contain 'title', 'url', or 'rating'`
                }
            });
        }

        const error = getBookmarkValidationError(bookmarkToUpdate);
        if (error)  return res.status(400).send(error);

        BookmarksService.updateBookmark(
            req.app.get('db'),
            req.params.bookmark_id,
            bookmarkToUpdate
        )
        .then(()=> {
            res.status(204).end()
        })
        .catch(next);
    });

module.exports = bookmarksRouter;
