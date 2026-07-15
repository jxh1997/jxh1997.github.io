问题：什么是域名

**域名**就是互联网上给网站/服务起的“好记的名字”。

你可以把它理解成：

> **域名 = 网站的门牌号昵称**
> **IP 地址 = 服务器真正的地址**

用户不可能记住一串 IP，比如：

```text
8.8.8.8
123.60.88.21
```

所以我们用更容易记的域名：

```text
baidu.com
google.com
gloway.top
test.gloway.top
```

---

# 1. 域名解决什么问题？

服务器在互联网上真正靠 **IP 地址** 找到。

比如你的服务器可能有一个公网 IP：

```text
101.35.xx.xx
```

但你不可能让用户访问：

```text
http://101.35.xx.xx
```

这样很难记，也不专业。

所以你买一个域名，比如：

```text
gloway.top
```

然后把这个域名指向服务器 IP。

用户访问：

```text
https://gloway.top
```

系统背后会找到：

```text
gloway.top → 101.35.xx.xx
```

这就是域名的作用。

---

# 2. 域名和 IP 的关系

可以这样理解：

| 概念    | 类比         | 示例                    |
| ----- | ---------- | --------------------- |
| IP 地址 | 房子的真实地址    | 101.35.xx.xx          |
| 域名    | 房子的名字/门牌昵称 | gloway.top            |
| DNS   | 通讯录/导航系统   | 查询 gloway.top 对应哪个 IP |
| 服务器   | 房子本身       | 部署网站和接口的机器            |

用户访问域名时，并不是直接访问“名字”，而是先通过 DNS 找到 IP。

完整过程是：

```text
用户输入 gloway.top
↓
浏览器询问 DNS：gloway.top 对应哪个 IP？
↓
DNS 返回服务器 IP
↓
浏览器访问这个 IP 对应的服务器
↓
服务器返回网页或接口数据
```

---

# 3. 什么是 DNS？

DNS 可以理解为：

> **域名和 IP 的翻译系统。**

因为电脑真正认识的是 IP，不认识域名。

例如：

```text
gloway.top → 101.35.xx.xx
```

这个对应关系就叫 **DNS 解析记录**。

你在腾讯云、阿里云、Cloudflare 里配置域名解析，本质就是告诉全网：

```text
访问 gloway.top 的人，请去 101.35.xx.xx 这台服务器。
```

---

# 4. 域名结构怎么看？

以这个域名为例：

```text
www.test.gloway.top
```

可以拆成：

```text
top              顶级域名
gloway           主域名
test             子域名
www              更下一级子域名
```

再看几个例子：

```text
gloway.top
www.gloway.top
test.gloway.top
api.gloway.top
admin.gloway.top
```

它们不是完全一样的域名。

---

# 5. 主域名和子域名

假设你买了：

```text
gloway.top
```

这叫主域名，或者根域名。

你可以基于它配置很多子域名：

```text
www.gloway.top        官网
api.gloway.top        接口服务
admin.gloway.top      后台管理
test.gloway.top       测试环境
img.gloway.top        图片资源
```

这些子域名都可以指向同一台服务器，也可以指向不同服务器。

例如：

```text
gloway.top        → 服务器A
www.gloway.top    → 服务器A
api.gloway.top    → 服务器B
test.gloway.top   → 测试服务器
```

---

# 6. www 是什么？

很多人以为 `www` 是必须的，其实不是。

```text
gloway.top
www.gloway.top
```

这两个是不同的访问地址。

`www` 只是一个常见子域名，全称是：

```text
World Wide Web
```

现在很多网站会同时支持：

```text
gloway.top
www.gloway.top
```

然后通过 Nginx 或 DNS 统一跳转。

比如：

```text
www.gloway.top → gloway.top
```

或者：

```text
gloway.top → www.gloway.top
```

产品经理需要关注的是：

> 你的产品到底对外使用哪个作为正式访问地址。

---

# 7. 域名和网站不是一回事

这是一个常见误区。

域名只是地址，不等于网站本身。

比如你买了：

```text
gloway.top
```

但如果你没有：

```text
配置 DNS
部署服务器
配置 Nginx
部署前端页面
启动后端服务
配置 HTTPS 证书
```

那访问这个域名可能什么都看不到。

所以完整网站需要：

```text
域名
↓
DNS解析
↓
服务器
↓
Nginx
↓
前端页面/后端接口
↓
数据库
```

域名只是入口。

---

# 8. 域名和 Nginx 的关系

DNS 负责把域名指向服务器 IP。

但是到了服务器之后，还需要 Nginx 判断：

> 这个域名访问进来后，应该交给哪个服务处理？

比如你的服务器上有多个项目：

```text
主系统后台
测试系统后台
学校情报系统
API接口服务
静态页面
```

Nginx 可以根据域名或路径分发：

