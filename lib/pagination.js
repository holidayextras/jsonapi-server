'use strict'
const pagination = module.exports = { }

const ourJoi = require('./ourJoi.js')
const url = require('url')

pagination.joiPageDefinition = {
  page: ourJoi.Joi.object().keys({
    offset: ourJoi.Joi.number()
      .description('The first record to appear in the resulting payload')
      .example(0),
    limit: ourJoi.Joi.number()
      .description('The number of records to appear in the resulting payload')
      .example(50)
  })
}

pagination.generateMetaSummary = (request, handlerTotal) => ({
  offset: request.params.page.offset,
  limit: request.params.page.limit,
  total: handlerTotal
})

pagination.validatePaginationParams = (request, deFaultPageParams = {}) => {
  if (!request.params.page) {
    request.params.page = { }
  }
  const page = request.params.page

  page.offset = parseInt(page.offset, 10) || 0
  page.limit = parseInt(page.limit, 10) || parseInt(deFaultPageParams.limit, 10) || 50
}

pagination.enforcePagination = (request, results) => results.slice(0, request.params.page.size)

pagination.generatePageLinks = (request, handlerTotal) => {
  const pageData = request.params.page
  if (!handlerTotal || !pageData) {
    return { }
  }

  const lowerLimit = pageData.offset
  const upperLimit = pageData.offset + pageData.limit

  if ((lowerLimit === 0) && (upperLimit > handlerTotal)) {
    return { }
  }

  const pageLinks = { }
  const theirRequest = url.parse(request.route.combined, true)
  theirRequest.search = null

  if (lowerLimit > 0) {
    theirRequest.query['page[offset]'] = 0
    pageLinks.first = url.format(theirRequest)

    if (pageData.offset > 0) {
      let previousPageOffset = pageData.offset - pageData.limit
      if (previousPageOffset < 0) {
        previousPageOffset = 0
      }
      theirRequest.query['page[offset]'] = previousPageOffset
      pageLinks.prev = url.format(theirRequest)
    }
  }

  if (upperLimit < handlerTotal) {
    let lastPage = (Math.floor(handlerTotal / pageData.limit) * pageData.limit)
    if (lastPage === handlerTotal) lastPage -= pageData.limit
    theirRequest.query['page[offset]'] = lastPage
    pageLinks.last = url.format(theirRequest)

    if ((pageData.offset + pageData.limit) < handlerTotal) {
      const nextPageOffset = pageData.offset + pageData.limit
      theirRequest.query['page[offset]'] = nextPageOffset
      pageLinks.next = url.format(theirRequest)
    }
  }

  return pageLinks
}
