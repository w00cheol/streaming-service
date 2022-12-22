const express = require("express");
const app = express();
const fs = require("fs");
const mysql = require("mysql");
const stream = require("./index.ts");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config({path: path.join(__dirname, './.env')});

const pool = mysql.createPool({
  host            : process.env.DB_HOST, //아이피
  user            : process.env.DB_USER, //계정이름
  password        : process.env.DB_PASSWORD, //비밀번호
  port            : process.env.DB_PORT, //포트
  database        : process.env.DB_DATABASE, //
  connectionLimit : process.env.DB_CONNECTIONLIMIT //DB 이름
});

pool.getConnection((err, con) => {
  con.release();
  if(err){
    throw err;
  } else {
    console.log('MySQL 연결 성공!');
  }
});

selectQuery = async (sql, pool) => {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, con) => {
      if(err){
        con.release();
        reject(err);
      }

      con.query(sql, (err, rows) => {
        con.release();
        if(err) {
          reject(err);
        }
        else {
          resolve(rows);
        }
      });
    });
  }).catch(err => {throw err});
}

transactionQuery = async (sql, pool) => {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, con) => {
      if(err){
        con.release();
        reject(err);
      }
      
      con.beginTransaction();
      con.query(sql, (err, rows) => {
        if(err) {
          con.rollback();
          con.release();
          reject(err);
        }
        else {
          con.commit();
          con.release();
          resolve(rows);
        }
      });
    });
  }).catch(err => {throw err});
}

app.get("/", async function (req, res) {
  lists = '';
  rows = await selectQuery('select * from video', pool);
  for (var i = 0; i < Object.keys(rows).length; i++) {
    lists += `<p>
                <a href = "video/${encodeURIComponent(rows[i].url)}">${rows[i].title}</a>
                생성시간 : ${rows[i].DATE}
              <p>`;
  };
  res.send(`
    <!DOCTYPE html>
    <html lang="ko-KR">
      <body>
          <h1>메인 화면</h1>
          ${lists}
      </body>
      <a href = "upload">동영상 업로드</a>
    </html>
  `)
});

app.get("/upload", function (req, res) {
  res.send(`
    <!DOCTYPE html>
      <html lang="ko-KR">
        <body>
            <h1>제목 및 스트리밍 url 입력하시오</h1>
        </body>
        <form action='/insert' method = 'get'>
          제목 : <input name='upload_title' type='text'/><br>
          스트리밍 url : <input name='upload_url' type='text'/><br>
          <input type='submit' value='업로드'>
        </form>
    </html>
  `)
});

app.get("/insert", async function (req, res) {
  res.send(`
    <!DOCTYPE html>
      <html lang="ko-KR">
        업로드 중, 시간이 다소 걸릴 수 있습니다.
    </html>
  `)
  url = await stream.main(req.query.upload_url);
  console.log('업로드 완료!!');
  console.log(url);
  transactionQuery(`
    INSERT INTO
      video
    VALUES
      (
        '${req.query.upload_title}',
        '${req.query.url}',
        DEFAULT
      )
  `, pool);
});

app.get("/video/:url", function (req, res) {
  res.send(`
    <!DOCTYPE html>
      <html lang="ko-KR">
      <head>
          <meta charset="utf-8">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <title>제목</title>
          <meta name="description" content="">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <link href="//amp.azure.net/libs/amp/latest/skins/amp-default/azuremediaplayer.min.css" rel="stylesheet">
          <script src="//amp.azure.net/libs/amp/latest/azuremediaplayer.min.js"></script>

      </head>
      <body>
          <video id="azuremediaplayer" class="azuremediaplayer amp-default-skin amp-big-play-centered" tabindex="0"> </video>
          </div>
          <script>
              var myOptions = {
                  autoplay: true,
                  controls: true,
                  width: "640",
                  height: "400",
                  poster: "",
                  playbackSpeed: {
                    enabled: true,
                    initialSpeed: 1.0,
                    speedLevels: [
                        { name: "x4.0", value: 4.0 },
                        { name: "x3.0", value: 3.0 },
                        { name: "x2.0", value: 2.0 },
                        { name: "x1.75", value: 1.75 },
                        { name: "x1.5", value: 1.5 },
                        { name: "x1.25", value: 1.25 },
                        { name: "normal", value: 1.0 },
                        { name: "x0.75", value: 0.75 },
                        { name: "x0.5", value: 0.5 },
                    ]
                  }
              };
              var myPlayer = amp("azuremediaplayer", myOptions);
              myPlayer.src(
                  [
                      { src: "${decodeURIComponent(req.params.url)}", type: "application/vnd.ms-sstr+xml" },
                  ],
                  [
                      { src: "", srclang: "en", kind: "subtitles", label: "English" },
                  ]
              );
          </script>
      </body>
      </html>

    `
  )
});

app.listen(8080, function () {
  console.log("Listening on port 8080!");
});
