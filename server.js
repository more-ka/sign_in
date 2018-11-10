var http = require('http')
var fs = require('fs')
var url = require('url')
var port = process.argv[2]

if (!port) {
  console.log('请指定端口号好不啦？\n node server.js 8888 这样不会吗？')
  process.exit(1)
}

var server = http.createServer(function (request, response) {
  var parsedUrl = url.parse(request.url, true)
  var pathWithQuery = request.url
  var queryString = ''
  if (pathWithQuery.indexOf('?') >= 0) {
    queryString = pathWithQuery.substring(pathWithQuery.indexOf('?'))
  }
  var path = parsedUrl.pathname
  var query = parsedUrl.query
  var method = request.method

  
  /******** 从这里开始看，上面不要看 ************/

  console.log('方方说：含查询字符串的路径\n' + pathWithQuery)

  if (path === '/main.html') {
    let string = fs.readFileSync('./main.html', 'utf8')
    let cookie = request.headers.cookie.split('; ')
    let hash = {}
    for(let i = 0;i<cookie.length;i++){
      let io = cookie[i].split('=')
      let key = io[0]
      let value = io[1]
      hash[key] = value
    }
    let email = hash.sign_in_email
    let users = fs.readFileSync('./db/users','utf8')
    users = JSON.parse(users)
    let foundUser
    for(let i=0;i< users.length;i++){
      if(users[i].email === email){
        foundUser = users[i]
        break
      }
    }
    console.log(foundUser)
    if(foundUser){
      string = string.replace('__password__', foundUser.password)
    }else{
      string = string.replace('__password__','不知道')
    }
    response.statusCode = 200
    response.setHeader('Content-Type', 'text/html;charset=utf-8')
    response.write(string)
    response.end()
  } else if (path === '/sign_up.html' && method === 'GET') {
    let string = fs.readFileSync('./sign_up.html', 'utf8')
    response.statusCode = 200
    response.setHeader('Content-Type', 'text/html;charset=utf-8')
    response.write(string)
    response.end()
  } else if (path === '/sign_up.html' && method === 'POST') {
    readBody(request).then((body) => {
      let strings = body.split('&')
      let hash = {}
      strings.forEach((string) => {
        let io = string.split('=') //'email','1'
        let key = io[0]
        let value = io[1]
        hash[key] = decodeURIComponent(value) //@ ---> %40
      })
      // let email = hash['email']
      // let password = hash['password']
      //let password_confirm = hash['password_confirm']
      let {
        email,
        password,
        password_confirm
      } = hash
      console.log(email)
      response.setHeader('Content-Type', 'text/html;charset=utf-8')
      if (email.indexOf('@') === -1) { //查询不到@返回-1
        response.statusCode = 400
        response.setHeader('Content-Type', 'text/json;charset=utf-8')
        response.write(`{
        "errors":{
          "error":"invalid"
        }
        }`)
      } else if (password !== password_confirm) {
        response.statusCode = 400
        response.write('password not match')
      } else {
        let users = fs.readFileSync('./db/users', 'utf8')
        try {
          users = JSON.parse(users) //如果不成功就执行catch
        } catch (exception) {
          users = []
        }
        let inUse = false
        for (i = 0; i < users.length; i++) {
          let user = users[i]
          if (user.email === email) {
            inUse = true
            break;
          }
        }
        if (inUse) {
          response.statusCode = 400
          response.setHeader('Content-Type', 'text/json;charset=utf-8')
          response.write(`{
          "errors":{
            "error":"inuse"
          }
          }`)
          response.end()
        } else {
          users.push({
            email: email,
            password: password
          })
          var usersString = JSON.stringify(users)
          fs.writeFileSync('./db/users/', usersString)
          response.statusCode = 200
        }
      }
      response.end()
    })
  } else if (path === '/sign_in.html' && method === 'GET') {
    let string = fs.readFileSync('./sign_in.html', 'utf8')
    response.statusCode = 200
    response.setHeader('Content-Type', 'text/html;charset=utf-8')
    response.write(string)
    response.end()
  } else if (path === '/sign_in.html' && method === 'POST') {
    readBody(request).then((body) => {
      let strings = body.split('&')
      let hash = {}
      strings.forEach((string) => {
        let io = string.split('=') //'email','1'
        let key = io[0]
        let value = io[1]
        hash[key] = decodeURIComponent(value) //@ ---> %40
      })
      let {
        email,
        password
      } = hash
      console.log('meail:', email, password)
      if (email.indexOf('@') === -1) { //查询不到@返回-1
        response.statusCode = 400
        response.setHeader('Content-Type', 'text/json;charset=utf-8')
        response.write(`{
        "errors":{
          "error":"invalid"
        }
        }`)
      } else {
        let users = fs.readFileSync('./db/users', 'utf8')
        try {
          users = JSON.parse(users) //如果不成功就执行catch
        } catch (exception) {
          users = []
        }
        let found = false
        for (let i = 0; i < users.length; i++) {
          console.log(users[i])
          if (users[i].email === email && users[i].password === password) {
            found = true
            break
          }else
          if (users[i].email !== email) {
            response.statusCode = 401
            response.setHeader('Content-Type', 'text/json;charset=utf-8')
            response.write(`{
            "errors":{
              "error":"emailError"
            }
          }
          `)

            break
          }else if(users[i].password !== password) {
            response.statusCode = 401
            response.setHeader('Content-Type', 'text/json;charset=utf-8')
            response.write(`{
          "errors":{
            "error":"passwordError"
          }
          }`)
          }
        }
        if (found) {
          // Set-Cookie: <cookie-name>=<cookie-value> 
          response.setHeader('Set-Cookie',`sign_in_email=${email};HttpOnly`)
          response.statusCode = 200
          response.end()
        }
      }
      response.end()
    })
  } else if (path === '/main.js') {
    let string = fs.readFileSync('./main.js', 'utf8')
    response.statusCode = 200
    response.setHeader('Content-Type', 'text/javascript;charset=utf-8')
    response.write(string)
    response.end()
  } else if (path === '/xxx') {
    response.statusCode = 200
    response.setHeader('Content-Type', 'text/json;charset=utf-8')
    response.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:8080/sign_up.html')
    response.write(`
    {
      "note":{
        "to": "小谷",
        "from": "方方",
        "heading": "打招呼",
        "content": "hi"
      }
    }
    `)
    response.end()
  } else {
    response.statusCode = 404
    response.setHeader('Content-Type', 'text/html;charset=utf-8')
    response.write(`
      {
        "error": "not found"
      }
    `)
    response.end()
  }

  /******** 代码结束，下面不要看 ************/
})

function readBody(request) {
  return new Promise((resolve, reject) => { //resolve，reject表示异步操作成功后 失败后的回调函数
    let body = []
    request.on('data', (chunk) => {
      body.push(chunk);
    }).on('end', () => {
      body = Buffer.concat(body).toString()
      resolve(body)
    })
  })
}
server.listen(port)
console.log('监听 ' + port + ' 成功\n请用在空中转体720度然后用电饭煲打开 http://localhost:' + port)