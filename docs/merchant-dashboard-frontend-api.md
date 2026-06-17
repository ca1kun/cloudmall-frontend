# 商家大屏接口前端对接文档

> Codex added: 根据当前 `MerchantDashboardController` 和 `IDashboardService` 实际接口整理。  
> 当前已放行 `/merchant/dashboard/**`，本地 Apifox/前端联调可先不带 Token。

## 1. 基础信息

### Base URL

直连 `mis-api`：

```text
http://127.0.0.1:8081
```

通过 gateway：

```text
http://127.0.0.1:8080
```

### 统一响应格式

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

### 依赖数据来源

大屏数据不是写死的，后端会从数据库聚合：

```text
pos_sale
pos_sale_item
pos_product
pos_category
```

说明：

- 渠道订单：当前数据库没有渠道字段，后端按现有 POS 业务聚合为 `线下POS`。
- 活跃用户：当前没有独立访问用户表，后端用近 24 小时订单创建人去重统计。
- 在售商品：当前没有上下架字段，后端用 `stock > 0` 统计。

## 2. 核心指标

### GET `/merchant/dashboard/metrics`

获取大屏顶部核心指标卡片。

### 请求参数

无。

### 返回示例

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "sales": {
      "label": "总销售额",
      "value": 1286560,
      "valueText": "¥ 1,286,560",
      "trend": 18.4,
      "trendText": "+18.4%",
      "direction": "up",
      "subtext": "较昨日销售额变化"
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
      "value": 89,
      "valueText": "89",
      "trend": 0,
      "trendText": "+0.0%",
      "direction": "up",
      "subtext": "近 24h 下单用户/订单创建人"
    },
    "goodsCount": {
      "label": "在售商品",
      "value": 1284,
      "valueText": "1,284",
      "trend": 0,
      "trendText": "+0.0%",
      "direction": "up",
      "subtext": "按库存大于 0 统计"
    }
  }
}
```

### 字段说明

| 字段 | 类型 | 说明 |
|---|---|---|
| `sales` | `MetricCard` | 总销售额 |
| `orders` | `MetricCard` | 今日订单 |
| `activeUsers` | `MetricCard` | 活跃用户 |
| `goodsCount` | `MetricCard` | 在售商品 |

### MetricCard

| 字段 | 类型 | 说明 |
|---|---|---|
| `label` | `string` | 指标名称 |
| `value` | `number` | 原始数值 |
| `valueText` | `string` | 展示文本 |
| `trend` | `number` | 环比变化百分比 |
| `trendText` | `string` | 环比展示文本 |
| `direction` | `string` | `up` 或 `down` |
| `subtext` | `string` | 副说明 |

## 3. 销售与订单趋势

### GET `/merchant/dashboard/trend`

获取近 N 天销售额、订单数、客单价趋势。

### 请求参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `days` | `number` | 否 | `7` | 查询天数，后端限制在 `3~30` |

### 请求示例

```text
GET /merchant/dashboard/trend?days=7
```

### 返回示例

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "days": ["06-10", "06-11", "06-12", "06-13", "06-14", "06-15", "06-16"],
    "sales": [98, 132, 121, 156, 184, 210, 198],
    "orders": [62, 74, 58, 81, 92, 108, 96],
    "averageOrderValue": [1590, 1780, 1710, 1835, 1890, 1945, 1908]
  }
}
```

## 4. 品类占比

### GET `/merchant/dashboard/category-share`

根据订单明细销量聚合商品品类占比。

### 请求参数

无。

### 返回示例

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "data": [
      { "name": "手机数码", "value": 38 },
      { "name": "电脑办公", "value": 22 },
      { "name": "日用百货", "value": 18 }
    ]
  }
}
```

## 5. 渠道订单

### GET `/merchant/dashboard/channel-orders`

获取指定周期内渠道订单数。

### 请求参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `period` | `string` | 否 | `week` | `week` 本周，`month` 本月 |

### 请求示例

```text
GET /merchant/dashboard/channel-orders?period=week
```

### 返回示例

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "channels": ["线下POS"],
    "orders": [320]
  }
}
```

## 6. 热销商品排行

### GET `/merchant/dashboard/top-products`

根据订单明细销量聚合热销商品排行。

### 请求参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `limit` | `number` | 否 | `10` | 返回条数，后端限制在 `5~20` |
| `period` | `string` | 否 | `week` | `week` 本周，`month` 本月，`all` 全部 |

### 请求示例

```text
GET /merchant/dashboard/top-products?limit=10&period=week
```

### 返回示例

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      { "rank": 1, "name": "小米 14 Pro", "count": 1260 },
      { "rank": 2, "name": "iPhone 15 Pro Max", "count": 1098 }
    ]
  }
}
```

## 7. 最新订单

### GET `/merchant/dashboard/recent-orders`

获取最近订单列表。

### 请求参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `limit` | `number` | 否 | `5` | 返回条数，后端限制在 `5~20` |

### 请求示例

```text
GET /merchant/dashboard/recent-orders?limit=5
```

### 返回示例

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "orderNo": "OD202604260001",
        "customer": "客户",
        "amount": 1299.00,
        "amountText": "¥ 1,299",
        "status": "PAID",
        "statusText": "已支付",
        "statusType": "success",
        "createTime": "2026-04-26 10:30:00"
      }
    ]
  }
}
```

### statusType 说明

| status | statusText | statusType |
|---|---|---|
| `PAID` | 已支付 | `success` |
| `RESERVED` | 已预订 | `warning` |
| `DELIVERED` | 已发货 | `info` |
| `COMPLETED` | 已完成 | `success` |
| `UNPAID` | 未支付 | `warning` |
| `CANCELLED` | 已取消 | `danger` |

## 8. 大屏聚合接口

### GET `/merchant/dashboard/overview`

一次性获取大屏所有数据，减少前端请求次数。

### 请求参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `trendDays` | `number` | 否 | `7` | 趋势图天数，后端限制在 `3~30` |
| `topLimit` | `number` | 否 | `10` | 热销商品条数，后端限制在 `5~20` |
| `recentLimit` | `number` | 否 | `5` | 最新订单条数，后端限制在 `5~20` |

### 请求示例

```text
GET /merchant/dashboard/overview?trendDays=7&topLimit=10&recentLimit=5
```

### 返回结构

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "metrics": {},
    "trend": {},
    "categoryShare": {},
    "channelOrders": {},
    "topProducts": {},
    "recentOrders": {}
  }
}
```

## 9. 前端推荐调用方式

如果首页需要一次加载完整大屏，优先调用：

```text
GET /merchant/dashboard/overview
```

如果页面中单个图表需要独立刷新，再分别调用：

```text
GET /merchant/dashboard/metrics
GET /merchant/dashboard/trend
GET /merchant/dashboard/category-share
GET /merchant/dashboard/channel-orders
GET /merchant/dashboard/top-products
GET /merchant/dashboard/recent-orders
```

## 10. 联调注意事项

1. 当前已放行 `/merchant/dashboard/**`，本地测试可不带 Token。
2. 修改放行配置后需要重启 `mis-api`。
3. 如果返回数据为空，优先确认 `pos_sale`、`pos_sale_item`、`pos_product`、`pos_category` 是否有数据。
4. 如果接口 500，优先看 `mis-api` 控制台 SQL/mapper 报错。
