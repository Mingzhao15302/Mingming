import { useContext } from 'react';
import { SidebarContext, AuthContext, ToastContext, CartContext } from '../context/AppProviders.jsx';

export const useSidebar = () => useContext(SidebarContext);
export const useAuth = () => useContext(AuthContext);
export const useToast = () => useContext(ToastContext);
export const useCart = () => useContext(CartContext);
