const { expect } = require('chai');  // solution didn't have this, why?
const supertest = require('supertest'); // to test for status code responses
  // solution didn't have this either
const knex = require('knex');   
const { makeBookmarksArray } = require('./bookmarks.fixtures');
const { makeBadBookmark } = require('./bookmarks.fixtures');
const app = require('../src/app');

describe('Bookmarks Endpoints', () => {
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

    // need to do test for unauthorized requests:
    describe(`Unauthorized Requests`, () => {
        const testBookmarks = makeBookmarksArray();

        beforeEach(`insert bookmarks`, () => {
            return db
                .into('bookmarks')
                .insert(testBookmarks)
        });

        it(`Responds with 401 Unauthorized for GET /bookmarks`, () => {
            return supertest(app)
                .get('/bookmarks')
                .expect(401, { error: 'Unauthorized Request' });
        });

        it(`responds with 401 Unauthorized for POST /bookmarks`, () => {
            return supertest(app)
                .post('/bookmarks')
                .send({title: 'test-title', 
                        urL: 'http://someplace.com',
                        rating: 1 });
        });

        it(`responds with 401 Unauthorized for GET /bookmarks/:id`, () => {
            const secondBookmark = testBookmarks[1];
            return supertest(app)
                .get(`/bookmarks/${secondBookmark.id}`)
                .expect(401, { error: 'Unauthorized Request' });
        });
    });

    describe(`GET /bookmarks`, () => {
        context(`Given no bookmarks`, () => {
            it(`responds with 200 and an empty list`, () => {
                return supertest(app)
                    .get('/bookmarks')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)  // how does this work?
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
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, testBookmarks);
            });
        });

        context(`Given an XSS attack bookmark`, () => {
            const { badBookmark, expectedBookmark } = makeBadBookmark();

            beforeEach('insert malicious bookmark', () => {
                return db
                    .into('bookmarks')
                    .insert([badBookmark]);
            });

            it('removes XSS attack content', () => {
                return supertest(app)
                    .get('/bookmarks')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body[0].title).to.eql(expectedBookmark.title);
                        expect(res.body[0].description).to.eql(expectedBookmark.description);
                    });
            });
        });
    });

    describe(`GET /bookmarks/:bookmark_id`, () => {
        context(`Given no bookmarks`, () => {
            it(`responds with 404`, () => {
                const bookmarkId = 123456;
                return supertest(app)
                    .get(`/bookmarks/${bookmarkId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, { error: {
                                    message: `Bookmark doesn't exist`
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

            it(`GET /bookmarks/:bookmark_id responds with 200 and the specified bookmark`, () => {
                const bookmarkId = 2;
                const expectedBookmark = testBookmarks[bookmarkId - 1];
                return supertest(app)
                    .get(`/bookmarks/${bookmarkId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, expectedBookmark);
            });
        });

        context(`Given an XSS attack bookmark`, () => {
            const { badBookmark, expectedBookmark } = makeBadBookmark();

            beforeEach('insert bad bookmark', () => {
                return db
                    .into('bookmarks')
                    .insert([badBookmark]);
            });

            it('removes XSS attack content', () => {
                return supertest(app)
                    .get(`/bookmarks/${badBookmark.id}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body.title).to.eql(expectedBookmark.title);
                        expect(res.body.description).to.eql(expectedBookmark.description);
                    });
            });
        });
    });

    describe(`DELETE /bookmarks/:bookmark_id`, () => {
        context(`Given no bookmarks`, () => {
            it(`Responds with 404 with no bookmarks`, () => {
                return supertest(app)
                    .delete(`/bookmarks/123`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, {
                      error: { message: `Bookmark doesn't exist` }
                    });
            });
        });

        context(`Given there are bookmarks`, () => {
            const testBookmarks = makeBookmarksArray();
            
            beforeEach('insert bookmarks', () => {
                return db 
                    .into('bookmarks')
                    .insert(testBookmarks);
            });

            it('responds with 204 and removes the bookmark', () => {
                const idToRemove = 1;
                const expectedBookmark = testBookmarks.filter(bookmark => bookmark.id !== idToRemove);

                return supertest(app)
                    .delete(`/bookmarks/${idToRemove}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(204)
                    .then(() =>  // no response, using .then to complete steps in function
                        supertest(app)
                            .get(`/bookmarks`)
                            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                            .expect(expectedBookmark)
                    );
            });
        });
    });
    
    describe(`POST /bookmarks`, () => {
        // const requiredFields = ['title', 'url', 'rating'];
        // requiredFields.forEach(field => {
        //     const newBookmark = {
        //         title: 'Test new bookmark',
        //         url: 'https://maps.google.com',
        //         rating: 4
        //     }

        //     it(`responds with 400 and error message when '${field}' is missing`, () => 
        //     {
        //         delete newBookmark[field];  // this deletes all the fields and makes an empty object...
        //         return supertest(app)
        //             .post('/bookmarks')
        //             .send(newBookmark)
        //             .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        //             .expect(400, {
        //                 error: { message: `Missing '${field}' in request body`}
        //             });
        //     });
        // });

        // it(`responds with 400 invalid 'rating' if not between 0 and 5`, () => {
        //     const newBookmarkBadRating = {
        //         title: 'test-title',
        //         url: 'https://test.com',
        //         rating: 'invalid',
        //     }
        //     return supertest(app)
        //         .post(`/bookmarks`)
        //         .send(newBookmarkBadRating)
        //         .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        //         .expect(400, {
        //             error: { message: `'rating' must be between 0 and 5`}
        //         });
        // });

        // it(`responds with 400 invalid 'url' if it's not valid`, () => {
        //     const newBookmarkBadURL = {
        //         title: 'test-title',
        //         url: 'htp://bad-url',
        //         rating: 1
        //     }
        //     return supertest(app)
        //         .post(`/bookmarks`)
        //         .send(newBookmarkBadURL)
        //         .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        //         .expect(400, {
        //             error: { message: `'url' must be valid`}
        //         });
        // });

        it(`responds with 400 if missing 'title'`, () => {
            const newBookmarkNoTitle = {
                // title: 'test-title',
                url: 'https://test.com',
                rating: 1
            }
            return supertest(app)
                .post('/bookmarks')
                .send(newBookmarkNoTitle)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(400, {
                    error: { message: `'title' is required` }
            });
        });
        
        it(`responds with 400 if missing 'url'`, () => {
            const newBookmarkNoUrl = {
                title: 'test-title',
                // url: 'https://test.com',
                rating: 1
            }
            return supertest(app)
                .post('/bookmarks')
                .send(newBookmarkNoUrl)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(400, {
                    error: { message: `'url' is required` }
            });
        });

        it(`responds with 400 if missing 'rating'`, () => {
            const newBookmarkNoRating = {
                title: 'test-title',
                url: 'https://test.com',
                // rating: 1
            }
            return supertest(app)
                .post('/bookmarks')
                .send(newBookmarkNoRating)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(400, {
                    error: { message: `'rating' is required` }
            });
        });

        it(`responds with 400 if rating is not between 0 and 5`, () => {
            const newBookmarkBadRating = {
                title: 'test-title',
                url: 'https://test.com',
                rating: 'bad'
            }
            return supertest(app)
                .post('/bookmarks')
                .send(newBookmarkBadRating)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(400, {
                    error: { message: `'rating' must be a number between 0 and 5`}
                });
        });

        it(`responds with 400 invalid 'url' if not valid URL`, () => {
            const newBookmarkBadUrl = {
                title: 'test-title',
                url: 'htp://bad-url',
                rating: 1
            }
            return supertest(app)
                .post('/bookmarks')
                .send(newBookmarkBadUrl)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(400, {
                    error: { message: `'url' must be a valid URL`}
                });
        });

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
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
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
                        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                        .expect(postRes.body);
                });
        });

        it(`removes XSS attack content from response`, () => {
            const { badBookmark, expectedBookmark } = makeBadBookmark();
            return supertest(app)
                .post('/bookmarks')
                .send(badBookmark)
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(201)
                .expect(res => {
                    expect(res.body.title).to.eql(expectedBookmark.title);
                    expect(res.body.description).to.eql(expectedBookmark.description);
                });
        });
    });
});



