import { api } from './api';
import { OrderStatus, PaymentMethod } from '../types';

export interface CreateServiceOrderDto {
    clientId: string;
    barberId: string;
    appointmentId?: string;
    items?: Array<{
        type: 'SERVICE' | 'PRODUCT' | 'EXTRA';
        serviceId?: string;
        productId?: string;
        name: string;
        quantity: number;
        unitPrice: number;
    }>;
    notes?: string;
}

export interface AddOrderItemDto {
    type: 'SERVICE' | 'PRODUCT' | 'EXTRA';
    serviceId?: string;
    productId?: string;
    name: string;
    quantity: number;
    unitPrice: number;
    description?: string;
}

export interface CompleteServiceOrderDto {
    paymentMethod: PaymentMethod;
    discount?: number;
}

export const serviceOrderService = {
    async create(data: CreateServiceOrderDto) {
        const response = await api.post('/service-orders', data);
        return response.data;
    },

    async addItem(orderId: string, item: AddOrderItemDto) {
        const response = await api.post(`/service-orders/${orderId}/items`, item);
        return response.data;
    },

    async removeItem(orderId: string, itemId: string) {
        const response = await api.delete(`/service-orders/${orderId}/items/${itemId}`);
        return response.data;
    },

    async complete(orderId: string, data: CompleteServiceOrderDto) {
        const response = await api.patch(`/service-orders/${orderId}/complete`, data);
        return response.data;
    },

    async cancel(orderId: string, reason: string) {
        const response = await api.patch(`/service-orders/${orderId}/cancel`, { reason });
        return response.data;
    },

    async findOne(orderId: string) {
        const response = await api.get(`/service-orders/${orderId}`);
        return response.data;
    },

    async getByAppointment(appointmentId: string) {
        const response = await api.get(`/service-orders/appointment/${appointmentId}`);
        return response.data;
    },

    async findAll(filters?: any) {
        const params = new URLSearchParams(filters);
        const response = await api.get(`/service-orders?${params.toString()}`);
        return response.data;
    }
};
