import {ActivityIndicator, Image, Pressable, Text, View} from 'react-native'
import {useState} from 'react'
import {SafeAreaView as RNSafeAreaView} from 'react-native-safe-area-context';
import {styled} from "nativewind";
import clsx from "clsx";
import {useAuth, useUser} from "@clerk/expo";
import images from "@/constants/images";
import {colors} from "@/constants/theme";
import {formatSubscriptionDateTime} from "@/lib/utils";
import {posthog} from "@/lib/posthog";

const SafeAreaView = styled(RNSafeAreaView);

const Settings = () => {
    const {user} = useUser();
    const {signOut} = useAuth();
    const [isSigningOut, setIsSigningOut] = useState(false);

    const displayName = user?.fullName || user?.primaryEmailAddress?.emailAddress || "";
    const email = user?.primaryEmailAddress?.emailAddress || "";
    const avatarSource = user?.imageUrl ? {uri: user.imageUrl} : images.avatar;

    const handleSignOut = async () => {
        setIsSigningOut(true);
        try {
            posthog?.capture('sign_out_requested');
            posthog?.reset();
            await signOut();
        } catch {
            setIsSigningOut(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-background p-5">
            <Text className="list-title mb-5">Settings</Text>

            <View className="sub-card bg-card">
                <View className="upcoming-row">
                    <Image source={avatarSource} className="home-avatar"/>
                    <View className="sub-copy">
                        <Text className="sub-title" numberOfLines={1}>{displayName}</Text>
                        {email && displayName !== email ? (
                            <Text className="sub-meta" numberOfLines={1}>{email}</Text>
                        ) : null}
                    </View>
                </View>
            </View>

            <View className="h-6"/>

            <Text className="settings-section-title">Account</Text>
            <View className="sub-card bg-card">
                <View className="sub-details">
                    <View className="sub-row">
                        <View className="gap-1">
                            <Text className="sub-label">Account ID</Text>
                            <Text className="settings-value" numberOfLines={1} ellipsizeMode="middle">
                                {user?.id ?? "Not available"}
                            </Text>
                        </View>
                    </View>
                    <View className="sub-row">
                        <View className="gap-1">
                            <Text className="sub-label">Joined</Text>
                            <Text className="settings-value" numberOfLines={1}>
                                {formatSubscriptionDateTime(user?.createdAt)}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            <View className="h-6"/>

            <Pressable
                className={clsx('sub-cancel', isSigningOut && 'sub-cancel-disabled')}
                onPress={handleSignOut}
                disabled={isSigningOut}
            >
                {isSigningOut ? (
                    <ActivityIndicator color={colors.background}/>
                ) : (
                    <Text className="sub-cancel-text">Sign out</Text>
                )}
            </Pressable>
        </SafeAreaView>
    )
}
export default Settings
