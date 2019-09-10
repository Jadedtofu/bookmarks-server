const express = require('express');
const xss = require('xss');
const BookmarksService = require('./bookmarks-service');
const uuid = require('uuid/v4');
const { isWebUri } = require('valid-url');
const logger = require('../logger');
// const store = require('../store');

const bookmarksRouter = express.Router();
const jsonParser = express.json();

const serializedBookmark = bookmark => ({
    id: bookmark.id,
    title: xss(bookmark.title),
    url: xss(bookmark.url),
    description: xss(bookmark.description),
    rating: Bookmark.rating
});

bookmarksRouter
    .route('/')
    .get((req, res, next) => {
        BookmarksService.getAllBookmarks(
            req.app.get('db')
        )
        .then(bookmarks => {
            res.json(bookmarks.map(serializedBookmark));
        })
        .catch(next);
    })
    .post(jsonParser, (req, res, next) => {
        const { title, url, description, rating } = req.body;

        for (const input of ['title', 'url', 'rating']) {
            if(!req.body[input]) {
                logger.error(`${input} is required`);
                return res.status(400).send(`'${input}' is required`);
            }
        }
        if (!Number.isInteger(rating) || rating < 0 || rating > 5) {
            logger.error(`Invalid rating, '${rating}' supplied`);
            return res.status(400).send(`'rating' must be a number between 0 and 5`);
        }
        if (!isWebUri(url)) {  // validating URL
            logger.error(`Invalid URL '${url}' supplied`);
            return res.status(400).send(`'url' must be a valid URL`);
        }
        // store.bookmarks.push(newBookmark);

        // logger.info(`Bookmark with id ${bookmark.id} created`);
        //     res
        //     .status(201)
        //     .location(`http://localhost:8000/bookmarks/${bookmark.id}`)
        //     .json(bookmark);

        const newBookmark = { id: uuid(), title, url, description, rating };

        BookmarksService.insertBookmarks(
            req.app.get('db'),
            newBookmark
        )
        .then(bookmark => {
            res
                .status(201)
                .location(`/bookmarks/${bookmark.id}`)
                .json(serializedBookmark(bookmark));
        })
        .catch(next);
    });
 
// bookmarksRouter
//     .route('/bookmarks')
//     .get((req, res) => {
//         res.json(store.bookmarks)
//     })
//     .post(jsonParser, (req, res) => {
//         for (const input of ['title', 'url', 'rating']) {
//             if (!req.body[input]) {
                // logger.error(`${input} is required`);
                // return res.status(400).send(`'${input}' is required`);
//             }
//         }
//         const { title, url, description, rating } = req.body;

        // if (!Number.isInteger(rating) || rating < 0 || rating > 5) {
        //     logger.error(`Invalid rating, '${rating}' supplied`);
        //     return res.status(400).send(`'rating' must be a number between 0 and 5`);
        // }

//         // validate url
        // if (!isWebUri(url)) {
        //     logger.error(`Invalid URL '${url}' supplied`);
        //     return res.status(400).send(`'url' must be a valid URL`);
        // }

//         const bookmark = { id: uuid(), title, url, description, rating };

        // store.bookmarks.push(bookmark);

        // logger.info(`Bookmark with id ${bookmark.id} created`);
        //     res
        //     .status(201)
        //     .location(`http://localhost:8000/bookmarks/${bookmark.id}`)
        //     .json(bookmark)
//     });

bookmarksRouter
    .route('/:bookmark_id')
    .all((req, res, next) => {
        BookmarksService.getById(
            res.app.get('db'),
            req.params.bookmark_id
        )
        .then(bookmark => {
            if(!bookmark) {
                return res.status(404).json({
                    error: { message: `Bookmark doesnt' exist` }
                })
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
        .then(() => {
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
