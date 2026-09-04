import { Product } from './product';

// Repository port for Product persistence.
// Defines what the application needs, without depending on any database technology.
export interface ProductRepo {
  create(product: Product): Promise<void>;
  get(id: string): Promise<Product | null>;
}
