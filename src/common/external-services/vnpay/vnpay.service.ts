import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderParams, OrderRefund } from './type';
import * as dateFormat from 'dateformat';
import { stringify } from 'qs';
import { createHmac } from 'crypto';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class VnpayService {
  constructor(
    private config: ConfigService,
    private httpService: HttpService,
  ) {}

  sortObject(obj: object) {
    const sorted = {};
    const str = [];
    let key;
    for (key in obj) {
      if (obj.hasOwnProperty(key)) {
        str.push(encodeURIComponent(key));
      }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
      sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, '+');
    }
    return sorted;
  }

  createPaymentUrl(orderParams: OrderParams) {
    let vnpUrl: string = this.config.get('vnp_Url');
    let vnp_Params = {};
    const createdDate = dateFormat(new Date(), 'yyyymmddHHmmss');

    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = this.config.get('vnp_TmnCode');
    vnp_Params['vnp_Locale'] = 'vn';
    vnp_Params['vnp_CurrCode'] = 'VND';
    vnp_Params['vnp_TxnRef'] = orderParams.orderCode + '-' + createdDate;
    vnp_Params['vnp_OrderInfo'] = orderParams.orderInfo;
    vnp_Params['vnp_OrderType'] = orderParams.orderType;
    vnp_Params['vnp_Amount'] = orderParams.amount * 100;
    vnp_Params['vnp_ReturnUrl'] = this.config.get('vnp_ReturnUrl');
    vnp_Params['vnp_IpAddr'] = orderParams.ipAddress;
    vnp_Params['vnp_CreateDate'] = createdDate;

    vnp_Params = this.sortObject(vnp_Params);

    const signData = stringify(vnp_Params, { encode: false });
    const hmac = createHmac('sha512', this.config.get('vnp_HashSecret'));
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    vnp_Params['vnp_SecureHash'] = signed;
    vnpUrl += '?' + stringify(vnp_Params, { encode: false });

    return vnpUrl;
  }

  verifyPayloadUrl(vnp_Params: object) {
    const secureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = this.sortObject(vnp_Params);
    const secretKey = this.config.get('vnp_HashSecret');
    const signData = stringify(vnp_Params, { encode: false });
    const hmac = createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    return secureHash === signed;
  }

  verifyPayloadRefund(data: any) {
    const signData =
      data['vnp_ResponseId'] +
      '|' +
      data['vnp_Command'] +
      '|' +
      data['vnp_ResponseCode'] +
      '|' +
      data['vnp_Message'] +
      '|' +
      data['vnp_TmnCode'] +
      '|' +
      data['vnp_TxnRef'] +
      '|' +
      data['vnp_Amount'] +
      '|' +
      data['vnp_BankCode'] +
      '|' +
      data['vnp_PayDate'] +
      '|' +
      data['vnp_TransactionNo'] +
      '|' +
      data['vnp_TransactionType'] +
      '|' +
      data['vnp_TransactionStatus'] +
      '|' +
      data['vnp_OrderInfo'];

    const hmac = createHmac('sha512', this.config.get('vnp_HashSecret'));
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    return data['vnp_SecureHash'] === signed;
  }

  async refundOrder(refundParams: OrderRefund) {
    const vnp_Params = {};
    const createdDate = dateFormat(new Date(), 'yyyymmddHHmmss');

    vnp_Params['vnp_RequestId'] = refundParams.orderCode + '-' + createdDate;
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'refund';
    vnp_Params['vnp_TmnCode'] = this.config.get('vnp_TmnCode');
    vnp_Params['vnp_TransactionType'] = refundParams.refundType;
    vnp_Params['vnp_TxnRef'] =
      refundParams.orderCode + '-' + refundParams.transactionDate;
    vnp_Params['vnp_OrderInfo'] = refundParams.orderInfo;
    vnp_Params['vnp_TransactionNo'] = Number(refundParams.transactionNo);
    vnp_Params['vnp_TransactionDate'] = Number(refundParams.transactionDate);
    vnp_Params['vnp_Amount'] = Number(refundParams.amount * 100);
    vnp_Params['vnp_CreateBy'] = refundParams.createBy;
    vnp_Params['vnp_IpAddr'] = refundParams.ipAddress;
    vnp_Params['vnp_CreateDate'] = Number(createdDate);

    const signData =
      vnp_Params['vnp_RequestId'] +
      '|' +
      vnp_Params['vnp_Version'] +
      '|' +
      vnp_Params['vnp_Command'] +
      '|' +
      vnp_Params['vnp_TmnCode'] +
      '|' +
      vnp_Params['vnp_TransactionType'] +
      '|' +
      vnp_Params['vnp_TxnRef'] +
      '|' +
      vnp_Params['vnp_Amount'] +
      '|' +
      vnp_Params['vnp_TransactionNo'] +
      '|' +
      vnp_Params['vnp_TransactionDate'] +
      '|' +
      vnp_Params['vnp_CreateBy'] +
      '|' +
      vnp_Params['vnp_CreateDate'] +
      '|' +
      vnp_Params['vnp_IpAddr'] +
      '|' +
      vnp_Params['vnp_OrderInfo'];

    const hmac = createHmac('sha512', this.config.get('vnp_HashSecret'));
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    vnp_Params['vnp_SecureHash'] = signed;

    const response = await this.httpService.axiosRef.post(
      'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction',
      vnp_Params,
    );

    const body = response.data;

    // console.log(vnp_Params);
    // console.log(body);

    if (body['vnp_ResponseCode'] === '00' && this.verifyPayloadRefund(body)) {
      const orderCode: string = body['vnp_TxnRef'].split('-')[0];
      return {
        success: true,
        code: body['vnp_ResponseCode'],
        message: `Refund order #${orderCode} successfully`,
      };
    }

    return {
      success: false,
      code: body['vnp_ResponseCode'],
      message: body['vnp_Message'] || 'Something wrong',
    };
  }
}
