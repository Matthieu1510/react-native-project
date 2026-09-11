import {ClerkProvider, useAuth} from "@clerk/expo";
import {tokenCache} from "@clerk/expo/token-cache";
import {SplashScreen, Stack} from "expo-router";
import '@/global.css';
import {useFonts} from "expo-font";
import {useEffect} from "react";

SplashScreen.preventAutoHideAsync();

if (!process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    throw new Error('Add your Clerk Publishable Key to the .env file');
}

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

const RootNavigator = () => {
    const {isLoaded, isSignedIn} = useAuth();
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
    return (
        <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
            <RootNavigator/>
        </ClerkProvider>
    );
}
