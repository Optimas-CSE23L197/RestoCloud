// app/(tabs)/Dashboard.jsx
import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { FlatList, View, Alert, RefreshControl } from 'react-native';

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

const MAX_SILENT_RETRIES = 2;
const RETRY_DELAY_MS = 1200;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
    const [showKOTListPopup, setShowKOTListPopup] = useState(false)

    const { selectedRestaurant } = useAuth();
    const posCd = selectedRestaurant?.posmenucd || selectedRestaurant?.rcode || '';
    const userCd = selectedRestaurant?.usercd || '0000000001';
    const hotelGroupCode = selectedRestaurant?.hotelgrpcd || '';

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

    const showRetryAlert = useCallback(() => {
        Alert.alert(
            'Connection Problem',
            "We couldn't load the tables. Please check your internet connection and try again.",
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Retry', onPress: () => refreshTables() },
            ],
            { cancelable: false }
        );
    }, []);

    const refreshTables = useCallback(async (options = {}) => {
        const { silentOnFailure = false } = options;

        if (!posCd || !userCd) {
            console.warn('posCd or userCd missing, skipping table fetch');
            return;
        }

        setIsRefreshingTables(true);

        let lastError = null;

        for (let attempt = 0; attempt <= MAX_SILENT_RETRIES; attempt++) {
            try {
                const result = await getDashboardTables(posCd, userCd);

                if (result.success && Array.isArray(result.data)) {
                    setTables(result.data);
                    setIsRefreshingTables(false);
                    return;
                } else if (result.success && typeof result.data === 'string') {
                    console.warn('API returned string instead of array:', result.data);
                    lastError = new Error('Malformed response from server');
                } else {
                    console.error('Failed to fetch tables:', result.error || 'Unknown error');
                    lastError = new Error(result.error || 'Unknown error');
                }
            } catch (err) {
                console.error('[refreshTables] CAUGHT EXCEPTION:', err);
                lastError = err;
            }

            if (attempt < MAX_SILENT_RETRIES) {
                await wait(RETRY_DELAY_MS);
            }
        }

        setIsRefreshingTables(false);
        if (!silentOnFailure) {
            showRetryAlert();
        }
    }, [posCd, userCd, showRetryAlert]);

    useEffect(() => {
        refreshTables();
    }, [refreshTables]);

    const refreshUntilTableChanges = useCallback(async (tableCode, previousStatus, maxAttempts = 4, delayMs = 500) => {
        if (!posCd || !userCd || !tableCode) {
            refreshTables();
            return;
        }

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            await wait(delayMs);
            try {
                const result = await getDashboardTables(posCd, userCd);
                if (result.success && Array.isArray(result.data)) {
                    setTables(result.data);
                    const updated = result.data.find((t) => t.tablecd === tableCode);
                    if (updated && updated.status !== previousStatus) {
                        return;
                    }
                }
            } catch (err) {
                console.error('[refreshUntilTableChanges] attempt failed:', err);
            }
        }
    }, [posCd, userCd]);

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
                foodbillno: table.foodbillno?.trim() || null,
                bbillcd: table.bbillcd?.trim() || null,
                liqbillno: table.liqbillno?.trim() || null,
            };
        });
    }, [tables]);

    const counts = useMemo(() => {
        const total = mappedTables.length;
        const occupied = mappedTables.filter((t) => t.status === TABLE_STATUS.OCCUPIED).length;
        const billed = mappedTables.filter((t) => t.status === TABLE_STATUS.BILLED).length;
        const vacant = mappedTables.filter((t) => t.status === TABLE_STATUS.VACANT).length;
        const reserved = mappedTables.filter((t) => t.status === TABLE_STATUS.RESERVED).length;
        return { total, occupied, available: vacant, reserved, billed };
    }, [mappedTables]);

    const filteredTables = useMemo(() => {
        if (activeFilter === 'all') return mappedTables;
        return mappedTables.filter((t) => t.status === activeFilter);
    }, [activeFilter, mappedTables]);

    const handleTablePress = (table) => {
        setSelectedTable(table);

        if (table.status === TABLE_STATUS.OCCUPIED) {
            setShowKotPopup(true);
        } else if (table.status === TABLE_STATUS.BILLED) {
            const hasFoodBill = table.fbillcd && table.fbillcd.trim() !== '';
            const hasBarBill = table.bbillcd && table.bbillcd.trim() !== '';
            if (!hasFoodBill && !hasBarBill) {
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
        setShowKotPopup(false);
        setSelectedTable(null);
        refreshTables();
    };

    const handleKotBillSaved = () => {
        const tableCode = selectedTable?.tableCode;
        const previousStatus = selectedTable?.status === TABLE_STATUS.OCCUPIED ? 'Occupied' : selectedTable?.status;

        setShowKotPopup(false);
        setSelectedTable(null);

        if (tableCode) {
            refreshUntilTableChanges(tableCode, previousStatus);
        } else {
            refreshTables();
        }
    };

    const handleCloseBillPopup = () => {
        setShowBillPopup(false);
        setSelectedTable(null);
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
        setShowGuestPopup(false);

        setSelectedTable((prev) => ({
            ...prev,
            guestCode: guestData.guestCode || prev?.guestCode,
            guestName: guestData.name,
            guestMobile: guestData.mobile || prev?.guestMobile,
            pax: Number(guestData.pax) || prev?.pax || 1,
        }));

        await refreshTables();
        setShowKotPopup(true);
    };

    const handleSaveKOT = async (kotData) => {
        try {
            if (!kotData?.items || kotData.items.length === 0) {
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

            const result = await saveKOT(payload);

            if (result.success) {
                await refreshTables();
                handleCloseKotPopup();
                setShowKOTListPopup(true);

                setTimeout(() => {
                    Alert.alert('Success', 'KOT Saved Successfully!');
                }, 300);
            } else {
                console.error('[handleSaveKOT] FAILURE - saveKOT returned success:false:', result.error);
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
                        colors={['#2c3e50']}
                        tintColor="#2c3e50"
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