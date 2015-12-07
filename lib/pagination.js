"use strict";
var pagination = module.exports = { };

var url = require("url");

pagination.generateMetaSummary = function(request, handlerTotal) {
  return {
    offset: request.params.page.offset,
    limit: request.params.page.limit,
    total: handlerTotal
  };
};

pagination.validatePaginationParams = function(request) {
  if (!request.params.page) {
    request.params.page = { };
  }
  var page = request.params.page;

  page.offset = parseInt(page.offset, 10) || 0;
  page.limit = parseInt(page.limit, 10) || 50;
};

pagination.enforcePagination = function(request, results) {
  return results.slice(0, request.params.page.size);
};

pagination.generatePageLinks = function(request, handlerTotal) {
  var pageData = request.params.page;
  if (!handlerTotal || !pageData) {
    return { };
  }

  var lowerLimit = pageData.offset;
  var upperLimit = pageData.offset + pageData.limit;

  if ((lowerLimit === 0) && (upperLimit > handlerTotal)) {
    return { };
  }

  var pageLinks = { };
  var theirRequest = url.parse(request.route.combined, true);
  theirRequest.search = null;

  if (lowerLimit > 0) {
    theirRequest.query["page[offset]"] = 0;
    pageLinks.first = url.format(theirRequest);

    if (pageData.offset > 0) {
      var previousPageOffset = pageData.offset - pageData.limit;
      if (previousPageOffset < 0) {
        previousPageOffset = 0;
      }
      theirRequest.query["page[offset]"] = previousPageOffset;
      pageLinks.prev = url.format(theirRequest);
    }
  }

  if (upperLimit < handlerTotal) {
    var lastPage = (Math.floor(handlerTotal / pageData.limit) * pageData.limit) - 1;
    theirRequest.query["page[offset]"] = lastPage;
    pageLinks.last = url.format(theirRequest);

    if ((pageData.offset + pageData.limit) < handlerTotal) {
      var nextPageOffset = pageData.offset + pageData.limit;
      theirRequest.query["page[offset]"] = nextPageOffset;
      pageLinks.next = url.format(theirRequest);
    }
  }

  return pageLinks;
};
