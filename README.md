# 喝酒之弈 H5 联机版

68 张海克斯酒桌卡牌的 H5 联机版。前端托管到 Vercel，房间状态通过 Firebase Realtime Database 实时同步。

## 本地预览

建议用任意静态服务器启动：

```bash
npx serve . -l 4173
```

直接双击 `index.html` 也能打开页面，但 Firebase CDN 模块在部分浏览器的 `file://` 环境下可能受限。

## 联机配置

1. 创建 Firebase 项目。
2. 在 Firebase Console 里添加一个 Web App，复制 Web App 配置。
3. 开启 Authentication 的 Anonymous 匿名登录。
4. 创建 Realtime Database。
5. 把 `firebase.rules.json` 里的规则复制到 Realtime Database Rules：

```json
{
  "rules": {
    "rooms": {
      "$roomCode": {
        ".read": true,
        ".write": "auth != null"
      }
    }
  }
}
```

6. 打开 `assets/firebase-config.js`，粘贴 Firebase 配置，并把 `enabled` 改成 `true`。

房间密码用于防止普通玩家误入房间。由于当前是纯前端实现，房间数据对数据库读权限开放，不适合作为高安全密码系统使用。

## 部署到 Vercel

方式一：把整个目录拖到 Vercel Dashboard 的新项目里。

方式二：安装并登录 Vercel CLI 后，在本目录执行：

```bash
npx vercel --prod
```

## 玩法

- 首页输入昵称，可以创建房间或输入房号加入房间。
- 房主可设置房间名、房间密码、初始手牌和手牌上限。
- 房主开始游戏后，每名玩家只看到自己的手牌；轮到自己时可以打出手牌、激活持续海克斯、摸牌或进入下一位。
- 弃牌可洗回牌堆，彩色牌、偷牌、百宝袋、棱彩百宝袋、神圣刷新等特殊牌已有自动处理。

理性饮酒。可以把惩罚替换成喝水、真心话或其他无酒精小游戏。
