
import { db } from "./firebase";
import { collection, doc, writeBatch } from "firebase/firestore";
import { mockProducts } from "./data";

export async function seedDatabase() {
    if (!db) throw new Error("Database not initialized. Check your .env.local configuration.");

    const batch = writeBatch(db);

    // Seed Products
    mockProducts.forEach((product) => {
        const productRef = doc(collection(db, "products"), product.id);
        batch.set(productRef, product);
    });

    try {
        await batch.commit();
        console.log("Database seeded successfully!");
        return true;
    } catch (error) {
        console.error("Error seeding database:", error);
        throw error;
    }
}
