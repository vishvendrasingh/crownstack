const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
let {
    rollbarAccessToken, noAuthRoutes, mongoUrl, DbName, DefaultHeaders, tokenSecret,
  } = require('./config');

let cachedDb = null;
const routes = {};

/** * As recommendation https://docs.atlas.mongodb.com/best-practices-connecting-to-aws-lambda/ */
async function connectToDatabase({ isDev }) {
  try {
    if (cachedDb) {
      return Promise.resolve(cachedDb); // rollbar.log('=> using cached database instance');
    }
    mongoUrl = (isDev) ? 'mongodb://127.0.0.1:27017' : mongoUrl;
    cachedDb = await MongoClient.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    return cachedDb;
  } catch (e) {
    /** * task - trigger High alert */
    throw e;
  }
}

const response = (statusCode = 400, ...res) => {
  let headers = res.find((x) => ((x && x.headers) ? x.headers : null));
  headers = (headers && headers.headers) ? headers.headers : headers;
  return {
    statusCode,
    headers: (headers) || DefaultHeaders,
    body: JSON.stringify((res[1]) ? res[1] : res[0]), // aws api
  };
};


routes.products = async ({dbo, event, body}) => {
  const result = await dbo
  .collection('products')
  .find({})
  .toArray();
  return result
}

routes.addproducts = async ({dbo, event, body}) => {
  const result = await dbo.collection('products').insertOne(
    {
      name: body.name,
      description: body.description,
      price: body.price,
      make: body.make,
      createdAt: new Date(),
    },
  );
  return result
}

routes.addtocart = async ({dbo, event, body}) => {
  const result = await dbo.collection('cart').updateOne( {uid:ObjectId(event._id) },
    {
      $set:{
      uid: ObjectId(event._id),
      products: body,
      updatedAt: new Date(),
    }
  }, { upsert:true });
  return result
}

routes.getcart = async ({dbo, event, body}) => {
  const result = await dbo
  .collection('cart')
  .find({uid:ObjectId(event._id)})
  .toArray();
  return result
}

routes.login = async ({dbo, event, body}) => {
  try {
    const { email, password } = body;
    if (!email || !password) throw 'Invalid params!';
    // if (isValidEmail(email)) throw { message: 'Email not valid', ref: 'email' };

    const mongoResult = await dbo.collection('users').findOne({ email,password });
    if (!mongoResult) { throw 'User not found!'; }
    const id = mongoResult._id;

    const token = await jwt.sign(JSON.stringify({ _id: id }), tokenSecret);
    /** *update in database */
    
    return { token: `Bearer ${token}` };
  } catch (e) { throw e.stack || e; }
}

const authCheck = async (token = '') => {
  try {
    const parts = token.split(' ');
    if (parts.length === 2) {
      const scheme = parts[0];
      const token = parts[1];
      if (/^Bearer$/i.test(scheme)) {
        return token;
      } throw 'Wrong token scheme';
    } else throw 'Wrong token length';
  } catch (e) {
    throw e.stack || e;
  }
};


exports.handler = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;

  try {
    const route = event.url.replace("/","")
    const { isDev } = event;
    // console.log(event.body)
    // console.log(event)
    let body={};
      if (event.body) { body = (typeof event.body === 'string') ? JSON.parse(event.body) : event.body; }
      else if (event.queryStringParameters) { body = event.queryStringParameters; }
      /** * if _id is sent in body change it to id */

    const db = await connectToDatabase({ isDev });
    const dbo = db.db(DbName);
    
    if (!noAuthRoutes.includes(route)) {
      event.token = event['headers']['authorization']
      // console.log(body.token)

      if (!event.token) { return response(400, 'send token'); }
      let token = await authCheck(event.token);
      try {
        const tokenObj = await jwt.verify(token, tokenSecret)
        event._id = tokenObj['_id']
      } catch (e) {
        console.log(e)
        return response(401, 'unauthorized');
        // return response(400, 'invalid token!');
      }
    }// authenticated routes
    
    const result = await routes[route]({dbo, event, body})

    return response(200, result);

  } catch (e) {
    console.log(e);
    e = (e instanceof Error) ? e.toString() : e;
    return response(400, e);
  }
}