import { Product } from "@/types";

export const mockProducts: Product[] = [
    {
        id: "PRD-001",
        name: "سجاد صلاة فاخر مخطط",
        category: "سجاد فاخر",
        cost_price: 150,
        selling_price: 250,
        branch_id: "HAM",
        quantity: 25,
        min_quantity: 5,
        description: "سجاد صلاة عالي الجودة مع نقوش إسلامية مميزة",
        image: "/images/products/rug-1.jpg" // Placeholder path
    },
    {
        id: "PRD-002",
        name: "سجاد صلاة تركي كلاسيك",
        category: "سجاد عادي",
        cost_price: 80,
        selling_price: 120,
        branch_id: "HAM",
        quantity: 50,
        min_quantity: 10,
        description: "سجاد تركي مريح ومتين",
    },
    {
        id: "PRD-003",
        name: "سجاد أطفال تعليمي",
        category: "سجاد أطفال",
        cost_price: 40,
        selling_price: 75,
        branch_id: "HAM",
        quantity: 15,
        min_quantity: 5,
        description: "سجاد ملون لتعليم الأطفال الصلاة",
    },
    {
        id: "PRD-004",
        name: "مسند ظهر طبي",
        category: "إكسسوارات",
        cost_price: 60,
        selling_price: 100,
        branch_id: "HAM",
        quantity: 30,
        min_quantity: 8,
    },
    {
        id: "PRD-005",
        name: "طقم صلاة هدية (سجادة + مصحف)",
        category: "سجاد فاخر",
        cost_price: 200,
        selling_price: 350,
        branch_id: "HAM",
        quantity: 10,
        min_quantity: 3,
    },
    {
        id: "PRD-006",
        name: "سجاد حرير فاخر",
        category: "سجاد فاخر",
        cost_price: 500,
        selling_price: 850,
        branch_id: "HAM",
        quantity: 5,
        min_quantity: 2,
    }
];

export const SAUDI_CITIES = [
    "الرياض", "جدة", "مكة المكرمة", "المدينة المنورة",
    "الدمام", "الخبر", "الظهران", "القصيم", "بريدة",
    "عنيزة", "أبها", "خميس مشيط", "الطائف", "تبوك",
    "حائل", "جازان", "نجران", "الجبيل", "ينبع"
];
