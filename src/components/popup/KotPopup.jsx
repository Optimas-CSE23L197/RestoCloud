// components/popup/KotPopup.jsx
import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, Pressable, ScrollView, Alert, ActivityIndicator, useWindowDimensions } from 'react-native'; // ✅ import useWindowDimensions
import {
    FileText,
    X,
    Search,
    Plus,
    ChevronDown,
    ArrowLeftRight,
    Eye,
    Receipt,
    Save,
    MessageSquare,
    Trash2,
    LayoutGrid,
    Users
} from 'lucide-react-native';

import TableTransferPopup from './TableTransferPopup';
import CurrentItemsPopup from './CurrentItemsPopup';
import GenerateBillPopup from './GenerateBillPopup';
import KOTListPopup from './KOTListPopup';
import { getCurrentItems } from '../../../api/system.api';
import { useAuth } from '../../../src/context/AuthContext';

// Peg options derived from a menu item's rate fields.
// Only options with a rate > 0 are offered.
// pegdtl backend codes: S=Small, L=Large, 1=180ml, B=Bottle
function getPegOptions(menuItem) {
    const options = [];
    const small = parseFloat(menuItem?.smallpegrt) || 0;
    const large = parseFloat(menuItem?.largepegrt) || 0;
    const ml180 = parseFloat(menuItem?.b180mlrate) || 0;
    const bottle = parseFloat(menuItem?.bottrate) || 0;

    if (small > 0) options.push({ key: 'S', label: 'Small', rate: small });
    if (large > 0) options.push({ key: 'L', label: 'Large', rate: large });
    if (ml180 > 0) options.push({ key: '1', label: '180ml', rate: ml180 });
    if (bottle > 0) options.push({ key: 'B', label: 'Bottle', rate: bottle });

    return options;
}

// An item is liquor when fb <> "F" (not a food category) and beeryn === "Y".
function isLiquorItem(menuItem) {
    if (!menuItem) return false;
    const fb = (menuItem.fb || menuItem.FB || '').toUpperCase();
    const isBeverageCategory = fb !== 'F';
    const isLiquorFlag = menuItem.beeryn === 'Y';
    return isBeverageCategory && isLiquorFlag;
}

