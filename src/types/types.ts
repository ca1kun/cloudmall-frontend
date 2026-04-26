export interface ApiResult<T = unknown> {
  code: number
  message?: string
  msg?: string
  data: T
}

export interface PageRequest {
  pageNum: number
  pageSize: number
}

export interface PageResult<T> {
  list?: T[]
  records?: T[]
  total: number
  pageNum?: number
  pageSize?: number
  pages?: number
}

export interface LoginUser {
  userName: string
  password: string
}

export interface LoginDTO {
  loginType: 'sms' | 'account'
  username?: string
  password?: string
  phone?: string
  code?: string
}

export interface AuthResult {
  token: string
  role: string
  username: string
  avatar?: string
}

export interface UserProfile {
  username: string
  avatar: string
  phone: string
  createTime: string
  role: string
}

export interface PasswordUpdateForm {
  oldPassword: string
  newPassword: string
  confirmPassword?: string
}

export interface SuperAdmin {
  adminId?: number
  userName: string
  nickName: string
  phone?: string
  email?: string
  status?: number
  remark?: string
  createTime?: string
  updateTime?: string
}

export interface SuperAdminForm {
  adminId?: number
  userName: string
  nickName: string
  phone: string
  email: string
  password?: string
  status: number
  remark: string
}

export interface SuperAdminQueryParams extends PageRequest {
  userName?: string
  nickName?: string
  phone?: string
  status?: number | ''
}

export interface Product {
  productId?: number
  productSn: string
  productName: string
  productDescription?: string
  price: number
  stock?: number
  productCategoryId?: number
  category?: Category
  imageUrl?: string
  detailUrl?: string
}

export interface Category {
  categoryId?: number
  parentId: number
  categoryName: string
  children?: Category[]
}

export interface CartItem {
  id?: number
  productId: number
  productName: string
  productPic: string
  price: number
  currentPrice?: number
  quantity: number
}

export interface ProductQueryParams extends PageRequest {
  productName?: string
  productSn?: string
  productCategoryId?: number
}

export interface Coupon {
  id?: number
  couponId?: number
  name: string
  amount: number
  count: number
  minPoint: number
  perLimit?: number
  startTime: string
  endTime: string
  useStatus?: 0 | 1
}

export interface CouponForm {
  id?: number
  name: string
  count: number
  amount: number
  minPoint: number
  perLimit: number
  startTime: string
  endTime: string
}

export interface CouponQueryParams extends Partial<PageRequest> {
  name?: string
}

export interface OrderParam {
  addressId: number
  payType: number
  note: string
  couponId?: number | null
}

export interface CreateOrderResult {
  orderId: number
  payAmount?: number | string
}

export interface OrderSummary {
  orderId: number
  payAmount: number | string
}

export interface UserCouponRecord {
  id?: number
  couponId: number
  name: string
  amount: number
  count: number
  minPoint: number
  startTime: string
  endTime: string
  perLimit?: number
  useStatus: 0 | 1
}

export interface Sale {
  saleId?: number
  saleNo: string
  total: number
  totalQuantity: number
  status: string
}

export interface SaleItem {
  index?: number
  itemSn: string
  productId?: number
  productName: string
  price: number
  quantity: number
}

export interface EnterItemForm {
  itemSn: string
  quantity: number
}

export interface MakePaymentForm {
  saleId?: number
  payMethod: string
  cashTendered: number
  changeDue: number
}
