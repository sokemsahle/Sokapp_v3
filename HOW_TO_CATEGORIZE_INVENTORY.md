# How to Categorize Empty/Uncategorized Inventory Items

## Problem
Some inventory items in your organization may have **empty or missing categories**. This guide shows you how to assign proper categories.

---

## Step 1: Run the Categorization Script

Open phpMyAdmin and execute:

```sql
-- First, see what needs categorization
SELECT id, name, category, quantity, unit, location
FROM inventory 
WHERE category IS NULL OR category = '' OR TRIM(category) = '';
```

This will show you all items that need categories assigned.

---

## Step 2: Assign Categories Based on Item Type

Use these UPDATE statements (customize based on your actual items):

### Medical Supplies
```sql
UPDATE inventory SET category = 'Medical' 
WHERE name LIKE '%medicine%' 
   OR name LIKE '%bandage%' 
   OR name LIKE '%first aid%'
   OR name LIKE '%syringe%'
   OR name LIKE '%thermometer%';
```

### Educational Materials
```sql
UPDATE inventory SET category = 'Education' 
WHERE name LIKE '%book%' 
   OR name LIKE '%notebook%' 
   OR name LIKE '%pen%' 
   OR name LIKE '%pencil%'
   OR name LIKE '%textbook%'
   OR name LIKE '%exercise book%';
```

### Hygiene Products
```sql
UPDATE inventory SET category = 'Hygiene' 
WHERE name LIKE '%soap%' 
   OR name LIKE '%shampoo%' 
   OR name LIKE '%toothbrush%' 
   OR name LIKE '%towel%'
   OR name LIKE '%toilet paper%'
   OR name LIKE '%sanitizer%';
```

### Clothing Items
```sql
UPDATE inventory SET category = 'Clothing' 
WHERE name LIKE '%shirt%' 
   OR name LIKE '%pants%' 
   OR name LIKE '%dress%' 
   OR name LIKE '%shoes%'
   OR name LIKE '%uniform%'
   OR name LIKE '%jacket%';
```

### Kitchen Supplies
```sql
UPDATE inventory SET category = 'Kitchen Supplies' 
WHERE name LIKE '%pot%' 
   OR name LIKE '%pan%' 
   OR name LIKE '%plate%' 
   OR name LIKE '%spoon%' 
   OR name LIKE '%fork%'
   OR name LIKE '%knife%'
   OR name LIKE '%cooking%';
```

### Baby Care Items
```sql
UPDATE inventory SET category = 'Baby Care' 
WHERE name LIKE '%diaper%' 
   OR name LIKE '%baby bottle%' 
   OR name LIKE '%pacifier%'
   OR name LIKE '%baby food%'
   OR name LIKE '%infant%';
```

### Cleaning Supplies
```sql
UPDATE inventory SET category = 'Cleaning Supplies' 
WHERE name LIKE '%broom%' 
   OR name LIKE '%mop%' 
   OR name LIKE '%detergent%' 
   OR name LIKE '%cleaner%'
   OR name LIKE '%bleach%';
```

### Furniture
```sql
UPDATE inventory SET category = 'Furniture' 
WHERE name LIKE '%chair%' 
   OR name LIKE '%table%' 
   OR name LIKE '%desk%' 
   OR name LIKE '%bed%'
   OR name LIKE '%cabinet%'
   OR name LIKE '%shelf%';
```

### Electronics
```sql
UPDATE inventory SET category = 'Electronics' 
WHERE name LIKE '%computer%' 
   OR name LIKE '%phone%' 
   OR name LIKE '%tablet%' 
   OR name LIKE '%charger%'
   OR name LIKE '%battery%'
   OR name LIKE '%cable%';
```

### Office Supplies
```sql
UPDATE inventory SET category = 'Office Supplies' 
WHERE name LIKE '%paper%' 
   OR name LIKE '%folder%' 
   OR name LIKE '%stapler%'
   OR name LIKE '%pen%'
   OR name LIKE '%ink%';
```

### Sports & Recreation
```sql
UPDATE inventory SET category = 'Sports & Recreation' 
WHERE name LIKE '%ball%' 
   OR name LIKE '%game%' 
   OR name LIKE '%toy%'
   OR name LIKE '%puzzle%'
   OR name LIKE '%sports%';
```

### Bedding & Linens
```sql
UPDATE inventory SET category = 'Bedding & Linens' 
WHERE name LIKE '%blanket%' 
   OR name LIKE '%pillow%' 
   OR name LIKE '%sheet%' 
   OR name LIKE '%towel%'
   OR name LIKE '%mattress%';
```

---

## Step 3: Verify Your Work

After updating, run:

```sql
-- Check summary by category
SELECT category, COUNT(*) as item_count, SUM(quantity) as total_quantity
FROM inventory 
GROUP BY category
ORDER BY item_count DESC;

-- Find any remaining uncategorized items
SELECT id, name, category
FROM inventory 
WHERE category IS NULL OR category = '' OR TRIM(category) = '';
```

---

## Quick Reference: Category Names

Use these exact category names (from the lookup list):

| Category Name | Use For |
|--------------|---------|
| Food & Nutrition | Food items, baby food, nutritional products |
| Hygiene | Soap, shampoo, toothbrush, sanitizer |
| Education | Books, notebooks, pens, educational materials |
| Medical | Medicine, bandages, first aid, medical equipment |
| Clothing | Shirts, pants, shoes, uniforms |
| Other | Miscellaneous items |
| Office Supplies | Paper, folders, pens, office equipment |
| Cleaning Supplies | Detergents, brooms, mops, cleaners |
| Maintenance | Building maintenance, repairs, hardware |
| Electronics | Computers, phones, chargers, cables |
| Furniture | Chairs, tables, beds, cabinets |
| Vehicles | Vehicle parts, accessories |
| Sports & Recreation | Games, toys, sports equipment |
| Kitchen Supplies | Cookware, utensils, dishes |
| Bedding & Linens | Blankets, pillows, sheets, towels |
| Baby Care | Diapers, baby bottles, infant items |
| First Aid | Bandages, antiseptics, medical kits |
| Stationery | Writing materials, art supplies |
| Tools & Equipment | Hand tools, power tools |

---

## Example: Complete Categorization

If you have these uncategorized items:
- "Rice 50kg bag"
- "Soap bars"
- "Notebooks"
- "Chairs"

Run:
```sql
UPDATE inventory SET category = 'Food & Nutrition' WHERE name = 'Rice 50kg bag';
UPDATE inventory SET category = 'Hygiene' WHERE name = 'Soap bars';
UPDATE inventory SET category = 'Education' WHERE name = 'Notebooks';
UPDATE inventory SET category = 'Furniture' WHERE name = 'Chairs';
```

---

## Automated Script

For a complete automated approach, run:

```sql
source "c:\Users\hp\Documents\code\SOKAPP project\Version 3\database\assign_inventory_categories.sql";
```

This will:
1. Show current inventory
2. Find uncategorized items
3. Provide templates for categorization
4. Verify results

---

## Tips

✅ **Use descriptive item names** - Makes auto-categorization easier  
✅ **Check before updating** - Review items before assigning categories  
✅ **Be consistent** - Use the same category for similar items  
✅ **Verify after updates** - Always check that updates worked  
✅ **Use the lookup list** - All categories are managed in Lookup Editor  

---

**Need Help?**  
Refer to `INVENTORY_CATEGORIES_LIST.md` for the complete list of 19 available categories.
