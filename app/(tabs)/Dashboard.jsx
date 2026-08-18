// app/(tabs)/Dashboard.jsx
import { useMemo, useState, useEffect } from 'react';
import { FlatList, View, Alert } from 'react-native';

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

import { getMenuWithRate, saveKOT, getDashboardTables, updateTableStatus } from '../../api/system.api'; import { useAuth } from '../../src/context/AuthContext';

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

    // 1. Real tables state
    const [tables, setTables] = useState([]);

    const { selectedRestaurant } = useAuth();
    const posCd = selectedRestaurant?.posmenucd || selectedRestaurant?.rcode;
    const userCd = selectedRestaurant?.usercd || '0000000001';

    // 2. Fetch Menu
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

    // 3. Fetch Real Tables from API
    useEffect(() => {
        const fetchTables = async () => {
            if (!posCd || !userCd) return;
            const result = await getDashboardTables(posCd, userCd);
            if (result.success && Array.isArray(result.data)) {
                setTables(result.data);
            } else {
                console.error('Failed to fetch tables:', result.error);
            }
        };
        fetchTables();
    }, [posCd, userCd]);

    // 4. Map API data to TableCard props
    const mappedTables = useMemo(() => {
        return tables.map((table) => {
            // Map API status to TABLE_STATUS constants
            let status = TABLE_STATUS.VACANT;
            if (table.status === 'Occupied') status = TABLE_STATUS.OCCUPIED;
            else if (table.status === 'BILL DONE') status = TABLE_STATUS.BILLED;
            // Add RESERVED logic if API supports it

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
            };
        });
    }, [tables]);

    const availableTables = useMemo(() => {
        return mappedTables.filter((t) => t.status === TABLE_STATUS.VACANT);
    }, [mappedTables]);

    // 5. Counts based on real mappedTables (NOT MOCK_TABLES)
    const counts = useMemo(() => {
        const total = mappedTables.length;
        const occupied = mappedTables.filter((t) => t.status === TABLE_STATUS.OCCUPIED).length;
        const billed = mappedTables.filter((t) => t.status === TABLE_STATUS.BILLED).length;
        const vacant = mappedTables.filter((t) => t.status === TABLE_STATUS.VACANT).length;
        const reserved = mappedTables.filter((t) => t.status === TABLE_STATUS.RESERVED).length;
        return { total, occupied, available: vacant, reserved, billed };
    }, [mappedTables]);

    // 6. Filter based on real mappedTables
    const filteredTables = useMemo(() => {
        if (activeFilter === 'all') return mappedTables;
        return mappedTables.filter((t) => t.status === activeFilter);
    }, [activeFilter, mappedTables]);

    // ================= HANDLERS =================

    const handleTablePress = (table) => {
        setSelectedTable(table);

        if (table.status === TABLE_STATUS.OCCUPIED) {
            setShowKotPopup(true);
        } else if (table.status === TABLE_STATUS.BILLED) {
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
    };

    const handleCloseBillPopup = () => {
        setShowBillPopup(false);
        setSelectedTable(null);
    };

    const handleCloseReservationPopup = () => {
        setShowReservationPopup(false);
        setSelectedTable(null);
    };

    const handleCloseArrivalPopup = () => {
        setShowArrivalPopup(false);
        setSelectedTable(null);
    };

    const handleProceedToKOT = () => {
        console.log('Proceeding to KOT for table:', selectedTable?.tableNo);
        handleCloseGuestPopup();
    };

    const handleSaveKOT = async (kotData) => {
        try {
            if (!kotData?.items || kotData.items.length === 0) {
                Alert.alert('Error', 'No items to save. Please add items first.');
                return;
            }

            const result = await saveKOT({
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
            });

            if (result.success) {
                console.log('KOT Saved Successfully!');
                handleCloseKotPopup();
            } else {
                console.error('Failed to save KOT:', result.error);
                Alert.alert('Error', 'Failed to save KOT. Please try again.');
            }
        } catch (error) {
            console.error('Error saving KOT:', error);
            Alert.alert('Error', 'Something went wrong.');
        }
    };

    const handleReservePress = () => {
        setShowReservationPopup(true);
    };

    const handleSaveReservation = () => {
        console.log('Reservation Saved successfully!');
        handleCloseReservationPopup();
    };

    const handleGuestArrived = async () => {
        console.log('Guest arrived for table:', selectedTable?.tableNo);

        // Call updateTableStatus API to change status to OCCUPIED
        if (selectedTable) {
            const result = await updateTableStatus(
                selectedTable.tableCode,
                TABLE_STATUS.OCCUPIED,
                selectedRestaurant?.hotelgrpcd || ''
            );
            if (result.success) {
                // Refresh tables list
                fetchTables();
            } else {
                Alert.alert('Error', 'Failed to update table status');
            }
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
                menuItems={menuItems}
                posCd={posCd}
                tables={mappedTables}
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
                tables={availableTables}
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