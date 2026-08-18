import { useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';

import DashboardHeader from './DashboardHeader';
import StatBar from './StatBar';
import TableCard from './TableCard';
import { TABLE_STATUS } from '../constants/tableStatus';

const MOCK_TABLES = [
    {
        id: 'T-01',
        tableNo: 'T-01',
        status: TABLE_STATUS.OCCUPIED,
        guests: 4,
        amount: 1420,
    },
    {
        id: 'T-02',
        tableNo: 'T-02',
        status: TABLE_STATUS.BILLED,
        billStatus: 'Printed',
        amount: 890,
    },
    {
        id: 'T-03',
        tableNo: 'T-03',
        status: TABLE_STATUS.RESERVED,
        reservedTime: '8:00 PM',
        reservedBy: 'Rahul Sharma',
    },
    {
        id: 'T-04',
        tableNo: 'T-04',
        status: TABLE_STATUS.VACANT,
        pax: 6,
    },
    {
        id: 'T-05',
        tableNo: 'T-05',
        status: TABLE_STATUS.VACANT,
        pax: 6,
    },
    {
        id: 'T-06',
        tableNo: 'T-06',
        status: TABLE_STATUS.VACANT,
        pax: 6,
    },
    {
        id: 'T-07',
        tableNo: 'T-07',
        status: TABLE_STATUS.VACANT,
        pax: 6,
    },
    {
        id: 'T-08',
        tableNo: 'T-08',
        status: TABLE_STATUS.VACANT,
        pax: 6,
    },
    {
        id: 'T-09',
        tableNo: 'T-09',
        status: TABLE_STATUS.VACANT,
        pax: 6,
    },
    {
        id: 'T-10',
        tableNo: 'T-10',
        status: TABLE_STATUS.VACANT,
        pax: 6,
    },
];

const EDGE_PADDING = 16;

export default function CaptainDashboardScreen() {
    const [activeFilter, setActiveFilter] = useState('all');

    const counts = useMemo(
        () => ({
            total: MOCK_TABLES.length,

            occupied: MOCK_TABLES.filter(
                (table) => table.status === TABLE_STATUS.OCCUPIED
            ).length,

            available: MOCK_TABLES.filter(
                (table) => table.status === TABLE_STATUS.VACANT
            ).length,

            reserved: MOCK_TABLES.filter(
                (table) => table.status === TABLE_STATUS.RESERVED
            ).length,

            billed: MOCK_TABLES.filter(
                (table) => table.status === TABLE_STATUS.BILLED
            ).length,
        }),
        []
    );

    const filteredTables = useMemo(() => {
        if (activeFilter === 'all') {
            return MOCK_TABLES;
        }

        return MOCK_TABLES.filter(
            (table) => table.status === activeFilter
        );
    }, [activeFilter]);

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header */}
            <DashboardHeader
                onReserveTable={() =>
                    console.log('Reserve table tapped')
                }
            />

            <FlatList
                style={{ flex: 1 }}
                data={filteredTables}
                keyExtractor={(item) => item.id}
                numColumns={2}
                showsVerticalScrollIndicator={false}

                /* Horizontal stat filter */
                ListHeaderComponent={
                    <View
                        style={{
                            paddingTop: 8,
                            paddingBottom: 8,
                            paddingLeft: 4
                        }}
                    >
                        <StatBar
                            counts={counts}
                            activeFilter={activeFilter}
                            onFilterChange={setActiveFilter}
                        />
                    </View>
                }

                /* Table grid spacing */
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
                            onPress={() =>
                                console.log(
                                    'Pressed',
                                    item.tableNo
                                )
                            }
                        />
                    </View>
                )}
            />
        </View>
    );
}