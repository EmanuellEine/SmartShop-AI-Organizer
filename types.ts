
export enum Category {
  FRUITS_VEGGIES = 'Frutas e Verduras',
  MEAT_COLDCUTS = 'Carnes e Frios',
  DAIRY_BREAKFAST = 'Laticínios e Café da Manhã',
  BAKERY = 'Padaria',
  PANTRY = 'Despensa',
  BEVERAGES = 'Bebidas',
  CLEANING = 'Limpeza',
  HYGIENE_BEAUTY = 'Higiene e Beleza',
  OTHERS = 'Outros'
}

export interface ShoppingItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: Category;
  checked: boolean;
}

export interface AISuggestion {
  name: string;
  category: Category;
  reason: string;
}
