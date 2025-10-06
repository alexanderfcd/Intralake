module.exports = (req) => {
  const body = Object.assign({}, req.body);
  const query = Object.assign({}, req.query);
  for (let i in body) {
    if (body[i] === "undefined") {
      body[i] = undefined;
    }
    if (body[i] === "null") {
      body[i] = null;
    }
    if (typeof body[i] === "string") {
      body[i] = body[i].trim();
    }
  }
  for (let i in query) {
    if (query[i] === "undefined") {
      query[i] = undefined;
    }
    if (query[i] === "null") {
      query[i] = null;
    }
    if (typeof query[i] === "string") {
      query[i] = query[i].trim();
    }
  }
  return { body, query };
};
