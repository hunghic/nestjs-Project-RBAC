export type OrderParams = {
  ipAddress: string;
  orderCode: string;
  amount: number;
  orderInfo: string;
  orderType: string;
};

export enum RefundType {
  Full = '02',
  Partial = '03',
}

export type OrderRefund = {
  ipAddress: string;
  orderCode: string;
  refundType: RefundType;
  amount: number;
  orderInfo: string;
  transactionDate: string;
  transactionNo: string;
  createBy: string;
};
