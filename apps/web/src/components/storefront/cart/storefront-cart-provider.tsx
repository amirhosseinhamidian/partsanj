'use client';

import { useToast } from '@/components/providers/toast-provider';
import { storefrontCartApi } from '@/lib/api/storefront-cart-client';
import { ClientApiError } from '@/lib/api/web-client';
import type {
  AddCartItemInput,
  StorefrontCart,
  UpdateCartItemQuantityInput,
} from '@/lib/storefront/cart/cart.types';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

type StorefrontCartContextValue = {
  cart: StorefrontCart | null;
  itemCount: number;
  isLoading: boolean;
  isMutating: boolean;
  reloadCart: () => Promise<StorefrontCart | null>;
  addItem: (input: AddCartItemInput) => Promise<StorefrontCart>;
  updateItemQuantity: (
    itemId: string,
    input: UpdateCartItemQuantityInput,
  ) => Promise<StorefrontCart>;
  removeItem: (itemId: string) => Promise<StorefrontCart>;
};

const StorefrontCartContext = createContext<StorefrontCartContextValue | null>(null);

function getCartErrorMessage(error: unknown): string {
  if (error instanceof ClientApiError) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'عملیات سبد خرید با خطا مواجه شد';
}

export function StorefrontCartProvider({ children }: PropsWithChildren) {
  const { toast } = useToast();

  const [cart, setCart] = useState<StorefrontCart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);

  const reloadCart = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await storefrontCartApi.getCart();

      setCart(response.data);

      return response.data;
    } catch {
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reloadCart();
  }, [reloadCart]);

  const addItem = useCallback(
    async (input: AddCartItemInput) => {
      setIsMutating(true);

      try {
        const response = await storefrontCartApi.addItem(input);

        setCart(response.data);

        toast({
          position: 'top-left',
          variant: 'success',
          title: 'به سبد خرید اضافه شد',
          description: 'قطعه موردنظر با موفقیت به سبد خرید شما اضافه شد',
        });

        return response.data;
      } catch (error) {
        toast({
          position: 'top-left',
          variant: 'danger',
          title: 'افزودن به سبد خرید انجام نشد',
          description: getCartErrorMessage(error),
        });

        throw error;
      } finally {
        setIsMutating(false);
      }
    },
    [toast],
  );

  const updateItemQuantity = useCallback(
    async (itemId: string, input: UpdateCartItemQuantityInput) => {
      setIsMutating(true);

      try {
        const response = await storefrontCartApi.updateItemQuantity(itemId, input);

        setCart(response.data);

        return response.data;
      } catch (error) {
        toast({
          position: 'top-left',
          variant: 'danger',
          title: 'تغییر تعداد انجام نشد',
          description: getCartErrorMessage(error),
        });

        throw error;
      } finally {
        setIsMutating(false);
      }
    },
    [toast],
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      setIsMutating(true);

      try {
        const response = await storefrontCartApi.removeItem(itemId);

        setCart(response.data);

        toast({
          position: 'top-left',
          variant: 'success',
          title: 'از سبد خرید حذف شد',
        });

        return response.data;
      } catch (error) {
        toast({
          position: 'top-left',
          variant: 'danger',
          title: 'حذف از سبد خرید انجام نشد',
          description: getCartErrorMessage(error),
        });

        throw error;
      } finally {
        setIsMutating(false);
      }
    },
    [toast],
  );

  const itemCount = cart?.summary.itemCount ?? 0;

  const value = useMemo<StorefrontCartContextValue>(
    () => ({
      cart,
      itemCount,
      isLoading,
      isMutating,
      reloadCart,
      addItem,
      updateItemQuantity,
      removeItem,
    }),
    [addItem, cart, isLoading, isMutating, itemCount, reloadCart, removeItem, updateItemQuantity],
  );

  return <StorefrontCartContext.Provider value={value}>{children}</StorefrontCartContext.Provider>;
}

export function useStorefrontCart() {
  const context = useContext(StorefrontCartContext);

  if (!context) {
    throw new Error('useStorefrontCart must be used inside StorefrontCartProvider');
  }

  return context;
}
