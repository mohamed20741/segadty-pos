import { addProductToSheet } from "./google-sheets";
import { mockProducts } from "./data";

export async function seedDatabase() {
    console.log("Starting database seeding to Google Sheets...");

    // Seed Products one by one (Google Sheets POST is limited, but this is a one-time thing)
    // Using Promise.all with a small delay or Map might be better, but simple loop for now
    for (const product of mockProducts) {
        try {
            await addProductToSheet(product);
            console.log(`Added product: ${product.name}`);
        } catch (error) {
            console.error(`Failed to add product: ${product.name}`, error);
        }
    }

    console.log("Database seeding attempt completed!");
    return true;
}
