"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CosmosProductRepo = void 0;
const cosmos_1 = require("@azure/cosmos");
const identity_1 = require("@azure/identity");
const product_1 = require("../domain/product");
// Cosmos DB adapter.
//
// This class implements the ProductRepo port defined in the domain layer.
// It translates the application's repository operations into Cosmos DB calls.
class CosmosProductRepo {
    constructor(options) {
        // If an access key has been supplied, use key-based authentication.
        //
        // Otherwise use DefaultAzureCredential, which allows Azure identity
        // authentication such as your developer login or managed identity.
        const client = options.key
            ? new cosmos_1.CosmosClient({
                endpoint: options.endpoint,
                key: options.key,
            })
            : new cosmos_1.CosmosClient({
                endpoint: options.endpoint,
                aadCredentials: new identity_1.DefaultAzureCredential(),
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
    async create(product) {
        // Map the domain model to the Cosmos-specific DTO.
        const document = {
            id: product.id,
            name: product.name,
            price: product.price,
        };
        await this.container.items.create(document);
    }
    // Retrieve a Product using its unique id.
    async get(id) {
        // This assumes /id is the container partition key,
        // so the id is supplied as both the item id and partition-key value.
        const response = await this.container.item(id, id).read();
        // Cosmos can return no resource if the item does not exist.
        if (!response.resource) {
            return null;
        }
        const document = response.resource;
        // Convert the persistence DTO back into a domain Product.
        //
        // Going through createProduct ensures that data coming from
        // persistence still satisfies the domain validation rules.
        return (0, product_1.createProduct)({
            id: document.id,
            name: document.name,
            price: document.price,
        });
    }
}
exports.CosmosProductRepo = CosmosProductRepo;
//# sourceMappingURL=cosmos-product-repo.js.map