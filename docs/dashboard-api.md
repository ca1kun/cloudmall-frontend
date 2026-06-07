# Dashboard (商家大屏) API Documentation

> Target date: 2026-06-04
> Base URL: `/api`
> Auth: `Authorization: Bearer <token>`

---

## Common

### Response envelope
```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

---

## 1. 核心指标卡片

### `GET /merchant/dashboard/metrics`

获取商家运营核心指标，用于大屏顶部卡片展示。

**Response data**
```json
{
  "sales": {
    "label": "总销售额",
    "value": 1286560,
    "valueText": "¥ 1,286,560",
    "trend": 18.4,
    "trendText": "+18.4%",
    "direction": "up",
    "subtext": "较上周提升 18.4%"
  },
  "orders": {
    "label": "今日订单",
    "value": 358,
    "valueText": "358",
    "trend": 12.8,
    "trendText": "+12.8%",
    "direction": "up",
    "subtext": "今日实时成交 358 单"
  },
  "activeUsers": {
    "label": "活跃用户",
    "value": 8920,
    "valueText": "8,920",
    "trend": 6.2,
    "trendText": "+6.2%",
    "direction": "up",
    "subtext": "近 24h 访问持续增长"
  },
  "goodsCount": {
    "label": "在售商品",
    "value": 1284,
    "valueText": "1,284",
    "trend": -1.3,
    "trendText": "-1.3%",
    "direction": "down",
    "subtext": "库存结构保持稳定"
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `sales` | MetricCard | 总销售额指标 |
| `orders` | MetricCard | 今日订单指标 |
| `activeUsers` | MetricCard | 活跃用户指标 |
| `goodsCount` | MetricCard | 在售商品指标 |

#### MetricCard
| 字段 | 类型 | 说明 |
|------|------|------|
| `label` | string | 指标名称 |
| `value` | number | 原始数值 |
| `valueText` | string | 格式化后的展示文本 |
| `trend` | number | 环比变化率（正数为增长，负数为下降） |
| `trendText` | string | 格式化后的变化率文本 |
| `direction` | string | `up` 上升 / `down` 下降 |
| `subtext` | string | 副标题说明 |

---

## 2. 销售与订单趋势

### `GET /merchant/dashboard/trend`

获取近 7 日销售额、订单数与客单价走势数据，用于折线图展示。

**Query Parameters**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `days` | number | 否 | 查询天数，默认 `7`，范围 `3~30` |

**Response data**
```json
{
  "days": ["周一", "周二", "周三", "周四", "周五", "周六", "周日"],
  "sales": [98, 132, 121, 156, 184, 210, 198],
  "orders": [62, 74, 58, 81, 92, 108, 96],
  "averageOrderValue": [1590, 1780, 1710, 1835, 1890, 1945, 1908]
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `days` | string[] | 日期标签数组 |
| `sales` | number[] | 每日销售额（单位：万元或元，根据业务定） |
| `orders` | number[] | 每日订单数 |
| `averageOrderValue` | number[] | 每日客单价 |

---

## 3. 品类占比

### `GET /merchant/dashboard/category-share`

获取按订单量划分的品类结构数据，用于环形图展示。

**Response data**
```json
{
  "data": [
    { "name": "手机数码", "value": 38 },
    { "name": "电脑办公", "value": 22 },
    { "name": "日用百货", "value": 18 },
    { "name": "食品饮料", "value": 14 },
    { "name": "其他", "value": 8 }
  ]
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | string | 品类名称 |
| `value` | number | 占比百分比（总和应为 100） |

---

## 4. 渠道订单

### `GET /merchant/dashboard/channel-orders`

获取本周各渠道订单量对比数据，用于横向柱状图展示。

**Query Parameters**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `period` | string | 否 | 统计周期，`week` 本周 / `month` 本月，默认 `week` |

**Response data**
```json
{
  "channels": ["小程序", "APP", "PC端", "门店", "抖音"],
  "orders": [320, 268, 214, 180, 132]
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `channels` | string[] | 渠道名称数组 |
| `orders` | number[] | 对应渠道的订单量数组 |

---

## 5. 热销商品排行

### `GET /merchant/dashboard/top-products`

获取销量最高的商品排行数据，用于表格展示。

**Query Parameters**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `limit` | number | 否 | 返回条数，默认 `10`，范围 `5~20` |
| `period` | string | 否 | 统计周期，`week` 本周 / `month` 本月 / `all` 全部，默认 `week` |

**Response data**
```json
{
  "list": [
    { "rank": 1, "name": "小米 14 Pro", "count": 1260 },
    { "rank": 2, "name": "iPhone 15 Pro Max", "count": 1098 },
    { "rank": 3, "name": "华为 Mate 60 Pro", "count": 934 },
    { "rank": 4, "name": "罗技 MX Master 3S", "count": 821 },
    { "rank": 5, "name": "三只松鼠 坚果礼盒", "count": 612 },
    { "rank": 6, "name": "维达 抽纸 4 层", "count": 524 }
  ]
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `rank` | number | 排名 |
| `name` | string | 商品名称 |
| `count` | number | 销量 |

---

## 6. 最新订单

### `GET /merchant/dashboard/recent-orders`

获取最近成交的订单列表，用于表格展示。

**Query Parameters**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `limit` | number | 否 | 返回条数，默认 `5`，范围 `5~20` |

**Response data**
```json
{
  "list": [
    {
      "orderNo": "OD202604260001",
      "customer": "张先生",
      "amount": 1299.00,
      "amountText": "¥ 1,299",
      "status": "PAID",
      "statusText": "已支付",
      "statusType": "success",
      "createTime": "2026-04-26 10:30:00"
    },
    {
      "orderNo": "OD202604260002",
      "customer": "李女士",
      "amount": 2899.00,
      "amountText": "¥ 2,899",
      "status": "PENDING_SHIPMENT",
      "statusText": "待发货",
      "statusType": "warning",
      "createTime": "2026-04-26 10:25:00"
    }
  ]
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `orderNo` | string | 订单号 |
| `customer` | string | 客户姓名 |
| `amount` | number | 订单金额 |
| `amountText` | string | 格式化后的金额文本 |
| `status` | string | 订单状态码 |
| `statusText` | string | 状态中文描述 |
| `statusType` | string | Element Plus Tag 类型：`success` / `warning` / `info` / `danger` |
| `createTime` | string | 下单时间 `YYYY-MM-DD HH:mm:ss` |

#### 订单状态映射
| status | statusText | statusType |
|--------|-----------|------------|
| `PAID` | 已支付 | `success` |
| `PENDING_SHIPMENT` | 待发货 | `warning` |
| `SHIPPED` | 配送中 | `info` |
| `COMPLETED` | 已完成 | `success` |
| `CANCELED` | 已取消 | `danger` |

---

## 7. 大屏数据聚合（可选）

### `GET /merchant/dashboard/overview`

一次性获取大屏所需的所有数据，减少前端请求次数。

**Query Parameters**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `trendDays` | number | 否 | 趋势图天数，默认 `7` |
| `topLimit` | number | 否 | 热销商品条数，默认 `10` |
| `recentLimit` | number | 否 | 最新订单条数，默认 `5` |

**Response data**
```json
{
  "metrics": {
    "sales": { "label": "总销售额", "valueText": "¥ 1,286,560", "trendText": "+18.4%", "direction": "up", "subtext": "较上周提升 18.4%" },
    "orders": { "label": "今日订单", "valueText": "358", "trendText": "+12.8%", "direction": "up", "subtext": "今日实时成交 358 单" },
    "activeUsers": { "label": "活跃用户", "valueText": "8,920", "trendText": "+6.2%", "direction": "up", "subtext": "近 24h 访问持续增长" },
    "goodsCount": { "label": "在售商品", "valueText": "1,284", "trendText": "-1.3%", "direction": "down", "subtext": "库存结构保持稳定" }
  },
  "trend": {
    "days": ["周一", "周二", "周三", "周四", "周五", "周六", "周日"],
    "sales": [98, 132, 121, 156, 184, 210, 198],
    "orders": [62, 74, 58, 81, 92, 108, 96],
    "averageOrderValue": [1590, 1780, 1710, 1835, 1890, 1945, 1908]
  },
  "categoryShare": {
    "data": [
      { "name": "手机数码", "value": 38 },
      { "name": "电脑办公", "value": 22 },
      { "name": "日用百货", "value": 18 },
      { "name": "食品饮料", "value": 14 },
      { "name": "其他", "value": 8 }
    ]
  },
  "channelOrders": {
    "channels": ["小程序", "APP", "PC端", "门店", "抖音"],
    "orders": [320, 268, 214, 180, 132]
  },
  "topProducts": {
    "list": [
      { "rank": 1, "name": "小米 14 Pro", "count": 1260 }
    ]
  },
  "recentOrders": {
    "list": [
      {
        "orderNo": "OD202604260001",
        "customer": "张先生",
        "amountText": "¥ 1,299",
        "statusText": "已支付",
        "statusType": "success",
        "createTime": "2026-04-26 10:30:00"
      }
    ]
  }
}
```

---

## 注意事项

1. 所有接口需携带 `Authorization: Bearer <token>` 请求头
2. 大屏数据建议设置合理的缓存时间（如 30s~60s），避免频繁查询数据库
3. 趋势图数据建议按天聚合，减少数据量
4. 指标卡片中的 `trend` 环比计算建议与上一周期（如上周同日）对比
5. Token 过期或权限不足时返回 `401 Unauthorized`
