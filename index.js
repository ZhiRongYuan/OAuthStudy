/*
 * Author: yuanzhirong
 * Date: 2023-03-06 11:32:06
 * LastEditors: yuanzhirong
 * LastEditTime: 2023-03-06 14:37:02
 * Description:
 */
import Koa from "koa";
import koaRouter from "koa-router";
import koaStatic from "koa-static";
import path from "path";
import axios from "axios";
import querystring from "query-string";
import jwt from "jsonwebtoken";
import jwtAuth from "koa-jwt";

const router = koaRouter();

const app = new Koa();

const accessTokens = {};

const __dirname = path.resolve();

const secret = "it's a secret";
app.use(koaStatic(__dirname + "/"));
const config = {
  client_id: "bad24740e34554a08568",
  client_secret: "55695fd6529dabaa294f67a9ff09e425b7ccd2d7",
};

router.get("/auth/github/login", async (ctx) => {
  // 重定向页面
  const path = `https://github.com/login/oauth/authorize?${querystring.stringify(
    {
      client_id: config.client_id,
    }
  )}`;
  ctx.redirect(path);
});

router.get("/auth/github/callback", async (ctx) => {
  const { code } = ctx.query;
  console.log("授权码:" + code);

  const params = {
    client_id: config.client_id,
    client_secret: config.client_secret,
    code,
  };
  const res = await axios.post(
    `https://github.com/login/oauth/access_token`,
    params
  );

  const { access_token } = querystring.parse(res.data);

  const uid = (Math.random() * 999999).toFixed();
  accessTokens[uid] = access_token;

  const token = jwt.sign(
    {
      data: uid,
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
    },
    secret
  );

  // 将token保存到localstorage =》 js
  // 关闭认证页面
  // 通知主页面认证完成  设置 success标志 (localstorage) + 页面轮训
//   ctx.response.body = `<script>
//         window.localStorage.setItem("authSuccess", "true");
//         window.localStorage.setItem("token","${token}");
//         window.close();
//     </script>`;
ctx.response.body = token
});

router.get(
  "/auth/github/userinfo",
  jwtAuth({
    secret,
  }),
  async (ctx) => {
    const access_token = accessTokens[ctx.state.user.data];
    const url = `https://api.github.com/user`;
    try {
      const res = await axios.get(url, {
        headers: {
          Authorization: `token ${access_token}`,
        },
      });
      console.log(res);
      ctx.body = res.data;
    } catch (e) {
      console.log(e);
      ctx.body = { name: "失败" };
    }
  }
);

app.use(router.routes()); /*启动路由*/
app.listen(3001);
