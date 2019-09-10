const { expect } = require('chai');
const supertest = require('supertest'); //to test for status code responses
const knex = require('knex');
const app = require('../src/app');
const { makeBookmarksArray } = require('./bookmarks.fixtures');

describe('Bookmarks Endpoints', function() {
    let db;

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL
        });

        app.set('db', db); // we need to access knex instance here from app to do tests
    });

    after('disconnect from db', () => db.destroy());

    before('clean the table', () => db('bookmarks').truncate());

    afterEach('cleanup', () => db('bookmarks').truncate());

    describe(`GET /bookmarks`, () => {
        context(`Given no bookmarks`, () => {
            it(`responds with 200 and an empty list`, () => {
                return supertest(app)
                    .get('/bookmarks')
                    .expect(200, []);
            });
        });

        context(`Given there are bookmarks in the database`, () => {
            const testBookmarks = makeBookmarksArray();
    
            beforeEach(`insert bookmarks`, () => {
                return db
                    .into('bookmarks')
                    .insert(testBookmarks);
            });
    
            it(`responds with 200 and all the bookmarks`, () => {
                return supertest(app)
                    .get('/bookmarks')
                    .expect(200, testBookmarks);
            });
        });
    });

    describe.only(`GET /bookmarks/:bookmark_id`, () => {
        context(`Given no bookmarks`, () => {
            it(`responds with 404`, () => {
                const bookmarkId = 123456;
                return supertest(app)
                    .get(`/bookmarks/${bookmarkId}`)
                    .expect(404, { error: {
                                    message: `Bookmark doesn't exist.`
                                    }
                    });
            });
        });

        context(`Given there are bookmarks in the database`, () => {
            const testBookmarks = makeBookmarksArray();
    
            beforeEach('insert bookmarks', () => {
                return db
                    .into('bookmarks')
                    .insert(testBookmarks);
            });

            it(`GET /bookmarks/:bookmark_id responds with 200 and the specified bookmark`, function() {
                const bookmarkId = 2;
                const expectedBookmark = testBookmarks[bookmarkId - 1];
                return supertest(app)
                    .get(`/bookmarks/${bookmarkId}`)
                    .expect(200, expectedBookmark);
            });
        });
    });

    describe.only(`POST /bookmarks`, () => {
        it(`creates a bookmark, responding with 201 and the new bookmark`, () => {
            const newBookmark = {
                    title: 'Test new bookmark',
                    url: 'https://www.Thinkful.com',
                    description: 'Thinkful homepage',
                    rating: 3
                }
            return supertest(app)
                .post('/bookmarks')
                .send(newBookmark)
                .expect(201)
                .expect(res => {
                    expect(res.body.title).to.eql(newBookmark.title);
                    expect(res.body.url).to.eql(newBookmark.url);
                    expect(res.body.description).to.eql(newBookmark.description);
                    expect(res.body).to.have.property('id');
                    expect(res.headers.location).to.eql(`/bookmarks/${res.body.id}`); //location header for new bkmrk
                })
                .then(postRes => {  // to test or validate the POST adds a bookmark, making another request
                    supertest(app)
                        .get(`/bookmkarks/${postRes.body.id}`)
                        .expect(postRes.body);
                });
        });

        const requiredFields = ['title', 'url', 'rating'];

        requiredFields.forEach(field => {
            const newBookmark = {
                title: 'Test new bookmark',
                url: 'https://maps.google.com',
                rating: 4
            }

            it(`responds with 400 and error message when '${field}' is missing`, () => 
            {
                delete newBookmark[field];  // does this delete the invalid field value?
                return supertest(app)
                    .post('/bookmarks')
                    .send(newBookmark)
                    .expect(400, {
                        error: { message: `Missing '${field}' in request body`}
                    });
            });
        });
    });

    describe.only(`DELETE /bookmarks/:bookmark_id`, () => {
        context(`Given there are bookmarks`, () => {
            const testBookmarks = makeBookmarksArray();
            
            beforeEach('insert bookmarks', () => {
                return db 
                    .into('bookmarks')
                    .insert(testBookmarks);
            });

            it('responds with 204 and removes the bookmark', () => {
                const idToRemove = 2;
                const expectedBookmark = testBookmarks.filter(bookmark => bookmark.id !== idToRemove);
                return supertest(app)
                    .delete(`/bookmark/${idToRemove}`)
                    .expect(204)
                    .then(res =>
                        supertest(app)
                            .get(`/bookmarks`)
                            .expect(expectedBookmarks)
                    );
            });
        });
    });

    describe.only(`DELETE /bookmarks/:bookmark_id`, () => {
        context(`Given no bookmarks`, () => {
            it(`responds with 404`, () => {
                const bookmarkId = 123456;
                return supertest(app)
                    .delete(`/bookmarks/${bookmarkId}`)
                    .expect(404, {
                        error: { message: `Bookmark doesn't exist`}
                    });
            });
        });
    });
});



