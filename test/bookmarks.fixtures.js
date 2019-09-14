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

function makeBadBookmark() {
    const badBookmark = {
        id: 911,
        title: 'Naughty naughty very naughty <script>alert("xss");</script>',
        url: 'https://www.hackers.com',
        description: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
        rating: 1,
    }

    const expectedBookmark = {
        ...badBookmark,
        title: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
        description: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`
    }

    return {
        badBookmark,
        expectedBookmark,
      }
}

module.exports = {
    makeBookmarksArray,
    makeBadBookmark
}