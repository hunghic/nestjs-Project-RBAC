import { CreateSpecificNotificationDto } from './../../notifications/dto';
import { NotificationsService } from './../../notifications/notifications.service';
import {
  OrderParams,
  OrderRefund,
  RefundType,
} from './../../common/external-services/vnpay/type';
import { VnpayService } from './../../common/external-services/vnpay/vnpay.service';
import { generateOrderCode } from './../../common/helper/nanoid';
import { PrismaService } from '../../prisma/prisma.service';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { CreateOrderDto, RatingPurchasedDto } from './dto';
import { AddressesService } from '../addresses/addresses.service';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  Voucher,
  VoucherStatus,
  VoucherType,
  VoucherUnit,
} from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private addressesService: AddressesService,
    private vnpay: VnpayService,
    private notificationsService: NotificationsService,
  ) {}

  async getAllOrders() {
    try {
      return await this.prisma.order.findMany();
    } catch (error) {
      throw error;
    }
  }

  async getOrder(id: number) {
    try {
      return await this.prisma.order.findUniqueOrThrow({
        where: { id },
        include: {
          orderDetails: true,
          orderPayment: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.NotFoundError) {
        throw new NotFoundException('No order found');
      }
      throw error;
    }
  }

  async getAllOrdersOfUser(userId: number) {
    try {
      return this.prisma.order.findMany({
        where: {
          userId,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  async getOrderOfUser(userId: number, orderId: number) {
    try {
      return await this.prisma.order.findFirstOrThrow({
        where: {
          id: orderId,
          userId,
        },
        include: {
          orderDetails: true,
          orderPayment: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.NotFoundError) {
        throw new NotFoundException('No order found');
      }
      throw error;
    }
  }

  async createOrder(userId: number, dto: CreateOrderDto) {
    try {
      const address = await this.addressesService.getUserAddress(
        userId,
        dto.deliveryAddressId,
      );

      const productIds = dto.products.map((product) => product.productId);

      if (productIds.some((id, index) => index !== productIds.indexOf(id)))
        throw new BadRequestException('There are duplicate products');

      let voucher: Voucher;
      if (dto.voucherCode) {
        voucher = await this.prisma.voucher.findFirst({
          where: {
            code: dto.voucherCode,
            startAt: {
              lte: new Date(),
            },
            dueAt: {
              gte: new Date(),
            },
            remainQuantity: {
              gt: 0,
            },
            OR: [
              {
                type: VoucherType.Personal,
                usersOfVoucher: {
                  some: { userId, status: VoucherStatus.NotUsed },
                },
              },
              {
                type: VoucherType.General,
                usersOfVoucher: {
                  none: { userId, status: VoucherStatus.Used },
                },
              },
            ],
          },
        });
        if (!voucher) throw new BadRequestException('Voucher code invalid');
      }

      return await this.prisma.$transaction(async (_prisma) => {
        const products = await Promise.all(
          dto.products.map(async (product) => {
            return _prisma.product
              .update({
                // có thể phải đặt await ở đây
                where: { id: product.productId },
                data: {
                  quantityInStock: { decrement: product.quantity },
                },
              })
              .then((item) => ({
                ...item,
                quantityOrder: product.quantity,
              }));
          }),
        );

        products.forEach((product) => {
          if (product.quantityInStock < 0)
            throw new ConflictException(
              `Product '#${product.id} - ${product.name} - ${product.code}' does not have enough quantity in stock`,
            );
        });

        const totalPrice = products.reduce((price, product) => {
          return (price += product.salePrice * product.quantityOrder);
        }, 0);

        // Phần tính giảm giá
        let discount = 0;
        if (voucher?.minOrderPrice) {
          if (totalPrice >= voucher.minOrderPrice) {
            if (voucher.unit === VoucherUnit.Percent) {
              discount = (totalPrice * voucher.value) / 100;
            } else if (voucher.unit === VoucherUnit.Money) {
              discount = voucher.value;
            }
          } else {
            throw new BadRequestException(
              'Order does not meet the minimum value of the voucher',
            );
          }
        } else if (voucher && !voucher.minOrderPrice) {
          if (voucher.unit === VoucherUnit.Percent) {
            discount = (totalPrice * voucher.value) / 100;
          } else if (voucher.unit === VoucherUnit.Money) {
            discount = voucher.value;
          }
        }

        if (voucher?.maxDiscount) {
          discount =
            discount > voucher.maxDiscount ? voucher.maxDiscount : discount;
        }

        if (voucher) {
          await _prisma.voucher.update({
            where: { id: voucher.id },
            data: {
              remainQuantity: { decrement: 1 },
              usersOfVoucher: {
                upsert: {
                  where: {
                    userId_voucherId: {
                      userId,
                      voucherId: voucher.id,
                    },
                  },
                  update: {
                    userId,
                    status: VoucherStatus.Used,
                  },
                  create: {
                    userId,
                    status: VoucherStatus.Used,
                  },
                },
              },
            },
          });
        }

        if (discount > totalPrice - 10000) {
          discount = totalPrice - 10000;
        }
        const finalPrice = totalPrice - discount;

        return await _prisma.order.create({
          data: {
            code: generateOrderCode(),
            receiverName: address.receiverName,
            orderPhone: address.phoneNumber,
            orderAddress: address.addressDetail,
            orderAddressType: address.addressType,
            reminder: dto.reminder ? dto.reminder : null,
            user: {
              connect: { id: userId },
            },
            orderDetails: {
              createMany: {
                data: products.map((product) => ({
                  productId: product.id,
                  quantity: product.quantityOrder,
                  currentListedPrice: product.listedPrice,
                  currentSalePrice: product.salePrice,
                })),
              },
            },
            voucherCode: dto.voucherCode ? dto.voucherCode : undefined,
            orderTotalPrice: totalPrice,
            orderDiscount: discount,
            orderFinalPrice: finalPrice,
            orderPayment: {
              create: {
                paymentValue: finalPrice,
                paymentMethod: dto.paymentMethod,
                status:
                  dto.paymentMethod === PaymentMethod.COD
                    ? PaymentStatus.Incomplete
                    : undefined,
              },
            },
          },
          include: {
            orderPayment: true,
          },
        });
      });
    } catch (error) {
      if (error instanceof Prisma.NotFoundError) {
        throw new NotFoundException('Some product could not be found');
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Some products not found');
        }
      }
      throw error;
    }
  }

  async payOnlineOrder(userId: number, orderId: number, clientIP: string) {
    try {
      const order = await this.prisma.order.findFirstOrThrow({
        where: {
          id: orderId,
          userId,
          status: OrderStatus.Waiting,
          orderPayment: {
            paymentMethod: PaymentMethod.Online,
            status: {
              notIn: [PaymentStatus.Completed, PaymentStatus.Refunded],
            },
          },
        },
        include: { orderPayment: true },
      });

      const orderParams: OrderParams = {
        ipAddress: clientIP || '::1',
        orderCode: order.code,
        amount: order.orderPayment.paymentValue,
        orderInfo: `Thanh toán đơn hàng #${order.code} tại NestShop. Số tiền ${order.orderPayment.paymentValue} VND`,
        orderType: 'billpayment',
      };

      return this.vnpay.createPaymentUrl(orderParams);
    } catch (error) {
      if (error instanceof Prisma.NotFoundError) {
        throw new NotFoundException('No order found to pay online');
      }
      throw error;
    }
  }

  async notificationVnpayPayment(query: any) {
    if (this.vnpay.verifyPayloadUrl(query)) {
      const orderCodeTimeStamp: string = query['vnp_TxnRef'];
      const orderCode = orderCodeTimeStamp.split('-')[0];
      const resCode = query['vnp_ResponseCode'];
      const paymentCode = orderCodeTimeStamp;
      const transactionNo = query['vnp_TransactionNo'];

      if (resCode !== '00') return { message: 'Payment failed' };
      await this.handlePaymentOrderSuccess(
        orderCode,
        paymentCode,
        transactionNo,
      ); //chỉ dùng cho dev, không dùng trong prod
      return {
        message: `Pay order #${orderCode} successfully`,
      };
    }
    return {
      RspCode: '97',
      Message:
        'The signature is invalid, the data in payload may have been changed',
    };
  }

  async handleVnpayPayment(query: any) {
    if (this.vnpay.verifyPayloadUrl(query)) {
      const orderCodeTimeStamp: string = query['vnp_TxnRef'];
      const orderCode = orderCodeTimeStamp.split('-')[0];
      const resCode = query['vnp_ResponseCode'];
      const paymentCode = query['vnp_TransactionNo'];

      if (resCode !== '00')
        return { RspCode: resCode, Message: 'Fail payment' };

      await this.handlePaymentOrderSuccess(orderCode, paymentCode); //dùng trong prod
      return { RspCode: '00', Message: 'success' };
    }
    return { RspCode: '97', Message: 'Fail checksum' };
  }

  async handlePaymentOrderSuccess(
    orderCode: string,
    paymentCode?: string,
    transactionNo?: string,
  ) {
    try {
      return await this.prisma.order.update({
        where: { code: orderCode },
        data: {
          orderPayment: {
            update: {
              status: PaymentStatus.Completed,
              paymentCode,
              transactionNo,
            },
          },
        },
      });
    } catch (error) {
      throw error;
    }
  }

  async cancelOrder(id: number, clientIP?: string) {
    try {
      const order = await this.prisma.order.findFirstOrThrow({
        where: {
          id,
          status: {
            not: OrderStatus.Canceled,
          },
        },
        include: {
          orderPayment: true,
          orderDetails: true,
        },
      });

      const productsInOrder = order.orderDetails.map((detail) => ({
        productId: detail.productId,
        quantity: detail.quantity,
      }));

      if (
        order.orderPayment.paymentMethod === PaymentMethod.COD &&
        order.status !== OrderStatus.Completed
      ) {
        await this.prisma.$transaction([
          this.prisma.order.update({
            where: { id },
            data: { status: OrderStatus.Canceled },
          }),
          ...productsInOrder.map((product) => {
            return this.prisma.product.update({
              where: { id: product.productId },
              data: { quantityInStock: { increment: product.quantity } },
            });
          }),
        ]);

        return { message: `Cancel order #${order.code} successfully` };
      }

      if (
        order.orderPayment.paymentMethod === PaymentMethod.Online &&
        order.status !== OrderStatus.Completed
      ) {
        if (
          order.orderPayment.status === PaymentStatus.Waiting ||
          order.orderPayment.status === PaymentStatus.Incomplete
        ) {
          await this.prisma.$transaction([
            this.prisma.order.update({
              where: { id },
              data: {
                status: OrderStatus.Canceled,
                orderPayment: {
                  update: {
                    status: PaymentStatus.Incomplete,
                  },
                },
              },
            }),
            ...productsInOrder.map((product) => {
              return this.prisma.product.update({
                where: { id: product.productId },
                data: { quantityInStock: { increment: product.quantity } },
              });
            }),
          ]);

          return { message: `Cancel order #${order.code} successfully` };
        } else if (order.orderPayment.status === PaymentStatus.Completed) {
          const refundParams: OrderRefund = {
            ipAddress: clientIP || '::1',
            orderCode: order.code,
            refundType: RefundType.Full,
            amount: order.orderPayment.paymentValue,
            orderInfo: `Hoàn tiền đơn hàng #${order.code}`,
            transactionDate: order.orderPayment.paymentCode.split('-')[1],
            transactionNo: order.orderPayment.transactionNo,
            createBy: 'KHyM',
          };

          return await this.prisma.$transaction(async (_prisma) => {
            await Promise.all([
              _prisma.order.update({
                where: { id },
                data: {
                  status: OrderStatus.Canceled,
                },
              }),
              ...productsInOrder.map((product) => {
                return _prisma.product.update({
                  where: { id: product.productId },
                  data: { quantityInStock: { increment: product.quantity } },
                });
              }),
            ]);

            const result = await this.vnpay.refundOrder(refundParams);

            if (result.success) {
              await _prisma.order.update({
                where: { id },
                data: {
                  orderPayment: {
                    update: {
                      status: PaymentStatus.Refunded,
                    },
                  },
                },
              });

              return {
                message: `Cancel and refund order #${order.code} successfully`,
              };
            }
            return {
              message: `Cancel order #${order.code} successfully but refund failed`,
            };
          });
        }
      }

      throw new BadRequestException(`Cancel order #${order.code} failed`);
    } catch (error) {
      if (error instanceof Prisma.NotFoundError) {
        throw new NotFoundException('No order need cancel found');
      }
      throw error;
    }
  }

  async userCancelOrder(userId: number, orderId: number) {
    try {
      const order = await this.prisma.order.findFirstOrThrow({
        where: {
          id: orderId,
          userId,
        },
      });

      if (order.status !== OrderStatus.Waiting)
        throw new BadRequestException('You cannot cancel a confirmed order');

      return await this.cancelOrder(order.id);
    } catch (error) {
      if (error instanceof Prisma.NotFoundError) {
        throw new NotFoundException('No order found');
      }
      throw error;
    }
  }

  async adminCancelOrder(id: number, cause?: string) {
    try {
      const result = await this.cancelOrder(id);
      await this.prisma.order.update({
        where: { id },
        data: {
          description: cause,
        },
      });

      return result;
    } catch (error) {
      throw error;
    }
  }

  async changeOrderStatus(id: number, status: OrderStatus) {
    try {
      const order = await this.prisma.order.update({
        where: { id },
        data: {
          status,
        },
      });

      const notiOptions: CreateSpecificNotificationDto = {
        title: `Cập nhật trạng thái đơn hàng #${order.code}`,
        content: `Đơn hàng đã chuyển sang trạng thái ${order.status}`,
        userIds: [order.userId],
      };

      await this.notificationsService.createSpecificNotification(notiOptions);

      return order;
    } catch (error) {
      throw error;
    }
  }

  async confirmOrder(id: number) {
    try {
      const order = await this.prisma.order.findFirstOrThrow({
        where: {
          id,
          status: OrderStatus.Waiting,
        },
        include: {
          orderPayment: true,
        },
      });

      if (
        order.orderPayment.paymentMethod === PaymentMethod.Online &&
        order.orderPayment.status !== PaymentStatus.Completed
      )
        throw new BadRequestException(
          'Order has not been successfully paid online',
        );

      return this.changeOrderStatus(id, OrderStatus.Confirmed);
    } catch (error) {
      if (error instanceof Prisma.NotFoundError) {
        throw new NotFoundException('No order found');
      }
      throw error;
    }
  }

  async shippingOrder(id: number) {
    try {
      await this.prisma.order.findFirstOrThrow({
        where: {
          id,
          status: OrderStatus.Confirmed,
        },
      });

      return this.changeOrderStatus(id, OrderStatus.Shipping);
    } catch (error) {
      if (error instanceof Prisma.NotFoundError) {
        throw new NotFoundException('No order found');
      }
      throw error;
    }
  }

  async completeOrder(id: number) {
    try {
      await this.prisma.order.findFirstOrThrow({
        where: {
          id,
          status: {
            in: [OrderStatus.Shipping, OrderStatus.Unclaimed],
          },
        },
      });

      return await this.prisma.order.update({
        where: { id },
        data: {
          status: OrderStatus.Completed,
          orderPayment: {
            update: {
              status: PaymentStatus.Completed,
            },
          },
        },
        include: { orderPayment: true },
      });
    } catch (error) {
      if (error instanceof Prisma.NotFoundError) {
        throw new NotFoundException('No order found');
      }
      throw error;
    }
  }

  async unclaimOrder(id: number) {
    try {
      await this.prisma.order.findFirstOrThrow({
        where: {
          id,
          status: OrderStatus.Shipping,
        },
      });

      return this.changeOrderStatus(id, OrderStatus.Unclaimed);
    } catch (error) {
      if (error instanceof Prisma.NotFoundError) {
        throw new NotFoundException('No order found');
      }
      throw error;
    }
  }

  async ratingPurchasedProduct(
    userId: number,
    orderId: number,
    dto: RatingPurchasedDto,
  ) {
    try {
      const orderDetail = await this.prisma.order
        .findFirstOrThrow({
          where: {
            id: orderId,
            userId,
            orderDetails: {
              some: {
                productId: dto.productId,
                rating: null,
              },
            },
            status: OrderStatus.Completed,
          },
          select: {
            orderDetails: {
              where: {
                productId: dto.productId,
                rating: null,
              },
            },
          },
        })
        .then((order) => order.orderDetails[0]);

      await this.prisma.rating.create({
        data: {
          userId,
          orderDetailId: orderDetail.id,
          stars: dto.stars,
          content: dto.content,
        },
      });

      return {
        message: `Rating purchased product in order #${orderId} successfully`,
      };
    } catch (error) {
      if (error instanceof Prisma.NotFoundError) {
        throw new NotFoundException('Purchased product not found need review');
      }
      throw error;
    }
  }
}
