import {ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TouchableOpacity, View} from 'react-native'
import {useState} from 'react'
import {Link} from "expo-router";
import {useSignIn} from "@clerk/expo";
import {SafeAreaView as RNSafeAreaView} from "react-native-safe-area-context";
import {styled} from "nativewind";
import clsx from "clsx";
import AuthField from "@/components/AuthField";
import {BRAND} from "@/constants/data";
import {colors} from "@/constants/theme";
import {isValidEmail} from "@/lib/utils";

const SafeAreaView = styled(RNSafeAreaView);

interface SignInFormErrors {
    email?: string;
    password?: string;
}

const SignIn = () => {
    const {signIn, errors, fetchStatus} = useSignIn();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [formErrors, setFormErrors] = useState<SignInFormErrors>({});
    const [notice, setNotice] = useState('');

    const isSubmitting = fetchStatus === 'fetching';
    const emailError = formErrors.email || errors.fields.identifier?.message;
    const passwordError = formErrors.password || errors.fields.password?.message;
    const bannerError = notice || errors.global?.[0]?.message;

    const handleSignIn = async () => {
        setNotice('');

        const nextErrors: SignInFormErrors = {};
        if (!email.trim()) nextErrors.email = 'Email is required';
        else if (!isValidEmail(email)) nextErrors.email = 'Enter a valid email address';
        if (!password) nextErrors.password = 'Password is required';

        setFormErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;

        const {error} = await signIn.password({identifier: email.trim(), password});
        if (error) return;

        if (signIn.status === 'complete') {
            await signIn.finalize();
            return;
        }

        setNotice("This account needs additional verification that isn't supported here yet.");
    };

    return (
        <SafeAreaView className="auth-safe-area" edges={['top', 'bottom']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                className="auth-screen"
            >
                <ScrollView
                    className="auth-scroll"
                    contentContainerClassName="auth-content"
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View className="auth-brand-block">
                        <View className="auth-logo-wrap">
                            <View className="auth-logo-mark">
                                <Text className="auth-logo-mark-text">{BRAND.initial}</Text>
                            </View>
                            <View>
                                <Text className="auth-wordmark">{BRAND.name}</Text>
                                <Text className="auth-wordmark-sub">{BRAND.tagline}</Text>
                            </View>
                        </View>
                        <Text className="auth-title">Welcome back</Text>
                        <Text className="auth-subtitle">Sign in to continue managing your subscriptions</Text>
                    </View>

                    <View className="auth-card">
                        <View className="auth-form">
                            {bannerError ? <Text className="auth-banner-error">{bannerError}</Text> : null}

                            <AuthField
                                label="Email"
                                placeholder="Enter your email"
                                value={email}
                                onChangeText={(value) => {
                                    setEmail(value);
                                    if (formErrors.email) setFormErrors((prev) => ({...prev, email: undefined}));
                                }}
                                error={emailError}
                                autoCapitalize="none"
                                autoCorrect={false}
                                autoComplete="email"
                                textContentType="emailAddress"
                                keyboardType="email-address"
                                editable={!isSubmitting}
                            />

                            <AuthField
                                label="Password"
                                placeholder="Enter your password"
                                value={password}
                                onChangeText={(value) => {
                                    setPassword(value);
                                    if (formErrors.password) setFormErrors((prev) => ({...prev, password: undefined}));
                                }}
                                error={passwordError}
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                                autoCorrect={false}
                                autoComplete="current-password"
                                textContentType="password"
                                editable={!isSubmitting}
                                rightAdornment={
                                    <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)} hitSlop={8}>
                                        <Text className="auth-input-toggle-text">{showPassword ? 'Hide' : 'Show'}</Text>
                                    </TouchableOpacity>
                                }
                            />

                            <Pressable
                                className={clsx('auth-button', isSubmitting && 'auth-button-disabled')}
                                onPress={handleSignIn}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <ActivityIndicator color={colors.primary}/>
                                ) : (
                                    <Text className="auth-button-text">Sign in</Text>
                                )}
                            </Pressable>
                        </View>

                        <View className="auth-link-row">
                            <Text className="auth-link-copy">Don't have an account?</Text>
                            <Link href="/(auth)/sign-up">
                                <Text className="auth-link">Create Account</Text>
                            </Link>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}
export default SignIn
