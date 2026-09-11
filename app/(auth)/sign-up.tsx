import {ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TouchableOpacity, View} from 'react-native'
import {useState} from 'react'
import {Link} from "expo-router";
import {useSignUp} from "@clerk/expo";
import {SafeAreaView as RNSafeAreaView} from "react-native-safe-area-context";
import {styled} from "nativewind";
import clsx from "clsx";
import AuthField from "@/components/AuthField";
import {BRAND} from "@/constants/data";
import {colors} from "@/constants/theme";
import {isValidEmail} from "@/lib/utils";

const SafeAreaView = styled(RNSafeAreaView);

interface SignUpFormErrors {
    email?: string;
    password?: string;
    code?: string;
}

const SignUp = () => {
    const {signUp, errors, fetchStatus} = useSignUp();
    const [step, setStep] = useState<'form' | 'verify'>('form');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [code, setCode] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [formErrors, setFormErrors] = useState<SignUpFormErrors>({});
    const [notice, setNotice] = useState('');
    const [isResending, setIsResending] = useState(false);

    const isSubmitting = fetchStatus === 'fetching';
    const emailError = formErrors.email || errors.fields.emailAddress?.message;
    const passwordError = formErrors.password || errors.fields.password?.message;
    const codeError = formErrors.code || errors.fields.code?.message;
    const bannerError = notice || errors.global?.[0]?.message;

    const handleCreateAccount = async () => {
        setNotice('');

        const nextErrors: SignUpFormErrors = {};
        if (!email.trim()) nextErrors.email = 'Email is required';
        else if (!isValidEmail(email)) nextErrors.email = 'Enter a valid email address';
        if (!password) nextErrors.password = 'Password is required';
        else if (password.length < 8) nextErrors.password = 'Use at least 8 characters';

        setFormErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;

        const {error} = await signUp.password({emailAddress: email.trim(), password});
        if (error) return;

        const {error: sendError} = await signUp.verifications.sendEmailCode();
        if (sendError) return;

        setStep('verify');
    };

    const handleVerify = async () => {
        setNotice('');

        if (!code.trim()) {
            setFormErrors({code: 'Enter the code we sent you'});
            return;
        }
        setFormErrors({});

        const {error} = await signUp.verifications.verifyEmailCode({code: code.trim()});
        if (error) return;

        if (signUp.status === 'complete') {
            await signUp.finalize();
            return;
        }

        setNotice("We couldn't finish creating your account. Please try again.");
    };

    const handleResendCode = async () => {
        setNotice('');
        setIsResending(true);
        const {error} = await signUp.verifications.sendEmailCode();
        setIsResending(false);
        if (error) return;
        setNotice('We sent you a new code.');
    };

    const handleEditEmail = async () => {
        await signUp.reset();
        setStep('form');
        setCode('');
        setNotice('');
        setFormErrors({});
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
                        {step === 'form' ? (
                            <>
                                <Text className="auth-title">Create your account</Text>
                                <Text className="auth-subtitle">Track every subscription and never miss a renewal</Text>
                            </>
                        ) : (
                            <>
                                <Text className="auth-title">Check your email</Text>
                                <Text className="auth-subtitle">Enter the code we sent to {email.trim()}</Text>
                            </>
                        )}
                    </View>

                    <View className="auth-card">
                        <View className="auth-form">
                            {bannerError ? <Text className="auth-banner-error">{bannerError}</Text> : null}

                            {step === 'form' ? (
                                <>
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
                                        placeholder="Create a password"
                                        value={password}
                                        onChangeText={(value) => {
                                            setPassword(value);
                                            if (formErrors.password) setFormErrors((prev) => ({...prev, password: undefined}));
                                        }}
                                        error={passwordError}
                                        secureTextEntry={!showPassword}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        autoComplete="new-password"
                                        textContentType="newPassword"
                                        editable={!isSubmitting}
                                        rightAdornment={
                                            <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)} hitSlop={8}>
                                                <Text className="auth-input-toggle-text">{showPassword ? 'Hide' : 'Show'}</Text>
                                            </TouchableOpacity>
                                        }
                                    />
                                    {!passwordError ? <Text className="auth-helper">Use at least 8 characters.</Text> : null}

                                    <Pressable
                                        className={clsx('auth-button', isSubmitting && 'auth-button-disabled')}
                                        onPress={handleCreateAccount}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <ActivityIndicator color={colors.primary}/>
                                        ) : (
                                            <Text className="auth-button-text">Create account</Text>
                                        )}
                                    </Pressable>
                                </>
                            ) : (
                                <>
                                    <AuthField
                                        label="Verification code"
                                        placeholder="Enter the 6-digit code"
                                        value={code}
                                        onChangeText={(value) => {
                                            setCode(value);
                                            if (formErrors.code) setFormErrors((prev) => ({...prev, code: undefined}));
                                        }}
                                        error={codeError}
                                        keyboardType="number-pad"
                                        autoComplete="one-time-code"
                                        textContentType="oneTimeCode"
                                        maxLength={6}
                                        editable={!isSubmitting}
                                    />

                                    <Pressable
                                        className={clsx('auth-button', isSubmitting && 'auth-button-disabled')}
                                        onPress={handleVerify}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <ActivityIndicator color={colors.primary}/>
                                        ) : (
                                            <Text className="auth-button-text">Verify email</Text>
                                        )}
                                    </Pressable>

                                    <Pressable
                                        className={clsx('auth-secondary-button', isResending && 'auth-secondary-button-disabled')}
                                        onPress={handleResendCode}
                                        disabled={isResending}
                                    >
                                        <Text className="auth-secondary-button-text">
                                            {isResending ? 'Sending…' : 'Resend code'}
                                        </Text>
                                    </Pressable>
                                </>
                            )}
                        </View>

                        {step === 'form' ? (
                            <View className="auth-link-row">
                                <Text className="auth-link-copy">Already have an account?</Text>
                                <Link href="/(auth)/sign-in">
                                    <Text className="auth-link">Sign in</Text>
                                </Link>
                            </View>
                        ) : (
                            <View className="auth-link-row">
                                <Text className="auth-link-copy">Wrong email?</Text>
                                <Pressable onPress={handleEditEmail}>
                                    <Text className="auth-link">Edit email</Text>
                                </Pressable>
                            </View>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}
export default SignUp
