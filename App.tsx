
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ShoppingItem, Category, AISuggestion } from './types';
import { getForgottenSuggestions, autoCategorizeItems } from './services/gemini';
import { 
  PlusIcon, 
  TrashIcon, 
  SparklesIcon, 
  ShoppingCartIcon, 
  ChartPieIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronRightIcon,
  LayoutGridIcon,
  ArrowRightIcon,
  Loader2Icon
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const App: React.FC = () => {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<Category>(Category.OTHERS);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [isAutoOrganizing, setIsAutoOrganizing] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('smart_shop_list');
    if (saved) {
      setItems(JSON.parse(saved));
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem('smart_shop_list', JSON.stringify(items));
  }, [items]);

  const addItem = useCallback(() => {
    if (!newItemName.trim()) return;
    const newItem: ShoppingItem = {
      id: crypto.randomUUID(),
      name: newItemName,
      price: 0,
      quantity: 1,
      category: newItemCategory,
      checked: false
    };
    setItems(prev => [...prev, newItem]);
    setNewItemName('');
  }, [newItemName, newItemCategory]);

  const toggleItem = (id: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const updateItem = (id: string, updates: Partial<ShoppingItem>) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const handleFetchSuggestions = async () => {
    setLoadingSuggestions(true);
    const result = await getForgottenSuggestions(items);
    setSuggestions(result);
    setLoadingSuggestions(false);
  };

  const handleAutoOrganize = async () => {
    if (items.length === 0) return;
    setIsAutoOrganizing(true);
    const categorizations = await autoCategorizeItems(items);
    setItems(prev => prev.map(item => {
      const match = categorizations.find(c => c.id === item.id);
      return match ? { ...item, category: match.category } : item;
    }));
    setIsAutoOrganizing(false);
  };

  const addSuggestion = (suggestion: AISuggestion) => {
    const newItem: ShoppingItem = {
      id: crypto.randomUUID(),
      name: suggestion.name,
      price: 0,
      quantity: 1,
      category: suggestion.category,
      checked: false
    };
    setItems(prev => [...prev, newItem]);
    setSuggestions(prev => prev.filter(s => s.name !== suggestion.name));
  };

  const totalPrice = useMemo(() => {
    return items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }, [items]);

  // Use explicit typing to avoid unknown inference issues
  const groupedItems = useMemo<Record<string, ShoppingItem[]>>(() => {
    const groups: Record<string, ShoppingItem[]> = {};
    items.forEach(item => {
      const category = item.category as string;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
    });
    return groups;
  }, [items]);

  // Use explicit typing to avoid unknown inference issues (fixing errors on line 285 and 291)
  const chartData = useMemo<{ name: string; value: number }[]>(() => {
    const categoriesMap: Record<string, number> = {};
    items.forEach(item => {
      const cat = item.category as string;
      categoriesMap[cat] = (categoriesMap[cat] || 0) + (item.price * item.quantity);
    });
    return Object.entries(categoriesMap)
      .map(([name, value]) => ({ name, value }))
      .filter(d => d.value > 0);
  }, [items]);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6', '#f97316'];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24">
      {/* Header - Alinhamento corrigido */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 h-16 md:px-8 flex items-center">
        <div className="max-w-5xl w-full mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 p-2 rounded-xl shadow-lg shadow-emerald-100 flex items-center justify-center">
              <ShoppingCartIcon className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent hidden xs:block">
              SmartShop AI
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={handleAutoOrganize}
              disabled={isAutoOrganizing || items.length === 0}
              className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all disabled:opacity-50 h-10 border border-indigo-100"
            >
              {isAutoOrganizing ? <Loader2Icon className="w-4 h-4 animate-spin" /> : <LayoutGridIcon className="w-4 h-4" />}
              Organizar Categorias
            </button>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChartPieIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Formulário de Adição - Melhor alinhamento e consistência de altura */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <PlusIcon className="w-4 h-4 text-emerald-500" />
              Adicionar Produto
            </h2>
            <div className="flex flex-col sm:flex-row gap-3 items-stretch">
              <input
                type="text"
                placeholder="Ex: Queijo Mussarela..."
                className="flex-[2] px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none transition-all text-sm"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addItem()}
              />
              <select
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none text-sm cursor-pointer"
                value={newItemCategory}
                onChange={(e) => setNewItemCategory(e.target.value as Category)}
              >
                {Object.values(Category).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <button
                onClick={addItem}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-100 active:scale-95 flex items-center justify-center gap-2"
              >
                <span>Adicionar</span>
              </button>
            </div>
            {/* Mobile-only auto-organize */}
            <button 
              onClick={handleAutoOrganize}
              disabled={isAutoOrganizing || items.length === 0}
              className="sm:hidden w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-xl disabled:opacity-50"
            >
              {isAutoOrganizing ? <Loader2Icon className="w-4 h-4 animate-spin" /> : <LayoutGridIcon className="w-4 h-4" />}
              Auto-organizar Categorias
            </button>
          </section>

          {/* Sugestões Inteligentes */}
          <section className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <SparklesIcon className="w-16 h-16 text-emerald-600" />
            </div>
            
            <div className="flex items-center justify-between mb-4 relative z-10">
              <h2 className="text-sm font-bold text-emerald-800 uppercase tracking-widest flex items-center gap-2">
                <SparklesIcon className="w-4 h-4 text-emerald-500" />
                Dicas da IA
              </h2>
              <button
                onClick={handleFetchSuggestions}
                disabled={loadingSuggestions}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 disabled:opacity-50 flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-emerald-100 shadow-sm transition-all hover:shadow-md"
              >
                {loadingSuggestions ? <Loader2Icon className="w-3 h-3 animate-spin" /> : <ArrowRightIcon className="w-3 h-3" />}
                O QUE FALTA?
              </button>
            </div>

            {suggestions.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10">
                {suggestions.map((s, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-xl border border-emerald-200 flex items-start justify-between group/card hover:border-emerald-400 transition-all shadow-sm">
                    <div className="flex-1 pr-2">
                      <p className="font-bold text-slate-800 text-sm">{s.name}</p>
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase mt-0.5">{s.category}</p>
                      <p className="text-[10px] text-emerald-600 italic mt-1 leading-tight line-clamp-2">{s.reason}</p>
                    </div>
                    <button
                      onClick={() => addSuggestion(s)}
                      className="p-2 rounded-lg bg-emerald-50 text-emerald-600 opacity-0 group-hover/card:opacity-100 transition-opacity hover:bg-emerald-500 hover:text-white"
                    >
                      <PlusIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : !loadingSuggestions && (
              <div className="text-center py-6 text-slate-500 relative z-10">
                <p className="text-xs font-medium italic">
                  {items.length === 0 ? "Adicione itens para receber sugestões personalizadas." : "Clique em 'O que falta?' para ver recomendações."}
                </p>
              </div>
            )}
            
            {loadingSuggestions && (
              <div className="flex flex-col items-center justify-center py-8 space-y-3 relative z-10">
                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-emerald-700 text-xs font-bold uppercase tracking-widest">Analisando sua lista...</p>
              </div>
            )}
          </section>

          {/* Lista por Categorias */}
          <section className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-lg font-black text-slate-800">Sua Lista</h2>
              {items.length > 0 && (
                <button 
                  onClick={() => setItems([])}
                  className="text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1 bg-red-50 px-2 py-1 rounded-md"
                >
                  <TrashIcon className="w-3 h-3" />
                  LIMPAR TUDO
                </button>
              )}
            </div>
            
            {items.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border-2 border-dashed border-slate-200 text-center space-y-4 shadow-sm">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto border border-slate-100">
                  <ShoppingCartIcon className="w-10 h-10 text-slate-200" />
                </div>
                <div className="space-y-1">
                  <p className="text-slate-600 font-bold">Carrinho Vazio</p>
                  <p className="text-slate-400 text-sm">Adicione produtos acima para começar.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(groupedItems).map(([category, catItems]) => (
                  <div key={category} className="space-y-4">
                    <div className="flex items-center gap-4 px-2">
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">
                        {category} <span className="text-emerald-500">({catItems.length})</span>
                      </h3>
                      <div className="h-px w-full bg-slate-200"></div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3">
                      {catItems.map(item => (
                        <div 
                          key={item.id}
                          className={`flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-2xl border shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 ${item.checked ? 'border-emerald-100 bg-emerald-50/10 opacity-60' : 'border-slate-200'}`}
                        >
                          <button 
                            onClick={() => toggleItem(item.id)}
                            className={`flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${item.checked ? 'bg-emerald-500 border-emerald-500 text-white rotate-0' : 'border-slate-200 bg-slate-50 rotate-90'}`}
                          >
                            {item.checked && <CheckCircleIcon className="w-4 h-4" />}
                          </button>

                          <div className="flex-1 min-w-0 w-full">
                            <p className={`font-bold text-slate-800 text-base truncate ${item.checked ? 'line-through text-slate-400' : ''}`}>
                              {item.name}
                            </p>
                          </div>

                          <div className="flex items-center gap-4 w-full sm:w-auto">
                            <div className="flex items-center bg-slate-50 border border-slate-100 rounded-xl p-1 shadow-inner">
                              <button 
                                onClick={() => updateItem(item.id, { quantity: Math.max(1, item.quantity - 1) })}
                                className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg transition-all text-slate-500 hover:text-emerald-600 font-black text-lg"
                              >
                                -
                              </button>
                              <span className="w-8 text-center text-sm font-black text-slate-700">{item.quantity}</span>
                              <button 
                                onClick={() => updateItem(item.id, { quantity: item.quantity + 1 })}
                                className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg transition-all text-slate-500 hover:text-emerald-600 font-black text-lg"
                              >
                                +
                              </button>
                            </div>

                            <div className="relative flex-1 sm:w-32 group/price">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-black group-focus-within/price:text-emerald-500 transition-colors">R$</span>
                              <input
                                type="number"
                                step="0.01"
                                placeholder="0,00"
                                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:border-transparent outline-none transition-all shadow-inner"
                                value={item.price === 0 ? '' : item.price}
                                onChange={(e) => updateItem(item.id, { price: parseFloat(e.target.value) || 0 })}
                              />
                            </div>

                            <button 
                              onClick={() => removeItem(item.id)}
                              className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Resumo Lateral - Sidebar com alinhamento refinado */}
        <aside className={`lg:block ${isSidebarOpen ? 'fixed inset-0 z-50 bg-white p-8 overflow-y-auto' : 'hidden'}`}>
          <div className="sticky top-24 space-y-6">
            {isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="mb-8 flex items-center gap-2 text-slate-800 font-black text-sm uppercase tracking-widest"
              >
                <XCircleIcon className="w-6 h-6 text-red-500" /> FECHAR RESUMO
              </button>
            )}

            <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 blur-[80px] rounded-full -mr-16 -mt-16 group-hover:scale-125 transition-transform duration-700"></div>
              
              <div className="relative z-10">
                <h3 className="text-slate-500 text-[10px] font-black mb-1 uppercase tracking-[0.3em]">Previsão Total</h3>
                <div className="flex items-baseline gap-1 mb-10">
                  <span className="text-xl font-black text-emerald-500">R$</span>
                  <p className="text-5xl font-black tracking-tighter">
                    {totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                
                <div className="space-y-6 pt-10 border-t border-slate-800">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Produtos</span>
                    <span className="font-black text-lg">{items.reduce((acc, i) => acc + i.quantity, 0)}</span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                      <span>Progresso da Compra</span>
                      <span className="text-emerald-400">
                        {items.length > 0 ? Math.round((items.filter(i => i.checked).length / items.length) * 100) : 0}%
                      </span>
                    </div>
                    <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-1000 ease-out" 
                        style={{ width: `${items.length > 0 ? (items.filter(i => i.checked).length / items.length) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm">
              <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest mb-8 flex items-center gap-2">
                <ChartPieIcon className="w-4 h-4 text-indigo-500" />
                Gastos por Categoria
              </h3>
              
              {chartData.length > 0 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={85}
                        paddingAngle={8}
                        dataKey="value"
                        stroke="none"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: '800' }}
                        formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Total']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-300 text-xs font-bold uppercase tracking-widest italic">
                  Sem dados para exibir
                </div>
              )}

              <div className="mt-6 space-y-3">
                {chartData.map((data, idx) => (
                  <div key={data.name} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full ring-4 ring-slate-50" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                      <span className="text-slate-500 text-[10px] font-black uppercase tracking-tight group-hover:text-slate-800 transition-colors">{data.name}</span>
                    </div>
                    <span className="text-slate-900 font-black text-xs">R$ {data.value.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* Barra de Total Flutuante (Mobile) - Design Refinado */}
      <div className="lg:hidden fixed bottom-6 left-6 right-6 z-40">
        <div className="bg-white/90 backdrop-blur-xl border border-white/20 p-5 rounded-[2rem] shadow-2xl shadow-emerald-900/10 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] mb-0.5">Total Estimado</p>
            <p className="text-2xl font-black text-slate-900 leading-none">
              <span className="text-emerald-500 text-sm mr-1">R$</span>
              {totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="bg-slate-900 text-white h-14 w-14 rounded-2xl flex items-center justify-center shadow-xl shadow-slate-200 active:scale-90 transition-all"
          >
            <ChartPieIcon className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
