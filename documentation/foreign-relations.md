### Foreign Key Relations

We want to be able to back our resources in any datastore we like, in any system we like. This means we can't rely on any database layer relationships to join resources.

#### Problem: supporting back-links

In other words, each resource would maintain its own linkage.

Consider these resources:

```
Bookings have people:
  "HPABCDE": {
    owner: "Dave"
  }

People have Bookings:
  "Dave": {
    bookings: [ "HPABCDE" ]
  }
  "Fred": {
    bookings: [ ]
  }
```

If I were to update the owner of HPABCDE to "Fred":
PATCH -> /bookings/HPABCDE/relationships/owner
then the dataset would look like this:

```
Bookings have people:
  "HPABCDE": {
    owner: "Fred"
  }

People have Bookings:
  "Dave": {
    bookings: [ "HPABCDE" ]
  }
  "Fred": {
    bookings: [ ]
  }
```

Notice the reverse linkage between bookings and people is now broken. We could get around this by automatically forcing other update requests:

```
PATCH -> /bookings/HPABCDE/relationships/owner
---- becomes
PATCH -> /bookings/HPABCDE/relationships/owner
PATCH -> /people/Dave/relationships/bookings
PATCH -> /people/Fred/relationships/bookings
```

All 3x requests combined will produce the desired end linkage:

```
Bookings have people:
  "HPABCDE": {
    owner: "Dave"
  }

People have Bookings:
  "Dave": {
    bookings: [ ]
  }
  "Fred": {
    bookings: [ "HPABCDE" ]
  }
```

The number of requests vary on the relationship (1-1, 1-many, many-many, many-1).

Consider now if one of the 3 updates fails - we need to rollback the other 2. We now have to do all of this:

```
PATCH -> /bookings/HPABCDE/relationships/owner
---- becomes
GET -> /bookings/HPABCDE/relationships/owner
GET -> /people/Dave/relationships/bookings
GET -> /people/Fred/relationships/bookings
PATCH -> /bookings/HPABCDE/relationships/owner
PATCH -> /people/Dave/relationships/bookings
PATCH -> /people/Fred/relationships/bookings
[if one fails...]
PATCH -> /bookings/HPABCDE/relationships/owner
PATCH -> /people/Dave/relationships/bookings
```

There's also now a racehazard whereby two people try to update the same resource and mess up the relations. This is solvable by passing in a checksum to the PATCH requests, allowing us to identify if a resource has been remotely modified. The checksum would need to be returned as a part of the JSON:API formatted response, alongside "id" and "type".

In a nutshell - all of the above is a terrible idea.


#### Solution: we only support forward-links

This:
```
Bookings have people:
  "HPABCDE": {
    owner: "Dave"
  }

People have Bookings:
  "Dave": {
    bookings: [ ]
  }
  "Fred": {
    bookings: [ "HPABCDE" ]
  }
```
becomes:
```
Bookings have people:
  "HPABCDE": {
    owner: "Dave"
  }

People don't know about their Bookings:
  "Dave": {

  }
  "Fred": {

  }
```

HOWEVER, we still want to maintain the reverse linkage, so we'll still offer up a linkage like this:
```
/rest/people/26aa8a92-2845-4e40-999f-1fa006ec8c63/bookings
```
although under the hood, we'll re-map it to something like this:
```
/rest/bookings/relationships/?customer=26aa8a92-2845-4e40-999f-1fa006ec8c63
```
and query for `bookings` where `customer=?`.

The main gotcha here is this in this situation:
```
  Bookings maintain links to People
  People maintain links to Trips
  Trips maintain links to Bookings
```
Looking up a person creates a reverse lookup against Bookings, creating a reverse lookup against Trips, causing a reverse lookup against People, creating a reverse lookup against....

Our solution here is to add `meta` blocks to relationships to inform the consumer what kind of linkage they are looking at, and to not provide foreign keys directly:
```
relationships: {
  author: {
    meta: {
      relation: "primary",
      readOnly: false
    },
    links: {
      // get information about the linkage - list of ids and types
      self: "http://localhost:16006/rest/comments/6b017640-827c-4d50-8dcc-79d766abb408/relationships/author",
      // get full details of all linked resources
      related: "http://localhost:16006/rest/comments/6b017640-827c-4d50-8dcc-79d766abb408/author"
    },
    data: {
      type: "people",
      id: "ad3aa89e-9c5b-4ac9-a652-6670f9f27587"
    }
  },
  article: {
    meta: {
      relation: "foreign",
      belongsTo: "articles",
      as: "author",
      readOnly: true,
      many: true
    },
    links: {
      // get information about the linkage - list of ids and types
      self: "http://localhost:16006/rest/articles/relationships/?comments=6b017640-827c-4d50-8dcc-79d766abb408",
      // get full details of all linked resources (perform a search against the foreign key)
      related: "http://localhost:16006/rest/articles/?filter[comments]=6b017640-827c-4d50-8dcc-79d766abb408"
    }
  }
}
```