```text
gloway.top              → 正式前端页面
www.gloway.top          → 正式前端页面
test.gloway.top         → 测试环境前端页面
test.gloway.top/api     → 测试环境后端接口
gloway.top/api          → 正式环境后端接口
```

所以关系是：

```text
域名解析 DNS：负责找到服务器
Nginx：负责服务器内部转发到哪个项目
```

---

# 9. 域名和 HTTPS 证书的关系

你看到的网址有两种：

```text
http://gloway.top
https://gloway.top
```

区别是：

```text
HTTP：普通访问，不加密
HTTPS：加密访问，更安全
```

如果你想让网站支持 HTTPS，就需要给域名申请 SSL 证书。

证书通常是绑定域名的。

比如你给：

```text
gloway.top
```

申请证书，不一定自动支持：

```text
test.gloway.top
www.test.gloway.top
```

除非证书覆盖这些域名。

常见证书类型：

```text
单域名证书：只支持 gloway.top
多域名证书：支持多个指定域名
通配符证书：支持 *.gloway.top
```

例如：

```text
*.gloway.top
```

可以支持：

```text
www.gloway.top
test.gloway.top
api.gloway.top
admin.gloway.top
```

但通常不支持：

```text
www.test.gloway.top
```

因为这是更深一层的子域名。

---

# 10. 产品经理要怎么理解域名？

产品经理不一定要会完整配置域名，但必须知道域名影响这些东西：

## 1. 访问入口

用户从哪里访问？

```text
官网：gloway.top
后台：www.gloway.top/admin
测试环境：test.gloway.top
接口：api.gloway.top
```

---

## 2. 环境区分

常见环境：

```text
dev：开发环境
test：测试环境
staging：预发布环境
prod：生产环境
```

可能对应域名：

```text
dev.gloway.top
test.gloway.top
staging.gloway.top
gloway.top
```

产品经理要避免把测试环境链接发给真实用户。

---

## 3. 小程序接口合法域名

如果是微信小程序，接口域名要在微信公众平台配置合法域名。

比如小程序要请求：

```text
https://api.gloway.top
```

那这个域名必须配置到小程序后台的 request 合法域名里。

否则小程序请求会失败。

---

## 4. 跨域问题

前端页面和接口域名不一致时，可能涉及跨域。

例如：

```text
前端：www.gloway.top
接口：api.gloway.top
```

这时浏览器会有跨域安全限制，需要后端配置 CORS 或 Nginx 代理。

产品经理不用深入代码，但要知道：

> 页面和接口不是同一个域名时，可能会有跨域问题。

---

## 5. 品牌与可信度

域名也是品牌资产。

比如：

```text
gloway.top
```

比：

```text
101.35.xx.xx:3001
```

更专业、更可信。

---

# 11. 一个完整访问链路

假设用户访问：

```text
https://test.gloway.top/api/user/list
```

背后发生的是：

```text
1. 浏览器识别域名：test.gloway.top
2. DNS 查询它对应哪个服务器 IP
3. 找到服务器
4. HTTPS 证书校验这个域名是否合法
5. 请求进入服务器的 Nginx
6. Nginx 判断 /api 路径
7. Nginx 把请求转发到后端服务
8. 后端查询数据库
9. 后端返回用户列表
10. 浏览器收到结果
```

所以一个域名访问失败，可能不是“域名本身坏了”，可能是任意一层出问题：

```text
DNS解析没配
服务器没开
Nginx配置错
HTTPS证书错
后端服务没启动
接口路径错
数据库连接失败
防火墙没放行
```

---

# 12. 常见域名问题

## 问题 1：域名解析了，但访问不到

可能原因：

```text
DNS还没生效
服务器防火墙没放行80/443端口
Nginx没启动
Nginx配置错误
服务没启动
```

---

## 问题 2：HTTP 能访问，HTTPS 不能访问

可能原因：

```text
没有配置SSL证书
证书过期
证书和域名不匹配
443端口没开放
Nginx HTTPS 配置错误
```

---

## 问题 3：www 可以访问，非 www 不行

说明这两个域名没有同时配置。

需要分别配置：

```text
gloway.top
www.gloway.top
```

---

## 问题 4：测试环境访问到了正式环境

可能是：

```text
DNS指错服务器
Nginx server_name 配错
路径代理配置错
前端接口地址配置错
```

---

# 13. 你需要记住的核心结论

域名本质上就是：

> **一个方便人记忆的访问名称，通过 DNS 指向服务器 IP。**

但在真实项目里，域名会涉及：

```text
DNS解析
服务器IP
Nginx转发
HTTPS证书
前后端接口
小程序合法域名
跨域
测试环境和生产环境隔离
```

所以产品经理理解域名时，不要只停留在“网址”，而要把它看成：

> **产品访问入口 + 系统环境标识 + 服务路由入口 + 品牌资产。**
