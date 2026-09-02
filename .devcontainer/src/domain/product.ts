// The domain model.
// Represents a valid Product inside the application.
export type Product = {
  id: string;
  name: string;
  price: number;
};

// The input contract for creating a Product.
// Defines exactly what data the factory function expects to receive.
export interface CreateProductParams {
  id: string;
  name: string;
  price: number;
}

// Factory function.
// Responsible for validating input and only returning a valid Product.
export function createProduct(params: CreateProductParams): Product {
  // Ensure the Product has a unique identifier for persistence/storage.
  if (!params.id.trim()) {
    throw new Error('Product id is required');
  }

  // Ensure the Product has a meaningful name.
  if (!params.name.trim()) {
    throw new Error('Product name is required');
  }

  // Apply a basic business rule: a price cannot be negative.
  if (params.price < 0) {
    throw new Error('Product price cannot be negative');
  }

  // If all validation passes, return a valid Product domain object.
  return {
    id: params.id,
    name: params.name,
    price: params.price,
  };
}
