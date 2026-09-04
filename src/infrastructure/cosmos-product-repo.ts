import { CosmosClient, Container } from '@azure/cosmos';
import { DefaultAzureCredential } from '@azure/identity';

import { Product, createProduct } from '../domain/product';
import { ProductRepo } from '../domain/product-repo';

// Configuration required by the Cosmos DB repository.
// These values are supplied from outside the class so that
// database configuration is not hard-coded into infrastructure code.
export interface CosmosProductRepoOptions {
  endpoint: string;
  databaseId: string;
  containerId: string;

  // Optional because the repository can authenticate either
  // with a Cosmos access key or with Azure identity credentials.
  key?: string;
}

// Internal DTO representing how a Product is stored in Cosmos DB.
//
// This is deliberately separate from the Product domain model.
// The database representation may evolve independently from
// the business/domain representation.
interface ProductDocument {
  id: string;
  name: string;
  price: number;
}

// Cosmos DB adapter.
//
// This class implements the ProductRepo port defined in the domain layer.
// It translates the application's repository operations into Cosmos DB calls.
export class CosmosProductRepo implements ProductRepo {
  private readonly container: Container;

  constructor(options: CosmosProductRepoOptions) {
    // If an access key has been supplied, use key-based authentication.
    //
    // Otherwise use DefaultAzureCredential, which allows Azure identity
    // authentication such as your developer login or managed identity.
    const client = options.key
      ? new CosmosClient({
          endpoint: options.endpoint,
          key: options.key,
        })
      : new CosmosClient({
          endpoint: options.endpoint,
          aadCredentials: new DefaultAzureCredential(),
        });

    // Obtain a reference to the configured Cosmos database/container.
    //
    // Notice that the database and container names come from the
    // Options object rather than being hard-coded in this class.
    this.container = client
      .database(options.databaseId)
      .container(options.containerId);
  }

  // Persist a valid Product domain object to Cosmos DB.
  async create(product: Product): Promise<void> {
    // Map the domain model to the Cosmos-specific DTO.
    const document: ProductDocument = {
      id: product.id,
      name: product.name,
      price: product.price,
    };

    await this.container.items.create(document);
  }

  // Retrieve a Product using its unique id.
  async get(id: string): Promise<Product | null> {
    // This assumes /id is the container partition key,
    // so the id is supplied as both the item id and partition-key value.
    const response = await this.container.item(id, id).read<ProductDocument>();

    // Cosmos can return no resource if the item does not exist.
    if (!response.resource) {
      return null;
    }

    const document = response.resource;

    // Convert the persistence DTO back into a domain Product.
    //
    // Going through createProduct ensures that data coming from
    // persistence still satisfies the domain validation rules.
    return createProduct({
      id: document.id,
      name: document.name,
      price: document.price,
    });
  }
}
