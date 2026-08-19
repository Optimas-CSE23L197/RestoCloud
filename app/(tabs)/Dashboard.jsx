// app/(tabs)/Dashboard.jsx
import { useMemo, useState, useEffect, useCallback } from 'react';
import { FlatList, View, Alert, RefreshControl } from 'react-native'; // ✅ RefreshControl import kiya

// Relative path se import karo
import DashboardHeader from '../../src/components/DashboardHeader';
import StatBar from '../../src/components/StatBar';
import TableCard from '../../src/components/TableCard';
import { TABLE_STATUS } from '../../src/constants/tableStatus';
import GuestDetailPopup from '../../src/components/popup/GuestDetailPopup';
import KotPopup from '../../src/components/popup/KotPopup';
import SettleBillPopup from '../../src/components/popup/SettleBillPopup';
import ReservationPopup from '../../src/components/popup/ReservationPopup';
import ArrivalConfirmationPopup from '../../src/components/popup/ArrivalConfirmationPopup';

import { getMenuWithRate, saveKOT, getDashboardTables, updateTableStatus } from '../../api/system.api';
import { useAuth } from '../../src/context/AuthContext';

const EDGE_PADDING = 16;

export default function Dashboard() {
    const [activeFilter, setActiveFilter] = useState('all');

    const [showGuestPopup, setShowGuestPopup] = useState(false);
    const [showKotPopup, setShowKotPopup] = useState(false);
    const [showBillPopup, setShowBillPopup] = useState(false);
    const [showReservationPopup, setShowReservationPopup] = useState(false);
    const [showArrivalPopup, setShowArrivalPopup] = useState(false);
    const [selectedTable, setSelectedTable] = useState(null);
    const [menuItems, setMenuItems] = useState([]);
    const [tables, setTables] = useState([]);
    const [isRefreshingTables, setIsRefreshingTables] = useState(false)

    const { selectedRestaurant } = useAuth();
    const posCd = selectedRestaurant?.posmenucd || selectedRestaurant?.rcode || '';
    const userCd = selectedRestaurant?.usercd || '0000000001';
    const hotelGroupCode = selectedRestaurant?.hotelgrpcd || '';

    // Fetch Menu
    useEffect(() => {
        const fetchMenu = async () => {
            if (!posCd) return;
            const result = await getMenuWithRate(posCd);
            if (result.success) {
                setMenuItems(result.data);
            } else {
                console.error('Failed to fetch menu:', result.error);
            }
        };
        fetchMenu();
    }, [posCd]);

    const refreshTables = useCallback(async () => {
        console.log('[refreshTables] ENTRY, posCd:', posCd, 'userCd:', userCd);

        if (!posCd || !userCd) {
            console.warn('posCd or userCd missing, skipping table fetch');
            return;
        }

        setIsRefreshingTables(true);
        try {
            console.log('[refreshTables] calling getDashboardTables...');
            const result = await getDashboardTables(posCd, userCd);
            console.log('[refreshTables] getDashboardTables returned, success:', result?.success);

            if (result.success && Array.isArray(result.data)) {
                // ✅ Force update state with new data
                setTables(result.data);
                console.log('[refreshTables] setTables done, count:', result.data.length);

                // Log all tables for debugging
                result.data.forEach((t) => {
                    console.log(`[refreshTables] Table ${t.tableno} (${t.tablecd}) status: ${t.status}`);
                });

            } else if (result.success && typeof result.data === 'string') {
                console.warn('API returned string instead of array:', result.data);
                setTables([]);
            } else {
                console.error('Failed to fetch tables:', result.error || 'Unknown error');
            }
        } catch (err) {
            console.error('[refreshTables] CAUGHT EXCEPTION:', err);
        } finally {
            setIsRefreshingTables(false);
            console.log('[refreshTables] EXIT (finally ran)');
        }
    }, [posCd, userCd]);

    useEffect(() => {
        refreshTables();
    }, [refreshTables]);


    // Map API data to TableCard props
    const mappedTables = useMemo(() => {
        return tables.map((table) => {
            let status = TABLE_STATUS.VACANT;
            if (table.status === 'Occupied') status = TABLE_STATUS.OCCUPIED;
            else if (table.status === 'BILL DONE') status = TABLE_STATUS.BILLED;

            return {
                id: table.tablecd,
                tableNo: table.tableno,
                status: status,
                pax: parseInt(table.chairs) || 0,
                guests: table.guestnm ? 1 : 0,
                amount: parseFloat(table.kotamt) || 0,
                billStatus: table.status === 'BILL DONE' ? 'Printed' : null,
                reservedTime: null,
                reservedBy: null,
                tableCode: table.tablecd,
                waiterCode: table.waitercd,
                guestCode: table.guestcd,
                guestName: table.guestnm,
                fbillcd: table.fbillcd?.trim() || null,
            };
        });
    }, [tables]);

    // Counts
    const counts = useMemo(() => {
        const total = mappedTables.length;
        const occupied = mappedTables.filter((t) => t.status === TABLE_STATUS.OCCUPIED).length;
        const billed = mappedTables.filter((t) => t.status === TABLE_STATUS.BILLED).length;
        const vacant = mappedTables.filter((t) => t.status === TABLE_STATUS.VACANT).length;
        const reserved = mappedTables.filter((t) => t.status === TABLE_STATUS.RESERVED).length;
        return { total, occupied, available: vacant, reserved, billed };
    }, [mappedTables]);

    // Filter
    const filteredTables = useMemo(() => {
        if (activeFilter === 'all') return mappedTables;
        return mappedTables.filter((t) => t.status === activeFilter);
    }, [activeFilter, mappedTables]);


    const handleTablePress = (table) => {
        console.log('[handleTablePress] 📌 Table pressed:', table.tableNo, 'Status:', table.status);
        setSelectedTable(table);

        if (table.status === TABLE_STATUS.OCCUPIED) {
            setShowKotPopup(true);
        } else if (table.status === TABLE_STATUS.BILLED) {
            // Check if fbillcd exists
            if (!table.fbillcd || table.fbillcd === ' ' || table.fbillcd.trim() === '') {
                Alert.alert('Error', 'Bill ID not found for this table.');
                return;
            }
            setShowBillPopup(true);
        } else if (table.status === TABLE_STATUS.RESERVED) {
            setShowArrivalPopup(true);
        } else {
            setShowGuestPopup(true);
        }
    };

    const handleCloseGuestPopup = () => {
        setShowGuestPopup(false);
        setSelectedTable(null);
    };

    const handleCloseKotPopup = () => {
        console.log('[handleCloseKotPopup] called');
        setShowKotPopup(false);
        setSelectedTable(null);
        console.log('[handleCloseKotPopup] done');
    };

    // ✅ Fires when GenerateBillPopup (opened from inside KotPopup) actually
    // saves a bill — table flips Occupied → Billed on the server. Closes
    // KotPopup and refreshes the table grid so the card shows the new status,
    // same as handleCloseBillPopup does for the SettleBillPopup flow.
    const handleKotBillSaved = () => {
        console.log('[handleKotBillSaved] 🟢 bill saved from KotPopup - closing + refreshing tables');
        setShowKotPopup(false);
        setSelectedTable(null);
        refreshTables();
    };

    const handleCloseBillPopup = () => {
        console.log('[handleCloseBillPopup] 🟢 called - closing bill popup');
        setShowBillPopup(false);
        setSelectedTable(null);

        // Refresh tables immediately after bill settlement
        console.log('[handleCloseBillPopup] 🔄 refreshing tables...');
        refreshTables();
    };

    const handleCloseReservationPopup = () => {
        setShowReservationPopup(false);
        setSelectedTable(null);
    };

    const handleCloseArrivalPopup = () => {
        setShowArrivalPopup(false);
        setSelectedTable(null);
    };

    const handleProceedToKOT = async (guestData) => {
        console.log('[handleProceedToKOT] 🟢 Guest data received:', guestData);

        setShowGuestPopup(false);

        // Step 1: Update selectedTable with guest data (frontend state)
        setSelectedTable((prev) => ({
            ...prev,
            guestCode: guestData.guestCode || prev?.guestCode,
            guestName: guestData.name,
            guestMobile: guestData.mobile || prev?.guestMobile,
            pax: parseInt(guestData.pax) || prev?.pax,
        }));

        // Step 2: Refresh tables (GETGUESTDET API ne backend pe status auto update kar diya, ab sirf fetch karo)
        console.log('[handleProceedToKOT] 🔄 Refreshing tables to fetch updated status...');
        await refreshTables();

        // Step 3: Now open KOT popup
        console.log('[handleProceedToKOT] 🟢 Opening KotPopup...');
        setShowKotPopup(true);
    };

    const handleSaveKOT = async (kotData) => {
        console.log('[handleSaveKOT] ENTRY - function called with:', kotData);

        try {
            if (!kotData?.items || kotData.items.length === 0) {
                console.log('[handleSaveKOT] No items - showing alert and returning');
                Alert.alert('Error', 'No items to save. Please add items first.');
                return;
            }

            const payload = {
                poscd: kotData.posCd,
                tablcd: kotData.tableCode,
                pax: kotData.pax,
                waitercd: kotData.waiterCode,
                guestcd: kotData.guestCode || '',
                menudtl: kotData.items.map((item) => ({
                    menucode: item.menucode,
                    qty: item.qty,
                    rate: item.price,
                    baryn: item.baryn || 'N',
                    pegdtl: item.pegdtl || '',
                    infoforkot: item.infoforkot || '',
                })),
            };

            console.log('[handleSaveKOT] Calling saveKOT with payload:', payload);
            const result = await saveKOT(payload);
            console.log('[handleSaveKOT] saveKOT returned:', result);

            if (result.success) {
                console.log('[handleSaveKOT] SUCCESS branch entered');

                // ✅ Step 1: Pehle refreshTables call karo (API se latest data fetch karega)
                console.log('[handleSaveKOT] about to call refreshTables');
                await refreshTables();
                console.log('[handleSaveKOT] refreshTables awaited and returned');

                // ✅ Step 2: Fir popup close karo (taaki UI update ho chuka ho)
                console.log('[handleSaveKOT] about to call handleCloseKotPopup');
                handleCloseKotPopup();
                console.log('[handleSaveKOT] handleCloseKotPopup returned');

                // ✅ Step 3: Alert ko thoda delay de kar dikhao (taaki UI update ho jaye)
                setTimeout(() => {
                    Alert.alert('Success', 'KOT Saved Successfully!');
                }, 300);

            } else {
                console.error('[handleSaveKOT] FAILURE branch - saveKOT returned success:false:', result.error);
                Alert.alert('Error', 'Failed to save KOT. Please try again.');
            }
        } catch (error) {
            console.error('[handleSaveKOT] CATCH block - exception thrown:', error);
            Alert.alert('Error', 'Something went wrong.');
        }
    };

    const handleReservePress = () => {
        setShowReservationPopup(true);
    };

    const handleSaveReservation = () => {
        handleCloseReservationPopup();
        refreshTables();
    };

    const handleGuestArrived = async () => {
        if (selectedTable) {
            await updateTableStatus(selectedTable.tableCode, TABLE_STATUS.OCCUPIED, hotelGroupCode);
            await refreshTables();
        }
        handleCloseArrivalPopup();
    };

    return (
        <View className="flex-1 bg-gray-50">
            <DashboardHeader onReserveTable={handleReservePress} />

            <FlatList
                style={{ flex: 1 }}
                data={filteredTables}
                keyExtractor={(item) => item.id}
                numColumns={2}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshingTables}
                        onRefresh={refreshTables}
                        colors={['#2c3e50']} // Android spinner color
                        tintColor="#2c3e50"  // iOS spinner color
                    />
                }
                ListHeaderComponent={
                    <View style={{ paddingTop: 8, paddingBottom: 8, paddingLeft: 4 }}>
                        <StatBar
                            counts={counts}
                            activeFilter={activeFilter}
                            onFilterChange={setActiveFilter}
                        />
                    </View>
                }
                contentContainerStyle={{
                    paddingHorizontal: EDGE_PADDING,
                    paddingBottom: 32,
                }}
                columnWrapperStyle={{
                    justifyContent: 'space-between',
                    marginBottom: 14,
                }}
                renderItem={({ item }) => (
                    <View style={{ width: '48%' }}>
                        <TableCard
                            {...item}
                            onPress={() => handleTablePress(item)}
                        />
                    </View>
                )}
            />

            <GuestDetailPopup
                visible={showGuestPopup}
                onClose={handleCloseGuestPopup}
                table={selectedTable}
                onProceed={handleProceedToKOT}
            />

            <KotPopup
                visible={showKotPopup}
                onClose={handleCloseKotPopup}
                table={selectedTable}
                onProceed={handleSaveKOT}
                onBillSaved={handleKotBillSaved}
                menuItems={menuItems || []}
                posCd={posCd}
                tables={tables}
                waiterName={selectedRestaurant?.usernm || 'Captain1'}
            />

            <SettleBillPopup
                visible={showBillPopup}
                onClose={handleCloseBillPopup}
                table={selectedTable}
            />

            <ReservationPopup
                visible={showReservationPopup}
                onClose={handleCloseReservationPopup}
                onSave={handleSaveReservation}
                tables={mappedTables}
            />

            <ArrivalConfirmationPopup
                visible={showArrivalPopup}
                onClose={handleCloseArrivalPopup}
                table={selectedTable}
                onGuestArrived={handleGuestArrived}
            />
        </View>
    );
}