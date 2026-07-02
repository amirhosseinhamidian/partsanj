import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { CustomerAddress } from '../../generated/prisma/client.js';
import { PrismaService } from '../database/prisma.service.js';
import type { CreateCustomerAddressDto } from './dto/create-customer-address.dto.js';
import type { UpdateCustomerAddressDto } from './dto/update-customer-address.dto.js';

type NormalizedAddressInput = {
  label: string;
  recipientFirstName: string;
  recipientLastName: string;
  recipientMobile: string;
  province: string;
  city: string;
  district: string | null;
  addressLine: string;
  postalCode: string;
  plaque: string | null;
  floor: string | null;
  unit: string | null;
  deliveryNotes: string | null;
};

@Injectable()
export class CustomerAddressService {
  constructor(private readonly prisma: PrismaService) {}

  async listAddresses(userId: string) {
    const addresses = await this.prisma.customerAddress.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: [
        {
          isDefault: 'desc',
        },
        {
          updatedAt: 'desc',
        },
      ],
    });

    return addresses.map((address) => this.toResponse(address));
  }

  async createAddress(userId: string, dto: CreateCustomerAddressDto) {
    const normalized = this.normalizeAddress(dto);

    const address = await this.prisma.$transaction(async (transaction) => {
      const activeAddressCount = await transaction.customerAddress.count({
        where: {
          userId,
          isActive: true,
        },
      });

      const shouldSetDefault = dto.isDefault === true || activeAddressCount === 0;

      if (shouldSetDefault) {
        await transaction.customerAddress.updateMany({
          where: {
            userId,
            isDefault: true,
          },
          data: {
            isDefault: false,
          },
        });
      }

      return transaction.customerAddress.create({
        data: {
          userId,
          ...normalized,
          isDefault: shouldSetDefault,
          isActive: true,
        },
      });
    });

    return this.toResponse(address);
  }

  async updateAddress(userId: string, addressId: string, dto: UpdateCustomerAddressDto) {
    const address = await this.findOwnedActiveAddress(userId, addressId);

    const normalized = this.normalizeAddress({
      label: dto.label ?? address.label,
      recipientFirstName: dto.recipientFirstName ?? address.recipientFirstName,
      recipientLastName: dto.recipientLastName ?? address.recipientLastName,
      recipientMobile: dto.recipientMobile ?? address.recipientMobile,
      province: dto.province ?? address.province,
      city: dto.city ?? address.city,
      district: dto.district !== undefined ? dto.district : address.district,
      addressLine: dto.addressLine ?? address.addressLine,
      postalCode: dto.postalCode ?? address.postalCode,
      plaque: dto.plaque !== undefined ? dto.plaque : address.plaque,
      floor: dto.floor !== undefined ? dto.floor : address.floor,
      unit: dto.unit !== undefined ? dto.unit : address.unit,
      deliveryNotes: dto.deliveryNotes !== undefined ? dto.deliveryNotes : address.deliveryNotes,
    });

    const updatedAddress = await this.prisma.customerAddress.update({
      where: {
        id: address.id,
      },
      data: normalized,
    });

    return this.toResponse(updatedAddress);
  }

  async setDefaultAddress(userId: string, addressId: string) {
    const address = await this.findOwnedActiveAddress(userId, addressId);

    const updatedAddress = await this.prisma.$transaction(async (transaction) => {
      await transaction.customerAddress.updateMany({
        where: {
          userId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });

      return transaction.customerAddress.update({
        where: {
          id: address.id,
        },
        data: {
          isDefault: true,
        },
      });
    });

    return this.toResponse(updatedAddress);
  }

  async archiveAddress(userId: string, addressId: string) {
    const address = await this.findOwnedActiveAddress(userId, addressId);

    await this.prisma.$transaction(async (transaction) => {
      await transaction.customerAddress.update({
        where: {
          id: address.id,
        },
        data: {
          isActive: false,
          isDefault: false,
        },
      });

      if (!address.isDefault) {
        return;
      }

      const fallbackAddress = await transaction.customerAddress.findFirst({
        where: {
          userId,
          isActive: true,
          id: {
            not: address.id,
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });

      if (!fallbackAddress) {
        return;
      }

      await transaction.customerAddress.update({
        where: {
          id: fallbackAddress.id,
        },
        data: {
          isDefault: true,
        },
      });
    });
  }

  private async findOwnedActiveAddress(userId: string, addressId: string) {
    const address = await this.prisma.customerAddress.findFirst({
      where: {
        id: addressId,
        userId,
        isActive: true,
      },
    });

    if (!address) {
      throw new NotFoundException('Customer address not found');
    }

    return address;
  }

  private normalizeAddress(input: {
    label: string;
    recipientFirstName: string;
    recipientLastName: string;
    recipientMobile: string;
    province: string;
    city: string;
    district?: string | null;
    addressLine: string;
    postalCode: string;
    plaque?: string | null;
    floor?: string | null;
    unit?: string | null;
    deliveryNotes?: string | null;
  }): NormalizedAddressInput {
    return {
      label: this.normalizeRequiredText(input.label, 'Address label'),
      recipientFirstName: this.normalizeRequiredText(
        input.recipientFirstName,
        'Recipient first name',
      ),
      recipientLastName: this.normalizeRequiredText(input.recipientLastName, 'Recipient last name'),
      recipientMobile: this.normalizeIranianMobile(input.recipientMobile),
      province: this.normalizeRequiredText(input.province, 'Province'),
      city: this.normalizeRequiredText(input.city, 'City'),
      district: this.normalizeOptionalText(input.district),
      addressLine: this.normalizeRequiredText(input.addressLine, 'Address line'),
      postalCode: this.normalizePostalCode(input.postalCode),
      plaque: this.normalizeOptionalText(input.plaque),
      floor: this.normalizeOptionalText(input.floor),
      unit: this.normalizeOptionalText(input.unit),
      deliveryNotes: this.normalizeOptionalText(input.deliveryNotes),
    };
  }

  private normalizeRequiredText(value: string, fieldName: string) {
    const normalized = value.trim();

    if (!normalized) {
      throw new BadRequestException(`${fieldName} must not be empty`);
    }

    return normalized;
  }

  private normalizeOptionalText(value: string | null | undefined) {
    const normalized = value?.trim();

    return normalized || null;
  }

  private normalizePostalCode(value: string) {
    const digits = this.toLatinDigits(value).replace(/\D/g, '');

    if (!/^\d{10}$/.test(digits)) {
      throw new BadRequestException('Postal code must contain exactly 10 digits');
    }

    return digits;
  }

  private normalizeIranianMobile(value: string) {
    const digits = this.toLatinDigits(value).replace(/\D/g, '');

    if (/^09\d{9}$/.test(digits)) {
      return digits;
    }

    if (/^989\d{9}$/.test(digits)) {
      return `0${digits.slice(2)}`;
    }

    if (/^00989\d{9}$/.test(digits)) {
      return `0${digits.slice(4)}`;
    }

    throw new BadRequestException('Recipient mobile number is invalid');
  }

  private toLatinDigits(value: string) {
    const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
    const arabicDigits = '٠١٢٣٤٥٦٧٨٩';

    return value
      .replace(/[۰-۹]/g, (digit) => String(persianDigits.indexOf(digit)))
      .replace(/[٠-٩]/g, (digit) => String(arabicDigits.indexOf(digit)));
  }

  private toResponse(address: CustomerAddress) {
    return {
      id: address.id,
      label: address.label,
      recipientFirstName: address.recipientFirstName,
      recipientLastName: address.recipientLastName,
      recipientMobile: address.recipientMobile,
      province: address.province,
      city: address.city,
      district: address.district,
      addressLine: address.addressLine,
      postalCode: address.postalCode,
      plaque: address.plaque,
      floor: address.floor,
      unit: address.unit,
      deliveryNotes: address.deliveryNotes,
      isDefault: address.isDefault,
      createdAt: address.createdAt,
      updatedAt: address.updatedAt,
    };
  }
}
