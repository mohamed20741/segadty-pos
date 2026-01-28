export type Product = {
    id: string;
    name: string;
    category: string;
    cost_price: number;
    selling_price: number;
    branch_id: string;
    quantity: number;
    min_quantity: number;
    description?: string;
    image?: string;
};

export type CartItem = Product & {
    cartQuantity: number;
};

export type CustomerType = 'individual' | 'company';

export type Customer = {
    name: string;
    phone: string; // Saudi format validation
    city: string;
    address?: string;
    type: CustomerType;
    companyName?: string;
    commercialRegister?: string;
};

export type InvoiceStatus = 'completed' | 'pending' | 'cancelled';
export type PaymentMethod = 'cash' | 'card' | 'credit' | 'split';

export type Invoice = {
    invoice_number: string;
    branch_id: string;
    user_id: string;
    customer: Customer;
    items: CartItem[];
    subtotal: number;
    tax: number;
    total: number;
    payment_method: PaymentMethod;
    status: InvoiceStatus;
    created_at: string;
};
