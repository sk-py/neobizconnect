import { hasModuleAccess } from '@/constants/modules'
import { useAuth } from '@/hooks/use-auth'
import DealerProductsScreen from '@/modules/sales-order/components/sales-order-screen'
import { Redirect } from 'expo-router'

// Importing the Screen from the given path
const SalesOrder = () => {
  const { user } = useAuth()

  if (!hasModuleAccess("Sales Order", user?.authority)) {
    return <Redirect href={"/"} />
  }

  // React component returns the Sales Order UI
  return (
    <DealerProductsScreen />
  )
}

export default SalesOrder

// SalesOrder
//     ↓
// DealerProductsScreen
//     ↓
// Actual Sales Order UI

// Data flow in this app:
// LAYER 1: services/sales-order/products.api.ts
//           → calls the backend using Axios
//
// LAYER 2: hooks/use-products.ts
//           → wraps the API call with React Query
//
// LAYER 3: components/sales-order-screen.tsx
//           → uses the hook and displays the data