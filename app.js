/* eslint-disable prettier/prettier */
const http = require('http');
// const request = require('request-promise');
const index = require('./index');
//const eventJson = require('./test/event.json');
//const eventJsonGet = require('./test/event_get.json');
// const eventJson = {}
// const eventJsonGet = {}
const { handler } = index;
// create a server object:
http.createServer(async (req, res) => {
  try {
    let body = '';
    if (req.method === 'POST') {
      // console.log('POST')
      // console.log(req.headers)
      await req.on('data', async (data) => {
        body += data;
        //   console.log('Partial body: ' + body)
      });
      await req.on('end', async () => {
        const eventJson = req
        eventJson.body = JSON.parse(body) || null;
        eventJson.isDev = true;
        if (req.headers.authorization) eventJson.headers.authorization = req.headers.authorization;
        // console.log('Body_new: ' + JSON.stringify(body))
        // response.writeHead(200, {'Content-Type': 'text/html'})
        // response.end('post received')
        const r = await handler(eventJson, {}).then((r) => {
          try {
            //  console.log("sent-r-",r)
            res.writeHead(
              r.statusCode,
              r.headers,
              // {
              // "Access-Control-Allow-Origin": "*",
              // 'Content-Type': 'application/json'
              // }
            );
            res.write(r.body); // write a response to the client
            res.end();
            // res.write(JSON.stringify(r.body)); //write a response to the client
            // console.log("event----",r.body)
            // console.log("event----",typeof r.body)
          } catch (e) {
            console.log('app->', e);
          }
        });
      });
      if (!body || body === '') {
        res.writeHead(404, {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        });
        res.write('Route not found'); // write a response to the client
        res.end();
      }

      // // console.log("sent-r-",r)

      // console.log(
      //     // req,
      //     req.body,
      // await handler(JSON.parse(body), {}).then((r) => {
    } else if (req.method === 'OPTIONS') {
      res.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        // "Content-Type": "application/json",
        'Access-Control-Allow-Methods':
                    'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT',
        'Access-Control-Allow-Headers':
                    'Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With',
      });
      // res.write('Get Done');
      res.end();
    } else if (req.method === 'GET') {
      // await req.on('data', async (data) => {
      //   body += data;
      // });
      // await req.on('end', async () => {
      // eventJsonGet.body = JSON.parse(body) || null;
      const eventJsonGet= req;
      eventJsonGet.isDev = true;
      if (req.headers.authorization) eventJsonGet.headers.authorization = req.headers.authorization;
      await handler(eventJsonGet, {}).then((r) => {
        try {
          // console.log('sendinganser');
          res.writeHead(
            r.statusCode,
            r.headers,

          );
          res.write(r.body); // write a response to the client
          res.end();
        } catch (e) {
          console.log('app->', e);
        }
      });
      // });
      // if (!body || body === '') {
      //   res.writeHead(404, {
      //     'Access-Control-Allow-Origin': '*',
      //     'Content-Type': 'application/json',
      //   });
      //   res.write('Route not found'); // write a response to the client
      //   res.end();
      // }
    }
  } catch (e) {
    console.log('app->', e);
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      // 'Content-Type': 'application/json'
    });
    res.write(e.stack || e);
    res.end();
  }
// }).listen(3001, '0.0.0.0'); // the server object listens on port 8080
}).listen(3000, '0.0.0.0');
