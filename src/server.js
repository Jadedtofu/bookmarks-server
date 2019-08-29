const knex = require('knex');
const app = require('./app');
const { PORT, DB_URL } = require('./config');

const db = knex({
    client: 'pg',
    connection: DB_URL,
});

app.set('db', db);  // app.set('property-name', 'property-value') to not have dependency cycle problem
                    // server.js creates the Knex instance to the app as a property called 'db'

app.listen(PORT, () => {
    console.log(`Server listening at http://localhost: ${PORT}`);
});

