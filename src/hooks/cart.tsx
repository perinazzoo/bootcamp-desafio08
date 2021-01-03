import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const STORAGE_KEY = '@GoMarketplace';

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const items = await AsyncStorage.getItem(STORAGE_KEY);

      if (items) {
        setProducts(JSON.parse(items));
      }
    }

    loadProducts();
  }, []);

  const setAsyncStorage = useCallback(async (): Promise<void> => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  }, [products]);

  const addToCart = useCallback(
    async (product: Omit<Product, 'quantity'>) => {
      const productExists = products.find(p => p.id === product.id);

      if (productExists) {
        setProducts(
          products.map(p =>
            p.id !== product.id
              ? p
              : {
                ...p,
                quantity: p.quantity + 1,
              },
          ),
        );
        await setAsyncStorage();
        return;
      }

      setProducts([
        {
          ...product,
          quantity: 1,
        },
        ...products,
      ]);
      await setAsyncStorage();
    },
    [products, setAsyncStorage],
  );

  const increment = useCallback(
    async id => {
      setProducts(
        products.map(p =>
          p.id !== id
            ? p
            : {
              ...p,
              quantity: p.quantity + 1,
            },
        ),
      );
      await setAsyncStorage();
    },
    [products, setAsyncStorage],
  );

  const decrement = useCallback(
    async id => {
      const product = products.find(p => p.id === id);

      if (product!.quantity <= 1) {
        setProducts(products.filter(p => p.id !== id));
        await setAsyncStorage();
        return;
      }

      setProducts(
        products.map(p =>
          p.id !== id
            ? p
            : {
              ...p,
              quantity: p.quantity - 1,
            },
        ),
      );
      await setAsyncStorage();
    },
    [products, setAsyncStorage],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
