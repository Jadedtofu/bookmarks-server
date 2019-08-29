function makeBookmarksArray() {
    return [
        {
            id: 1,
            title: 'Test title 1',
            url: 'https://www.google.com',
            description: 'Google homepage',
            rating: 5
        },
        {
            id: 2,
            title: 'Test title 2',
            url: 'https://www.youtube.com',
            description: 'YouTube homepage',
            rating: 4
        },
        {
            id: 3,
            title: 'Test title 3',
            url: 'https://www.twitch.tv',
            description: 'Twitch homepage',
            rating: 4

        },
        {
            id: 4,
            title: 'Test title 4',
            url: 'https://twitter.com/',
            description: 'Twitter homepage',
            rating: 3
        },
        {
            id: 5,
            title: 'Test title 5',
            url: 'https://www.amazon.com',
            description: 'Amazon homepage',
            rating: 5
        }
    ];
}

module.exports = {
    makeBookmarksArray
}