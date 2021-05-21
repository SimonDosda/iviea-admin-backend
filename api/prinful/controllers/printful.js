const fetch = require("node-fetch");

module.exports = {
  async products(ctx) {
    const res = await fetch("https://api.printful.com/sync/products", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${process.env.PRINTFUL_API_KEY}`,
      },
    });
    console.log(res);
    const { result } = await res.json();
    console.log(result);
    ctx.send(result);
  },
  async product(ctx) {
    const { productId } = ctx.params;
    const res = await fetch(
      `https://api.printful.com/sync/products/${productId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${process.env.PRINTFUL_API_KEY}`,
        },
      }
    );
    const { result } = await res.json();
    ctx.send(result);
  },
};

async function getProductWithVariants(productId) {
  const res = await fetch(
    `https://api.printful.com/sync/products/${productId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${process.env.PRINTFUL_API_KEY}`,
      },
    }
  );
  const { result } = await res.json();
  return result;
}

async function getVariantInfo(variantId) {
  const res = await fetch(
    `https://api.printful.com/products/variant/${variantId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${process.env.PRINTFUL_API_KEY}`,
      },
    }
  );
  const { result } = await res.json();
  return result.variant;
}

async function getAllProductInfo() {
  const products = await getProducts();
  const productsInfo = [];
  for (let i = 0; i < products.length; i++) {
    const productInfo = await getProductWithVariants(products[i].id);
    for (let j = 0; j < productInfo.sync_variants.length; j++) {
      const { variant_id } = productInfo.sync_variants[j];
      productInfo.sync_variants[j].info = await getVariantInfo(variant_id);
    }
    productsInfo.push(productInfo);
  }
  return productsInfo;
}

function parseProductWithVariants(product) {
  const productWithVariants = {
    product: parseProduct(product.sync_product),
    variants: product.sync_variants.map(parseVariant),
  };
  const images = productWithVariants.variants[0].images;
  if (
    productWithVariants.variants.every(
      (variant) =>
        JSON.stringify(variant.images[0]) === JSON.stringify(images[0])
    )
  ) {
    productWithVariants.product.images = images;
    productWithVariants.variants.forEach((variant) => (variant.images = []));
  }
  return productWithVariants;
}

function parseProduct(product) {
  return {
    id: product.id,
    name: product.name,
    images: [],
  };
}

function parseVariant(variant) {
  return {
    id: variant.id,
    name: variant.name,
    description: variant.info.name,
    size: variant.info.size,
    sku: variant.sku,
    price: parseFloat(variant.retail_price),
    images: variant.files.map((file) => ({
      upload: file.preview_url,
      contentType: file.mime_type,
      fileName: file.filename,
    })),
  };
}
