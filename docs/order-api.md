# Order API Documentation

> Target date: 2026-06-01
> Base URL: `/api`

## Common

### Response envelope
```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

### OrderStatus enum
- `PENDING_PAYMENT` — 待支付
- `PAID` — 已支付
- `SHIPPED` — 已发货
- `COMPLETED` — 已完成
- `CANCELED` — 已取消
- `REFUNDING` — 退款中
- `REFUNDED` — 已退款
- `RETURN_REJECTED` — 退货被拒

### PageResult
```json
{
  "list": [],
  "records": [],
  "total": 0,
  "pageNum": 1,
  "pageSize": 10,
  "pages": 1
}
```

---

## Mall (Customer)

### 1. 订单列表
`GET /mall/orders/page`

**Query Parameters**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `pageNum` | number | 是 | 页码 |
| `pageSize` | number | 是 | 每页条数 |
| `orderNo` | string | 否 | 订单号 |
| `status` | OrderStatus | 否 | 订单状态 |
| `startTime` | string | 否 | 下单开始时间 `YYYY-MM-DD HH:mm:ss` |
| `endTime` | string | 否 | 下单结束时间 `YYYY-MM-DD HH:mm:ss` |

**Response data**
```json
{
  "records": [
    {
      "orderId": 1001,
      "orderNo": "M202606010001",
      "status": "PAID",
      "totalAmount": 199.0,
      "payAmount": 188.0,
      "totalQuantity": 2,
      "createTime": "2026-06-01 10:20:12"
    }
  ],
  "total": 1,
  "pageNum": 1,
  "pageSize": 10
}
```

### 2. 订单详情
`GET /mall/orders/{orderId}`

**Path Parameters**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `orderId` | number | 是 | 订单ID |

**Response data**
```json
{
  "order": {
    "orderId": 1001,
    "orderNo": "M202606010001",
    "status": "REFUNDING",
    "totalAmount": 199.0,
    "payAmount": 188.0,
    "totalQuantity": 2,
    "createTime": "2026-06-01 10:20:12",
    "receiverName": "张三",
    "receiverPhone": "13800138000",
    "receiverAddress": "广州市天河区...",
    "refundReason": "商品与描述不符",
    "refundRemark": "已核实，同意退货",
    "refundApplyTime": "2026-06-01 12:00:00",
    "refundAuditTime": "2026-06-01 14:30:00"
  },
  "items": [
    {
      "itemId": 1,
      "productId": 2001,
      "productName": "蓝牙耳机",
      "price": 99.5,
      "quantity": 2,
      "subtotal": 199.0
    }
  ]
}
```

### 3. 订单状态统计
`GET /mall/orders/status-count`

**Response data**
```json
[
  { "status": "ALL", "count": 20 },
  { "status": "PENDING_PAYMENT", "count": 3 },
  { "status": "PAID", "count": 5 },
  { "status": "SHIPPED", "count": 4 },
  { "status": "COMPLETED", "count": 3 },
  { "status": "CANCELED", "count": 2 },
  { "status": "REFUNDING", "count": 1 },
  { "status": "REFUNDED", "count": 1 },
  { "status": "RETURN_REJECTED", "count": 1 }
]
```

### 4. 申请退货
`POST /mall/orders/{orderId}/return`

> 仅订单状态为 `PAID` / `SHIPPED` / `COMPLETED` 时可申请

**Path Parameters**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `orderId` | number | 是 | 订单ID |

**Request Body**
```json
{
  "reason": "商品与描述不符，申请退货退款"
}
```
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `reason` | string | 是 | 退货原因，10-200字 |

**Response**
```json
{
  "code": 200,
  "message": "success",
  "data": null
}
```
> 申请成功后订单状态变更为 `REFUNDING`

---

## Merchant (Admin/Shop)

### 1. 订单列表
`GET /merchant/orders/page`

**Query Parameters**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `pageNum` | number | 是 | 页码 |
| `pageSize` | number | 是 | 每页条数 |
| `orderNo` | string | 否 | 订单号 |
| `status` | OrderStatus | 否 | 订单状态 |
| `buyerName` | string | 否 | 买家姓名 |
| `buyerPhone` | string | 否 | 买家手机号 |
| `startTime` | string | 否 | 下单开始时间 `YYYY-MM-DD HH:mm:ss` |
| `endTime` | string | 否 | 下单结束时间 `YYYY-MM-DD HH:mm:ss` |

**Response data**
```json
{
  "records": [
    {
      "orderId": 1001,
      "orderNo": "M202606010001",
      "status": "REFUNDING",
      "totalAmount": 199.0,
      "payAmount": 188.0,
      "totalQuantity": 2,
      "createTime": "2026-06-01 10:20:12",
      "buyerName": "李四",
      "buyerPhone": "13900139000"
    }
  ],
  "total": 1,
  "pageNum": 1,
  "pageSize": 10
}
```

### 2. 订单详情
`GET /merchant/orders/{orderId}`

**Path Parameters**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `orderId` | number | 是 | 订单ID |

**Response data**
```json
{
  "order": {
    "orderId": 1001,
    "orderNo": "M202606010001",
    "status": "REFUNDING",
    "totalAmount": 199.0,
    "payAmount": 188.0,
    "totalQuantity": 2,
    "createTime": "2026-06-01 10:20:12",
    "buyerName": "李四",
    "buyerPhone": "13900139000",
    "receiverName": "张三",
    "receiverPhone": "13800138000",
    "receiverAddress": "广州市天河区...",
    "refundReason": "商品与描述不符",
    "refundApplyTime": "2026-06-01 12:00:00"
  },
  "items": [
    {
      "itemId": 1,
      "productId": 2001,
      "productName": "蓝牙耳机",
      "price": 99.5,
      "quantity": 2,
      "subtotal": 199.0
    }
  ]
}
```

### 3. 订单状态统计
`GET /merchant/orders/status-count`

**Response data**
```json
[
  { "status": "ALL", "count": 50 },
  { "status": "PENDING_PAYMENT", "count": 5 },
  { "status": "PAID", "count": 12 },
  { "status": "SHIPPED", "count": 10 },
  { "status": "COMPLETED", "count": 8 },
  { "status": "CANCELED", "count": 5 },
  { "status": "REFUNDING", "count": 3 },
  { "status": "REFUNDED", "count": 4 },
  { "status": "RETURN_REJECTED", "count": 3 }
]
```

### 4. 审核退货
`POST /merchant/orders/{orderId}/return/audit`

> 仅订单状态为 `REFUNDING` 时可操作

**Path Parameters**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `orderId` | number | 是 | 订单ID |

**Request Body**
```json
{
  "approved": true,
  "remark": "已核实，同意退货"
}
```
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `approved` | boolean | 是 | `true` 同意退货 / `false` 拒绝退货 |
| `remark` | string | 否 | 审核备注，最多200字 |

**Response**
```json
{
  "code": 200,
  "message": "success",
  "data": null
}
```
> - 同意退货：订单状态变更为 `REFUNDED`
> - 拒绝退货：订单状态变更为 `RETURN_REJECTED`

---

## 退货业务流程图

```
顾客申请退货              商家审核
───────────────────────────────────────────────────
PAID / SHIPPED / COMPLETED
        │
        │ POST /mall/orders/{orderId}/return
        ▼
    REFUNDING ──────────────────┐
        │                       │
        │ 商家审核              │
        │                       │
  ┌─────┴─────┐                 │
  │           │                 │
  ▼           ▼                 │
同意         拒绝               │
(approved:  (approved:          │
 true)       false)             │
  │           │                 │
  ▼           ▼                 │
REFUNDED   RETURN_REJECTED      │
```

---

## 注意事项

1. 退货申请仅限订单状态为 `PAID`、`SHIPPED`、`COMPLETED` 时操作
2. 退货审核仅限订单状态为 `REFUNDING` 时操作
3. 审核操作为不可逆操作，请谨慎处理
4. 所有请求需携带 `Authorization: Bearer <token>` 请求头
