export interface Product {
    id: number;
    name: string;
    price: number;        // cents or number; we'll use number
    stock: number;        // available quantity
    createdAt: string;    
    updatedAt: string;    
}
  