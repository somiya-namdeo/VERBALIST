
export function getProductImage(name: string, category: string, dbImageUrl: string | null): string {
  const n = name.toLowerCase();
  
  // If the DB image is NOT loremflickr and is valid, we could use it.
  // But since the DB is polluted with loremflickr, let's ignore loremflickr.
  if (dbImageUrl && !dbImageUrl.includes("loremflickr")) {
    return dbImageUrl;
  }

  if (n.includes("water")) return "https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=400&q=80";
  if (n.includes("milk")) return "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80";
  if (n.includes("orange")) return "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&w=400&q=80";
  if (n.includes("potato")) return "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=400&q=80";
  if (n.includes("tomato")) return "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=400&q=80";
  if (n.includes("toothpaste") || n.includes("dental") || n.includes("brush")) return "https://images.unsplash.com/photo-1559591937-05be348f98db?auto=format&fit=crop&w=400&q=80";
  if (n.includes("diaper") || n.includes("pants")) return "https://images.unsplash.com/photo-1544288001-f09bc1d51a66?auto=format&fit=crop&w=400&q=80"; // baby stuff
  if (n.includes("wipe")) return "https://images.unsplash.com/photo-1584824388151-6101c5188f61?auto=format&fit=crop&w=400&q=80"; // wipes/tissues
  if (n.includes("kajal") || n.includes("cosmetic") || n.includes("makeup")) return "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=400&q=80";
  if (n.includes("coffee") || n.includes("mocha") || n.includes("espresso")) return "https://images.unsplash.com/photo-1559525839-b184a4d698c7?auto=format&fit=crop&w=400&q=80";
  if (n.includes("cheese") || n.includes("paneer")) return "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=400&q=80";
  if (n.includes("biscuit") || n.includes("cookie") || n.includes("biscotti")) return "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=400&q=80";
  if (n.includes("ice cream") || n.includes("rajbhog")) return "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?auto=format&fit=crop&w=400&q=80";
  if (n.includes("apple")) return "https://images.unsplash.com/photo-1560806887-1e4cd0b6faa6?auto=format&fit=crop&w=400&q=80";
  if (n.includes("banana")) return "https://images.unsplash.com/photo-1571501679680-de32f1e7aad4?auto=format&fit=crop&w=400&q=80";
  if (n.includes("bread")) return "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80";
  if (n.includes("egg")) return "https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=400&q=80";
  if (n.includes("chicken")) return "https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=400&q=80";
  if (n.includes("meat") || n.includes("mutton")) return "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=400&q=80";
  if (n.includes("rice")) return "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80";
  if (n.includes("dal") || n.includes("lentil")) return "https://images.unsplash.com/photo-1515543904379-3d757afe72e4?auto=format&fit=crop&w=400&q=80";
  if (n.includes("oil")) return "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=80";
  if (n.includes("soap") || n.includes("wash")) return "https://images.unsplash.com/photo-1600857062241-98e5dba7f214?auto=format&fit=crop&w=400&q=80";
  if (n.includes("shampoo") || n.includes("hair")) return "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=400&q=80";
  if (n.includes("tea")) return "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=400&q=80";
  if (n.includes("chips") || n.includes("snack") || n.includes("namkeen")) return "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=400&q=80";
  
  // generic category fallbacks
  const c = category.toLowerCase();
  if (c.includes("fruits") || c.includes("vegetables")) return "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=400&q=80";
  if (c.includes("dairy")) return "https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=400&q=80";
  if (c.includes("beverage")) return "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80";
  if (c.includes("bakery")) return "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80";
  if (c.includes("personal care")) return "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=400&q=80";
  if (c.includes("household")) return "https://images.unsplash.com/photo-1584824388151-6101c5188f61?auto=format&fit=crop&w=400&q=80";

  // absolute fallback (ui-avatars)
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=f3f4f6&color=374151&size=400&font-size=0.33`;
}

