### Post Processing

The following examples can be demo'd via the example json:api implementation launched via `npm start`.

#### Inclusions

To include `author` and `tags` relations of `articles`:

http://localhost:16006/rest/articles?include=author,tags

To include `author`, `author`.`photos` and `tags` relations of `articles`:

http://localhost:16006/rest/articles?include=author.photos,tags

#### Filtering

To only show `articles` where the `title` attribute is exactly `mySpecificTitle`:

http://localhost:16006/rest/articles?filter[title]=mySpecificTitle

To only show `articles` where the `title` attribute is before `M` alphabetically:

http://localhost:16006/rest/articles?filter[title]=<M

To only show `articles` where the `title` attribute is after `M` alphabetically:

http://localhost:16006/rest/articles?filter[title]=>M

To only show `articles` where the `title` attribute is a case-insensitive match against `linux-rocks`:

http://localhost:16006/rest/articles?filter[title]=~linux-rocks

To only show `articles` where the `title` attribute contains `for`:

http://localhost:16006/rest/articles?filter[title]=:for

To only show included `authors``photos` where the `photos` `width` is greater than 500:

http://localhost:16006/rest/articles?include=author.photos&filter[author][photos][width]=>500

#### Fields

To only bring back `articles` `title` and `content` fields:

http://localhost:16006/rest/articles?fields[articles]=title,content

To only bring back `articles` `title` and `content` fields, and `photos` `url` fields:

http://localhost:16006/rest/articles?include=photos&fields[articles]=title,content&fields[photos]=url

#### Sorting

To sort `articles` `DESC` by `title`:

http://localhost:16006/rest/articles?sort=-title

To sort `articles` `ASC` by `title`:

http://localhost:16006/rest/articles?sort=+title

#### Pagination

Use `page[limit]=50` to limit the number of resources in a search request to 50.

Use `page[offset]=10` to chose which resulting resource should start the result set.

To fetch resources 100-149:
http://localhost:16006/rest/articles?page[offset]=100&page[limit]=50
