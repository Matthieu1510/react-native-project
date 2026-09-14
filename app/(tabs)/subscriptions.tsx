import {View, Text, TextInput, FlatList, KeyboardAvoidingView, Platform} from 'react-native'
import React, {useMemo, useState} from 'react'
import {SafeAreaView as RNSafeAreaView} from 'react-native-safe-area-context';
import {styled} from "nativewind";
import {colors} from "@/constants/theme";
import SubscriptionCard from "@/components/SubscriptionCard";
import {useSubscriptions} from "@/context/subscriptions-context";

const SafeAreaView = styled(RNSafeAreaView);

const Subscriptions = () => {
    const [query, setQuery] = useState('');
    const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<string | null>(null);
    const {subscriptions} = useSubscriptions();

    const filteredSubscriptions = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        if (!normalizedQuery) return subscriptions;

        return subscriptions.filter((subscription) =>
            [subscription.name, subscription.category, subscription.plan]
                .some((field) => field?.toLowerCase().includes(normalizedQuery))
        );
    }, [query, subscriptions]);

    return (
        <SafeAreaView className="flex-1 bg-background p-5">
            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
            >
                <Text className="screen-title">Subscriptions</Text>

                <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Search subscriptions"
                    placeholderTextColor={colors.mutedForeground}
                    className="search-input"
                    autoCorrect={false}
                    autoCapitalize="none"
                />

                <FlatList
                    data={filteredSubscriptions}
                    keyExtractor={(item) => item.id}
                    renderItem={({item}) => (
                        <SubscriptionCard {...item} expanded={expandedSubscriptionId === item.id}
                            onPress={() => {
                                setExpandedSubscriptionId(expandedSubscriptionId === item.id ? null : item.id);
                            }}
                        />
                    )}
                    extraData={expandedSubscriptionId}
                    ItemSeparatorComponent={() => <View className="h-4"/>}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={<Text className="home-empty-state">No Subscriptions Found</Text>}
                    contentContainerClassName="pb-20"
                />
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}
export default Subscriptions
