
import { Product } from "../types";

export const getProductByBarcode = async (barcode: string): Promise<Partial<Product> | null> => {
  try {
    // OpenFoodFacts is open and works for many cosmetic items (OpenBeautyFacts is the sibling)
    const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    const data = await response.json();

    if (data.status === 1) {
      const p = data.product;
      return {
        barcode,
        name: p.product_name || "Unknown Product",
        brand: p.brands || "Unknown Brand",
        image: p.image_url,
        ingredientsText: p.ingredients_text || ""
      };
    }
    return null;
  } catch (error) {
    console.error("Barcode lookup error:", error);
    return null;
  }
};
