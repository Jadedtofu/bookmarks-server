require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const { NODE_ENV } = require('./config');
const validateBearerToken = require('./validate-bearer-token');
const errorHandler = require('./error-handler');
const bookmarksRouter = require('./bookmarks/bookmarks-router');
// const BookmarksService = require('./bookmarks/bookmarks-service');

const app = express();
// const jsonParser = express.json(); // to read the body with the JSON body parser

const morganOption = (NODE_ENV === 'production') ? 'tiny' : 'common';
app.use(morgan(morganOption, {
  skip: () => NODE_ENV === 'test'}));

app.use(cors());
app.use(helmet());
app.use(validateBearerToken);  

app.use('/api/bookmarks', bookmarksRouter);
// app.get('/bookmarks', (req, res, next) => {
//   // res.send('All Bookmarks');
//   const knexInstance = req.app.get('db'); // to read the properties on the app object: req.app.get('property-name')
//   BookmarksService.getAllBookmarks(knexInstance)
//     .then(bookmarks => {
//       res.json(bookmarks)
//     })
//     .catch(next);
// });

// app.get('/bookmarks/:bookmark_id', (req, res, next) => {
// //   res.json({ 'requested_id': req.params.bookmark_id, 
// //               this: 'should fail'});
//   const knexInstance = req.app.get('db');
//   BookmarksService.getById(knexInstance, req.params.bookmark_id)
//     .then(bookmark => {
//       if (!bookmark) {
//         return res.status(404).json({
//           error: { message:
//             `Bookmark doesn't exist.`
//                   }
//         });
//       }
//       res.json(bookmark);
//     })
//     .catch(next);
// });

// app.post('/bookmarks', jsonParser, (req, res, next) => {
//   // res.status(201).send('stuff')
//   // res.status(201).json({
//   //   ...req.body,
//   //   id: 12
//   // });
//         // creating actual bookmark in the database:
//   const { title, url, description, rating} = req.body;
//   const newBookmark = { title, url, description, rating};
//   BookmarksService.insertBookmarks(
//     req.app.get('db'),
//     newBookmark
//   )
//     .then(bookmark => {
//       res
//         .status(201)
//         .location(`/bookmarks/${bookmark.id}`)
//         .json(bookmark)
//     })
//     .catch(next);
// });

app.get('/', (req, res) => {
    res.send('Hello, world!');
});

app.use(errorHandler);

module.exports = app;
