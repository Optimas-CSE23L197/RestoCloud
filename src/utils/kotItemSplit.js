// utils/kotItemSplit.js
//
// Shared decision logic: kaunsa item Kitchen (food) printer pe jayega,
// aur kaunsa Bar printer pe. Isi function ko KOT print aur bill print
// (food Tax-Invoice / liquor Invoice split) dono jagah reuse karna hai —
// isliye yeh ek standalone util hai, kisi ek component se bandha nahi.
//
// Backend field jo decide karta hai: `baryn`
//   baryn === "Y"  -> Bar / liquor item
//   baryn === "N" (ya missing/kuch aur) -> Food item
//
// Kabhi kabhi backend `DrinksYN` bhi bhejta hai jo usually `baryn` jaisa hi
// hota hai (sample data mein KINGFISHER ke liye dono "Y" the) — hum `baryn`
// ko primary source of truth rakhte hain kyunki wahi consistently har item
// pe present hai, `DrinksYN` ko sirf fallback ke taur pe check karte hain.

/**
 * Ek single KOT/bill item ko check karta hai — bar item hai ya nahi.
 * @param {object} item - raw item object jaisa backend se aata hai
 * @returns {boolean}
 */
export function isBarItem(item) {
  if (!item) return false;

  const baryn = (item.baryn || "").toString().trim().toUpperCase();
  if (baryn === "Y") return true;
  if (baryn === "N") return false;

  // Fallback: baryn missing/unexpected ho to DrinksYN dekh lo
  const drinksYn = (item.DrinksYN || item.drinksyn || "")
    .toString()
    .trim()
    .toUpperCase();
  return drinksYn === "Y";
}

/**
 * Poori item list ko do groups mein split karta hai: foodItems aur barItems.
 * Order preserve rehta hai apne-apne group ke andar.
 *
 * @param {Array<object>} items - raw KOT/bill items array
 * @returns {{ foodItems: Array<object>, barItems: Array<object>, hasFood: boolean, hasBar: boolean }}
 */
export function splitItemsByDestination(items) {
  const safeItems = Array.isArray(items) ? items : [];

  const foodItems = [];
  const barItems = [];

  safeItems.forEach((item) => {
    if (isBarItem(item)) {
      barItems.push(item);
    } else {
      foodItems.push(item);
    }
  });

  return {
    foodItems,
    barItems,
    hasFood: foodItems.length > 0,
    hasBar: barItems.length > 0,
  };
}