export default function KotPopup({
    visible,
    onClose,
    table,
    onProceed,
    onBillSaved,
    menuItems,
    posCd,
    tables = [],
    waiterName = 'Captain1'
}) {
    const { height: SCREEN_HEIGHT } = useWindowDimensions();

    const [quantity, setQuantity] = useState('1');
    const [items, setItems] = useState([]);

    const [searchText, setSearchText] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedMenuItem, setSelectedMenuItem] = useState(null);
    const [selectedPeg, setSelectedPeg] = useState(null);

    const [showTransferPopup, setShowTransferPopup] = useState(false);
    const [showCurrentItemsPopup, setShowCurrentItemsPopup] = useState(false);
    const [currentItemsData, setCurrentItemsData] = useState([]);
    const [showBillPopup, setShowBillPopup] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [expandedNoteId, setExpandedNoteId] = useState(null);
    const [showOptions, setShowOptions] = useState(false);
    const [showKOTListPopup, setShowKOTListPopup] = useState(false);

    const { selectedRestaurant } = useAuth();
    const userCd = selectedRestaurant?.usercd || '0000000001';
    const restaurantName = selectedRestaurant?.Restaurantnm || 'Restaurant';

    useEffect(() => {
        if (visible) {
            setItems([]);
            setQuantity('1');
            setSearchText('');
            setShowDropdown(false);
            setSelectedMenuItem(null);
            setSelectedPeg(null);
            setExpandedNoteId(null);
        }
    }, [visible, table?.tableCode]);

    const safeMenuItems = Array.isArray(menuItems) ? menuItems : [];

    const filteredMenuItems = safeMenuItems.filter((m) =>
        (m.menuname || '').toLowerCase().includes(searchText.toLowerCase())
    );

    const getDisplayRate = (menuItem) => {
        const rate = parseFloat(menuItem.rate) || 0;
        if (rate > 0) return rate;
        const smallPeg = parseFloat(menuItem.smallpegrt) || 0;
        if (smallPeg > 0) return smallPeg;
        const bottle = parseFloat(menuItem.bottrate) || 0;
        if (bottle > 0) return bottle;
        return 0;
    };

    const currentPegOptions = selectedMenuItem ? getPegOptions(selectedMenuItem) : [];
    const currentIsLiquor = selectedMenuItem ? isLiquorItem(selectedMenuItem) : false;

    const handlePickMenuItem = (menuItem) => {
        setSelectedMenuItem(menuItem);
        setSearchText(menuItem.menuname || '');
        setShowDropdown(false);

        const pegs = getPegOptions(menuItem);
        setSelectedPeg(pegs.length > 0 ? pegs[0] : null);
    };

    const handleAddItem = () => {
        if (!selectedMenuItem) return;

        if (currentIsLiquor && currentPegOptions.length > 0 && !selectedPeg) {
            Alert.alert('Error', 'Please select a peg size (Small / Large / 180ml / Bottle).');
            return;
        }

        const qty = parseInt(quantity) || 1;
        const price = currentIsLiquor && selectedPeg ? selectedPeg.rate : getDisplayRate(selectedMenuItem);

        const newItem = {
            id: Date.now(),
            menucode: selectedMenuItem.posmenucd,
            name: selectedMenuItem.menuname,
            price,
            qty,
            total: price * qty,
            baryn: selectedMenuItem.beeryn === 'Y' ? 'Y' : 'N',
            pegdtl: currentIsLiquor && selectedPeg ? selectedPeg.key : '',
            pegLabel: currentIsLiquor && selectedPeg ? selectedPeg.label : '',
            infoforkot: '',
            isLiquor: currentIsLiquor,
        };
        setItems([...items, newItem]);

        setSelectedMenuItem(null);
        setSelectedPeg(null);
        setSearchText('');
        setQuantity('1');
    };

    const handleRemoveItem = (id) => {
        setItems(items.filter((i) => i.id !== id));
        if (expandedNoteId === id) setExpandedNoteId(null);
    };

    const handleItemNoteChange = (id, text) => {
        setItems((prev) =>
            prev.map((it) => (it.id === id ? { ...it, infoforkot: text } : it))
        );
    };

    const handleCurrentItems = async () => {
        if (!posCd || !table?.tableCode) {
            Alert.alert('Error', 'POS or Table code missing');
            return;
        }

        console.log('[CurrentItems] 📞 Fetching items for table:', table.tableCode);
        const result = await getCurrentItems(posCd, table.tableCode);
        console.log('[CurrentItems] API result:', result);

        if (result.success && Array.isArray(result.data)) {
            setCurrentItemsData(result.data);
            setShowCurrentItemsPopup(true);
        } else {
            console.error('[CurrentItems] ❌ Failed to fetch:', result.error);
            Alert.alert('Error', 'Failed to fetch current items: ' + (result.error || 'Unknown error'));
        }
    };

    const handleProceed = async () => {
        if (!items || items.length === 0) {
            Alert.alert('Error', 'Please add at least one item before saving.');
            return;
        }

        const kotData = {
            items: items.map((item) => ({
                menucode: item.menucode,
                qty: item.qty,
                price: item.price,
                baryn: item.baryn || 'N',
                pegdtl: item.pegdtl || '',
                infoforkot: item.infoforkot || '',
            })),
            pax: parseInt(quantity) || 1,
            tableCode: table?.tableCode || '',
            waiterCode: '0000000001',
            guestCode: table?.guestCode || '',
            guestMobile: table?.guestMobile || '',
            posCd: posCd,
        };

        console.log('[KotPopup] handleProceed kotData:', kotData);

        setIsSaving(true);
        try {
            const result = await onProceed(kotData);
            if (!result || result.success !== false) {
                setItems([]);
                setQuantity('1');
                setSelectedMenuItem(null);
                setSelectedPeg(null);
                setSearchText('');
                setExpandedNoteId(null);
            }
        } catch (error) {
            console.error('[KotPopup] Save failed, keeping draft items:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleBillSaved = () => {
        setShowBillPopup(false);
        setItems([]);
        setSelectedMenuItem(null);
        setSelectedPeg(null);
        setSearchText('');
        setExpandedNoteId(null);
        if (onBillSaved) {
            onBillSaved();
        } else {
            onClose();
        }
    };

    const renderPegSelector = () => {
        if (!currentIsLiquor || currentPegOptions.length === 0) return null;

        return (
            <View className="flex-row flex-wrap gap-2 px-3.5 pt-2">
                {currentPegOptions.map((peg) => {
                    const active = selectedPeg?.key === peg.key;
                    return (
                        <Pressable
                            key={peg.key}
                            onPress={() => setSelectedPeg(peg)}
                            className={`flex-row items-center border rounded-md py-2 px-2 gap-1.5 bg-white min-w-[47%] flex-grow ${active ? 'border-[#2c3e50] bg-[#eef1f3]' : 'border-[#ddd]'}`}
                        >
                            <View className={`w-3.5 h-3.5 rounded-full border-[1.5px] items-center justify-center ${active ? 'border-[#2c3e50]' : 'border-[#999]'}`}>
                                {active && <View className="w-1.5 h-1.5 rounded-full bg-[#2c3e50]" />}
                            </View>
                            <Text className={`flex-1 text-xs font-semibold ${active ? 'text-[#2c3e50]' : 'text-[#555]'}`}>
                                {peg.label}
                            </Text>
                            <Text className={`text-[11.5px] ${active ? 'text-[#2c3e50]' : 'text-[#888]'}`}>
                                ₹{peg.rate}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
        );
    };

    const renderItemRow = (item) => {
        const noteOpen = expandedNoteId === item.id;
        return (
            <View key={item.id} className="border border-[#eee] rounded-lg mb-2 bg-[#fafbfb] overflow-hidden">
                <View className="flex-row items-center py-2.5 px-2.5 gap-2">
                    <View className="flex-1">
                        <Text className="text-[13.5px] text-[#2c3e50] font-semibold" numberOfLines={1}>{item.name}</Text>
                        <Text className="text-[11.5px] text-[#888] mt-0.5">
                            {item.pegLabel ? `${item.pegLabel} • ` : ''}₹{item.price} × {item.qty}
                        </Text>
                    </View>
                    <Text className="text-[13.5px] font-bold text-[#2c3e50] mr-1">₹{item.total}</Text>
                    <Pressable className="p-1.5" onPress={() => setExpandedNoteId(noteOpen ? null : item.id)}>
                        <MessageSquare size={16} color={item.infoforkot ? '#2c3e50' : '#aaa'} strokeWidth={2} />
                    </Pressable>
                    <Pressable className="p-1.5" onPress={() => handleRemoveItem(item.id)}>
                        <Trash2 size={16} color="#e74c3c" strokeWidth={2} />
                    </Pressable>
                </View>

                {noteOpen && (
                    <TextInput
                        placeholder="Note for this item (e.g. less spicy)..."
                        placeholderTextColor="#999"
                        value={item.infoforkot}
                        onChangeText={(text) => handleItemNoteChange(item.id, text)}
                        className="mx-2.5 mb-2.5 border border-[#e0e0e0] rounded-md px-2.5 py-2 text-[12.5px] text-[#333] bg-white"
                    />
                )}
            </View>
        );
    };

    const totalAmount = items.reduce((sum, i) => sum + i.total, 0);

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View className="flex-1 bg-black/60 justify-center items-center">
                {/* ✅ Adaptive Height: 85% of device height */}
                <View
                    className="w-[95%] bg-white rounded-xl overflow-hidden"
                    style={{ height: SCREEN_HEIGHT * 0.88 }}
                >
                    {/* Header */}
                    <View className="flex-row justify-between items-center bg-[#2c3e50] px-3.5 py-3">
                        <View className="flex-row items-center gap-2">
                            <FileText size={16} color="#FFFFFF" strokeWidth={2.5} />
                            <Text className="text-[15px] font-bold text-white">New KOT</Text>
                        </View>
                        <Pressable onPress={onClose} className="p-1">
                            <X size={22} color="#FFFFFF" strokeWidth={2.5} />
                        </Pressable>
                    </View>

                    {/* Compact top bar — table / waiter / guest, clearly labeled */}
                    <View className="flex-row items-center px-3.5 py-2.5 bg-[#f4f6f7] border-b border-[#eee] gap-2.5">
                        <View className="flex-row items-center gap-1.5 bg-[#e3e9ec] rounded-full px-3 py-1.5">
                            <LayoutGrid size={13} color="#2c3e50" strokeWidth={2.3} />
                            <Text className="text-[12.5px] font-bold text-[#2c3e50]">
                                Table {table?.tableNo || '-'}
                            </Text>
                        </View>

                        <View className="w-px h-5 bg-[#d5dade]" />

                        <View className="flex-row items-center gap-1.5 flex-1">
                            <Users size={14} color="#7f8c8d" strokeWidth={2} />
                            <View>
                                <Text className="text-[9px] font-semibold text-[#95a5a6] tracking-wide">GUEST</Text>
                                <Text className="text-[12.5px] font-semibold text-[#2c3e50]" numberOfLines={1}>
                                    {table?.guestName || 'Walk-in'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Search + add controls */}
                    <View className="flex-row items-center px-3.5 pt-2.5 gap-2 z-20">
                        <Pressable
                            onPress={() => setShowDropdown((prev) => !prev)}
                            className="flex-1 flex-row items-center border border-[#ddd] rounded-md px-2.5 h-12 gap-2 bg-white"
                        >
                            <Search size={15} color="#888888" strokeWidth={2} />
                            <TextInput
                                placeholder="Search item to add..."
                                className="flex-1 text-[13px] text-[#333]"
                                placeholderTextColor="#999"
                                value={searchText}
                                onFocus={() => setShowDropdown(true)}
                                onChangeText={(text) => {
                                    setSearchText(text);
                                    setSelectedMenuItem(null);
                                    setSelectedPeg(null);
                                    setShowDropdown(true);
                                }}
                            />
                            <ChevronDown size={15} color="#888888" strokeWidth={2} />
                        </Pressable>

                        <View className="w-14 h-10 border border-[#ddd] rounded-md flex-row items-center justify-center gap-1 bg-white">
                            <Text className="text-[13px] text-[#888] font-semibold">#</Text>
                            <TextInput
                                value={quantity}
                                onChangeText={setQuantity}
                                className="w-6 text-[13.5px] text-[#333] text-center p-0"
                                keyboardType="numeric"
                            />
                        </View>

                        <Pressable
                            onPress={handleAddItem}
                            disabled={!selectedMenuItem}
                            className={`w-10 h-10 rounded-md items-center justify-center ${!selectedMenuItem ? 'bg-[#a5adb5]' : 'bg-[#2c3e50]'}`}
                        >
                            <Plus size={18} color="#FFFFFF" strokeWidth={3} />
                        </Pressable>
                    </View>

                    {/* Dropdown */}
                    {showDropdown && (
                        <View className="absolute top-[182px] left-3.5 right-3.5 max-h-[220px] border border-[#ddd] rounded-md bg-white shadow-lg z-50 elevation-10">
                            {safeMenuItems.length === 0 ? (
                                <Text className="p-3 text-[13px] text-[#999] text-center">Loading menu...</Text>
                            ) : filteredMenuItems.length === 0 ? (
                                <Text className="p-3 text-[13px] text-[#999] text-center">No matching items</Text>
                            ) : (
                                <ScrollView
                                    className="max-h-[220px]"
                                    contentContainerStyle={{ paddingBottom: 10 }}
                                    nestedScrollEnabled={true}
                                    keyboardShouldPersistTaps="always"
                                    showsVerticalScrollIndicator={true}
                                >
                                    {filteredMenuItems.map((item, index) => (
                                        <Pressable
                                            key={item.posmenucd ?? index}
                                            className="flex-row justify-between items-center py-2 px-3 border-b border-[#f5f5f5]"
                                            onPress={() => handlePickMenuItem(item)}
                                        >
                                            <Text className="text-[13px] text-[#333] flex-1 mr-2" numberOfLines={1}>
                                                {item.menuname}
                                            </Text>
                                            <Text className="text-[13px] text-[#2c3e50] font-semibold">
                                                ₹{getDisplayRate(item)}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </ScrollView>
                            )}
                        </View>
                    )}

                    {renderPegSelector()}

                    {/* Items list header */}
                    <View className="flex-row justify-between items-center px-3.5 pt-3 pb-1.5">
                        <Text className="text-[12px] font-bold text-[#555] tracking-wider uppercase">
                            Order items ({items.length})
                        </Text>
                        {items.length > 0 && (
                            <Text className="text-[13px] font-bold text-[#2c3e50]">
                                Total: ₹{totalAmount}
                            </Text>
                        )}
                    </View>

                    {/* Items list */}
                    <ScrollView
                        className="flex-1 px-3.5"
                        contentContainerStyle={{ paddingBottom: 8 }}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {items.length > 0 ? (
                            items.map(renderItemRow)
                        ) : (
                            <View className="items-center justify-center py-16 gap-1.5">
                                <FileText size={28} color="#ccc" strokeWidth={1.5} />
                                <Text className="text-[14px] text-[#999] font-semibold">No items added yet</Text>
                                <Text className="text-[12px] text-[#bbb]">Search above to add items</Text>
                            </View>
                        )}
                    </ScrollView>

                    {/* Footer — More Options + Save KOT */}
                    <View className="flex-row px-2.5 py-2.5 border-t border-[#eee] bg-[#fafafa] gap-2">
                        {/* More Options Button (Dropdown) */}
                        <Pressable
                            onPress={() => setShowOptions(!showOptions)}
                            className="w-12 h-10 rounded-md border border-[#3498db] bg-white items-center justify-center"
                        >
                            <Text className="text-[#3498db] font-bold text-lg">⋮</Text>
                        </Pressable>

                        {/* Save KOT — हमेशा visible */}
                        <Pressable
                            onPress={handleProceed}
                            disabled={isSaving || items.length === 0}
                            className={`flex-1 py-2 rounded-md flex-row items-center justify-center gap-1 ${items.length === 0 || isSaving
                                ? 'bg-[#a5adb5] border-[#a5adb5] opacity-70'
                                : 'bg-[#2c3e50] border-[#2c3e50]'
                                }`}
                        >
                            {isSaving ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Save size={13} color="#FFFFFF" strokeWidth={2.5} />
                            )}
                            <Text className="text-[11.5px] font-semibold text-white">
                                {isSaving ? 'Saving' : 'Save KOT'}
                            </Text>
                        </Pressable>

                        {/* ड्रॉपडाउन में बाकी सारे बटन */}
                        {showOptions && (
                            <View className="absolute bottom-14 left-2 bg-white border border-[#eee] rounded-md shadow-lg p-2 z-50 elevation-10 gap-1.5 min-w-[140px]">
                                {/* Transfer */}
                                <Pressable
                                    className="flex-row items-center gap-2 py-2 px-3 rounded hover:bg-gray-100"
                                    onPress={() => setShowTransferPopup(true)}
                                >
                                    <ArrowLeftRight size={14} color="#3498db" strokeWidth={2.5} />
                                    <Text className="text-[13px] font-medium text-[#2c3e50]">Transfer</Text>
                                </Pressable>

                                {/* Items */}
                                <Pressable
                                    className="flex-row items-center gap-2 py-2 px-3 rounded hover:bg-gray-100"
                                    onPress={handleCurrentItems}
                                >
                                    <Eye size={14} color="#3498db" strokeWidth={2.5} />
                                    <Text className="text-[13px] font-medium text-[#2c3e50]">Items</Text>
                                </Pressable>

                                {/* Bill */}
                                <Pressable
                                    className="flex-row items-center gap-2 py-2 px-3 rounded hover:bg-gray-100"
                                    onPress={() => setShowBillPopup(true)}
                                >
                                    <Receipt size={14} color="#27ae60" strokeWidth={2.5} />
                                    <Text className="text-[13px] font-medium text-[#2c3e50]">Bill</Text>
                                </Pressable>

                                {/* KOT List (New Button) */}
                                <Pressable
                                    className="flex-row items-center gap-2 py-2 px-3 rounded hover:bg-gray-100"
                                    onPress={() => {
                                        setShowOptions(false);
                                        setShowKOTListPopup(true);
                                    }}
                                >
                                    <FileText size={14} color="#2c3e50" strokeWidth={2.5} />
                                    <Text className="text-[13px] font-medium text-[#2c3e50]">KOT List</Text>
                                </Pressable>
                            </View>
                        )}
                    </View>
                </View>
            </View>

            <TableTransferPopup
                visible={showTransferPopup}
                onClose={() => setShowTransferPopup(false)}
                currentTable={table?.tableNo}
                tables={tables}
                onTransferComplete={() => {
                    setShowTransferPopup(false);
                    onClose();
                }}
            />
            <CurrentItemsPopup
                visible={showCurrentItemsPopup}
                onClose={() => setShowCurrentItemsPopup(false)}
                table={table}
                items={currentItemsData}
                waiterName={waiterName}
            />

            <GenerateBillPopup
                visible={showBillPopup}
                onClose={() => setShowBillPopup(false)}
                onBillSaved={handleBillSaved}
                table={table}
                waiterName={waiterName}
            />

            <KOTListPopup
                visible={showKOTListPopup}
                onClose={() => setShowKOTListPopup(false)}
                table={table}
                tables={tables}
                posCd={posCd}
                waiterCode={userCd || waiterName}
                restaurantName={restaurantName}
                onPrintKOT={(printData) => {
                    console.log('[KotPopup] Print bridge called with:', printData);
                }}
            />
        </Modal>
    );
}