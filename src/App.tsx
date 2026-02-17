import { useState, useMemo, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './lib/firebase';
import { useBackup } from './hooks/useBackup';
import Dashboard from './components/Dashboard';
import InventoryList from './components/InventoryList';
import StoreManager from './components/StoreManager';
import HistoryDashboard from './components/HistoryDashboard';
import Sidebar from './components/Sidebar';
import TyreForm from './components/TyreForm';
import LoginScreen from './components/LoginScreen';
import AccountManager from './components/AccountManager';
import WarrantyDashboard from './components/WarrantyDashboard';
import ClaimsDashboard from './components/ClaimsDashboard';
import { useInventory } from './hooks/useInventory';
import type { Tyre } from './types';
import { Plus } from 'lucide-react';
import BrandInventoryView from './components/BrandInventoryView';

function App() {
  const [user, loading] = useAuthState(auth);
  // Pass user ID to inventory hook for data isolation
  const inventoryHook = useInventory(user?.uid);
  const {
    inventory,
    stores,
    managedBrands,
    addTyre,
    updateTyre,
    deleteTyre,
    addBrand,
    removeBrand
  } = inventoryHook;

  // Auto-run backup service
  useBackup(inventoryHook);

  // View State
  const [currentView, setCurrentView] = useState<'inventory' | 'stores' | 'history' | 'brand' | 'warranty' | 'claims'>(() => {
    return (localStorage.getItem('app-current-view') as any) || 'inventory';
  });

  // Persist View
  useEffect(() => {
    localStorage.setItem('app-current-view', currentView);
  }, [currentView]);

  const [viewBrand, setViewBrand] = useState<string | null>(null);
  const [isAccountOpen, setIsAccountOpen] = useState(false);

  // Inventory Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedRimSize, setSelectedRimSize] = useState<string>('');
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');

  const [editingTyre, setEditingTyre] = useState<Tyre | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Extract unique brands for Filter (Only those with Inventory)
  const allAvailableBrands = useMemo(() => Array.from(new Set(
    inventory.map(t => t.brand)
  )).sort(), [inventory]);

  // Sidebar should show ALL available brands (Managed + those with stock)
  // But we want to preserve the "Managed" list for the settings modal.
  // Sidebar component takes `brands` prop for the list.
  const sidebarBrands = useMemo(() => {
    const withStock = new Set(inventory.map(t => t.brand));
    const merged = new Set([...managedBrands, ...Array.from(withStock)]);
    return Array.from(merged).sort();
  }, [inventory, managedBrands]);

  // Extract unique Rim Sizes
  const uniqueRimSizes = useMemo(() => {
    const rims = new Set<string>();
    inventory.forEach(t => {
      const match = t.size.match(/R\d+/i);
      if (match) rims.add(match[0].toUpperCase());
    });
    return Array.from(rims).sort();
  }, [inventory]);

  // Extract unique Tyre Types
  const uniqueTypes = useMemo(() => Array.from(new Set(
    inventory.map(t => t.type).filter(Boolean) as string[]
  )).sort(), [inventory]);

  const filteredInventory = inventory.filter(tyre => {
    const matchesSearch = tyre.size.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tyre.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBrand = selectedBrand ? tyre.brand === selectedBrand : true;
    const matchesStore = selectedStore ? tyre.storeId === selectedStore : true;
    const matchesType = selectedType ? tyre.type === selectedType : true;

    let matchesRim = true;
    if (selectedRimSize) {
      const match = tyre.size.match(/R\d+/i);
      const rim = match ? match[0].toUpperCase() : '';
      matchesRim = rim === selectedRimSize;
    }

    return matchesSearch && matchesBrand && matchesStore && matchesRim && matchesType;
  });

  const handleAddClick = () => {
    setEditingTyre(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (tyre: Tyre) => {
    setEditingTyre(tyre);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (data: Omit<Tyre, 'id'>, date?: string) => {
    if (editingTyre) {
      updateTyre(editingTyre.id, data, date);
    } else {
      addTyre(data, date);
      // Auto-add brand to sidebar if new
      addBrand(data.brand);
    }
    setIsFormOpen(false);
  };

  const handleBrandSelect = (brand: string) => {
    setViewBrand(brand);
    setCurrentView('brand');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'stores':
        return (
          <StoreManager
            stores={stores}
            inventory={inventory}
            onAddStore={inventoryHook.addStore}
            onUpdateStore={inventoryHook.updateStore}
            onDeleteStore={inventoryHook.deleteStore}
            onDeleteTyre={deleteTyre}
            onAddTyre={handleAddClick}
          />
        );
      case 'history':
        return (
          <HistoryDashboard
            inventory={inventory}
            transactions={inventoryHook.transactions}
            stores={stores}
            managedBrands={managedBrands}
            onDeleteTransaction={inventoryHook.deleteTransaction}
            onUpdateTransaction={inventoryHook.updateTransaction}
          />
        );
      case 'brand':
        return (
          <BrandInventoryView
            selectedBrand={viewBrand}
            inventory={inventory}
            stores={stores}
            managedBrands={managedBrands}
            onEdit={handleEditClick}
            onDeleteTyre={deleteTyre}
            onAddTyre={handleAddClick}
          />
        );
      case 'warranty':
        return (
          <WarrantyDashboard
            warranties={inventoryHook.warranties}
            onAddWarranty={inventoryHook.addWarranty}
            onUpdateWarranty={inventoryHook.updateWarranty}
            onDeleteWarranty={inventoryHook.deleteWarranty}
            managedBrands={managedBrands}
          />
        );
      case 'claims':
        return (
          <ClaimsDashboard
            claims={inventoryHook.claims}
            onAddClaim={inventoryHook.addClaim}
            onUpdateClaim={inventoryHook.updateClaim}
            onDeleteClaim={inventoryHook.deleteClaim}
            managedBrands={managedBrands}
          />
        );
      default:
        return (
          <div className="dashboard-container">
            <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <h1 className="page-title" style={{ margin: 0 }}>Inventory Dashboard</h1>
                <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)', lineHeight: 1 }}>
                  (Total: {inventory.reduce((acc, item) => acc + item.quantity, 0)})
                </span>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={handleAddClick} className="btn btn-primary">
                  <Plus size={20} />
                  Add New Tyre
                </button>
              </div>
            </div>

            <Dashboard
              inventory={inventory}
              transactions={inventoryHook.transactions}
              managedBrands={managedBrands}
            />

            <div className="section-card" style={{ marginTop: '2rem' }}>
              <div className="page-header" style={{ marginBottom: '1rem' }}>
                <h2 className="section-title">Stock List</h2>
              </div>

              <div className="filter-bar" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <div className="form-group" style={{ flex: 2, minWidth: '200px' }}>
                  <input
                    type="text"
                    placeholder="Search by size or brand..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ padding: '0.5rem', width: '100%' }}
                  />
                </div>
                <div className="form-group" style={{ flex: 1, minWidth: '120px' }}>
                  <select
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    style={{ padding: '0.5rem', width: '100%' }}
                  >
                    <option value="">All Brands</option>
                    {allAvailableBrands.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1, minWidth: '120px' }}>
                  <select
                    value={selectedRimSize}
                    onChange={(e) => setSelectedRimSize(e.target.value)}
                    style={{ padding: '0.5rem', width: '100%' }}
                  >
                    <option value="">All Rims</option>
                    {uniqueRimSizes.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
                  <select
                    value={selectedStore}
                    onChange={(e) => setSelectedStore(e.target.value)}
                    style={{ padding: '0.5rem', width: '100%' }}
                  >
                    <option value="">All Stores</option>
                    {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    style={{ padding: '0.5rem', width: '100%' }}
                  >
                    <option value="">All Types</option>
                    {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <InventoryList
                inventory={filteredInventory}
                stores={stores}
                onEdit={handleEditClick}
                onDelete={deleteTyre}
              />
            </div>

          </div>
        );
    }
  };

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div className="app-layout">
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        brands={sidebarBrands}
        currentBrand={viewBrand}
        onBrandSelect={handleBrandSelect}
        onAddBrand={addBrand}
        onRemoveBrand={removeBrand}
        user={user}
        onManageAccount={() => setIsAccountOpen(true)}
      />
      <main className="main-content">
        {renderContent()}
      </main>

      {isFormOpen && (
        <TyreForm
          initialData={editingTyre}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsFormOpen(false)}
          stores={stores}
          managedBrands={managedBrands}
          inventory={inventory}
        />
      )}

      {isAccountOpen && (
        <AccountManager
          user={user}
          isOpen={isAccountOpen}
          onClose={() => setIsAccountOpen(false)}
          inventoryHook={inventoryHook}
        />
      )}
    </div>
  );
}

export default App;
