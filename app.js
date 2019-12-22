var createError = require("http-errors");
var express = require("express");
var path = require("path");
var fs = require("fs");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var session = require("express-session");
// connect-redis插件将session与redis做了关联，将session同时存进redis中去
var RedisStore = require("connect-redis")(session);

var userRouter = require("./routes/user");
var blogRouter = require("./routes/blog");

var app = express();

// 写日志
const ENV = process.env.NODE_ENV;
if (ENV !== "production") {
  app.use(logger("dev"));
} else {
  const logFileName = path.join(__dirname, "logs", "access.log");
  const writeStream = fs.createWriteStream(logFileName, {
    flags: "a"
  });
  app.use(
    logger("combined", {
      stream: writeStream
    })
  );
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

const redisClient = require("./db/redis");
const sessionStore = new RedisStore({
  client: redisClient
});

app.use(
  session({
    name: "user_sessionId",                      //设置cookie中，保存session的字段名称，默认为connect.sid
    resave: true,                               // 即使session没有被修改，也保存session值，默认为true
    saveUninitialized: true,                    //强制未初始化的session保存到数据库
    secret: "HELLO!#wo_zhe_shi_mi_yao@888",     // 密钥，将加密后的hash值放到cookie中，以防篡改
    cookie: {   //设置存放sessionid的cookie的相关选项
      path: "/", // 默认配置
      httpOnly: true, // 默认配置
      maxAge: 24 * 60 * 60 * 1000
    },
    // store持久化
    // store 会将session存进redis中去，没有的话，只是将session存在了内存中
    store: sessionStore //session的存储方式，默认为存放在内存中，我们可以自定义redis等
  })
);

app.use("/api/user", userRouter);
app.use("/api/blog", blogRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "dev" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
