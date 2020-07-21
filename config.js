/* eslint-disable prettier/prettier */
module.exports = {
    DbName: 'test',
    tokenSecret: '1928374656',
    DefaultHeaders: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
    noAuthRoutes: [
      
      'url',
      'event',
      'login',
      'products',
      'addproducts'
    ],
    mongoUrl: '', // north-virginia
  };
  