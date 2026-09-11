import "@/global.css"
import {Image, Text, View, FlatList, ScrollView} from "react-native";
import {SafeAreaView as RNSafeAreaView} from 'react-native-safe-area-context';
import {styled} from "nativewind";
import {useUser} from "@clerk/expo";
import images from "@/constants/images"
import {icons} from '@/constants/icons'
import {HOME_BALANCE, HOME_SUBSCRIPTIONS, UPCOMING_SUBSCRIPTIONS} from "@/constants/data";
import {formatCurrency} from "@/lib/utils";
import dayjs from "dayjs";
import ListHeadings from "@/components/ListHeadings";
import UpcomingSubscriptionCard from "@/components/UpcomingSubscriptionCard";
import SubscriptionCard from "@/components/SubscriptionCard";
import {useState} from "react";

const SafeAreaView = styled(RNSafeAreaView);
export default function App() {
    const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<string | null>(null);
    const {user} = useUser();
    const displayName = user?.fullName || user?.primaryEmailAddress?.emailAddress || "";
    const avatarSource = user?.imageUrl ? {uri: user.imageUrl} : images.avatar;
    return (
        <SafeAreaView className="flex-1 bg-background p-5">
                <FlatList
                    ListHeaderComponent={() => (
                        <>
                            <View className="home-header">
                                <View className="home-user">
                                    <Image source={avatarSource} className="home-avatar"/>
                                    <Text className="home-user-name">{displayName}</Text>
                                </View>
                                <Image source={icons.add} className="home-add-icon"/>
                            </View>

                            <View className="home-balance-card">
                                <Text className="home-balance-label">Balance</Text>
                                <View className="home-balance-row">
                                    <Text className="home-balance-amount">{formatCurrency(HOME_BALANCE.amount)}</Text>
                                    <Text className="home-balance-date">{dayjs(HOME_BALANCE.nextRenewalDate).format('MM/DD')}</Text>
                                </View>
                            </View>

                            <View className="mb-5">
                                <ListHeadings title="Upcoming"/>
                                <FlatList
                                    data={UPCOMING_SUBSCRIPTIONS}
                                    renderItem={({item}) => (
                                        <UpcomingSubscriptionCard {...item} />
                                    )}
                                    keyExtractor={(item) => item.id}
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    ListEmptyComponent={<Text className="home-empty-state"> No Upcoming Renewals Yet... </Text>}
                                />
                            </View>

                            <ListHeadings title="All Subscriptions"/>
                        </>
                    ) }
                    data={HOME_SUBSCRIPTIONS}
                    keyExtractor={(item) => item.id}
                    renderItem={({item}) => (
                        <SubscriptionCard {...item} expanded={expandedSubscriptionId === item.id}
                            onPress={() => setExpandedSubscriptionId((currentId) => (currentId === item.id ? null : item.id))}
                            />
                    )}
                    extraData={expandedSubscriptionId}
                    ItemSeparatorComponent={() => <View className="h-4"/>}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={<Text className="home-empty-state">No Subscriptions Yet ... </Text>}
                    contentContainerClassName="pb-20"
                />

        </SafeAreaView>
    );
}