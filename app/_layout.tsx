import {ClerkProvider, useAuth, useUser} from "@clerk/expo";
import {tokenCache} from "@clerk/expo/token-cache";
import {SplashScreen, Stack} from "expo-router";
import '@/global.css';
import {useFonts} from "expo-font";
import {useEffect, useRef} from "react";
import {PostHogErrorBoundary, PostHogProvider} from "posthog-react-native";
import {posthog} from "@/lib/posthog";

SplashScreen.preventAutoHideAsync();

if (!process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    throw new Error('Add your Clerk Publishable Key to the .env file');
}

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

const RootNavigator = () => {
    const {isLoaded, isSignedIn} = useAuth();
    const {user} = useUser();
    const identifiedUserId = useRef<string | undefined>(undefined);
    const [fontsLoaded] = useFonts({
        'sans-regular': require('../assets/fonts/PlusJakartaSans-Regular.ttf'),
        'sans-bold': require('../assets/fonts/PlusJakartaSans-Bold.ttf'),
        'sans-medium': require('../assets/fonts/PlusJakartaSans-Medium.ttf'),
        'sans-light': require('../assets/fonts/PlusJakartaSans-Light.ttf'),
        'sans-semibold': require('../assets/fonts/PlusJakartaSans-SemiBold.ttf'),
        'sans-extrabold': require('../assets/fonts/PlusJakartaSans-ExtraBold.ttf'),
    })

    useEffect(() => {
        if (fontsLoaded && isLoaded) {
            SplashScreen.hideAsync()
        }
    }, [fontsLoaded, isLoaded])

    useEffect(() => {
        if (!isSignedIn || !user?.id) {
            identifiedUserId.current = undefined;
            return;
        }

        if (identifiedUserId.current === user.id) return;

        posthog?.identify(user.id, {
            $set: {
                ...(user.primaryEmailAddress?.emailAddress ? {email: user.primaryEmailAddress.emailAddress} : {}),
                ...(user.fullName ? {name: user.fullName} : {}),
            },
        });
        identifiedUserId.current = user.id;
    }, [isSignedIn, user?.fullName, user?.id, user?.primaryEmailAddress?.emailAddress]);

    if (!fontsLoaded || !isLoaded) return null;

    return (
        <Stack screenOptions={{headerShown: false}}>
            <Stack.Protected guard={!!isSignedIn}>
                <Stack.Screen name="(tabs)"/>
            </Stack.Protected>
            <Stack.Protected guard={!isSignedIn}>
                <Stack.Screen name="(auth)"/>
            </Stack.Protected>
        </Stack>
    );
}

export default function RootLayout() {
    const navigator = <RootNavigator/>;

    return (
        <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
            {posthog ? (
                <PostHogProvider client={posthog}>
                    <PostHogErrorBoundary>
                        {navigator}
                    </PostHogErrorBoundary>
                </PostHogProvider>
            ) : navigator}
        </ClerkProvider>
    );
}
