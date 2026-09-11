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

type SecondFactorStrategy = 'phone_code' | 'email_code' | 'totp' | 'backup_code';

const SECOND_FACTOR_COPY: Record<SecondFactorStrategy, {title: string; label: string; placeholder: string}> = {
    totp: {
        title: 'Enter your authenticator code',
        label: 'Authenticator code',
        placeholder: 'Enter the 6-digit code',
    },
    phone_code: {
        title: 'Enter the code we texted you',
        label: 'Verification code',
        placeholder: 'Enter the code you received',
    },
    email_code: {
        title: 'Enter the code we emailed you',
        label: 'Verification code',
        placeholder: 'Enter the code you received',
    },
    backup_code: {
        title: 'Enter a backup code',
        label: 'Backup code',
        placeholder: 'Enter one of your backup codes',
    },
};

interface SignInFormErrors {
    email?: string;
    password?: string;
    code?: string;
}

const SignIn = () => {
    const {signIn, errors, fetchStatus} = useSignIn();
    const [step, setStep] = useState<'form' | 'second-factor'>('form');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [secondFactorCode, setSecondFactorCode] = useState('');
    const [secondFactorStrategy, setSecondFactorStrategy] = useState<SecondFactorStrategy | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [formErrors, setFormErrors] = useState<SignInFormErrors>({});
    const [notice, setNotice] = useState('');
    const [isResending, setIsResending] = useState(false);

    const isSubmitting = fetchStatus === 'fetching';
    const emailError = formErrors.email || errors.fields.identifier?.message;
    const passwordError = formErrors.password || errors.fields.password?.message;
    const codeError = formErrors.code || errors.fields.code?.message;
    const bannerError = notice || errors.global?.[0]?.message;

    const startSecondFactor = async () => {
        const strategies = signIn.supportedSecondFactors.map((factor) => factor.strategy);

        if (strategies.includes('totp')) {
            setSecondFactorStrategy('totp');
            setStep('second-factor');
            return;
        }
        if (strategies.includes('phone_code')) {
            const {error} = await signIn.mfa.sendPhoneCode();
            if (error) return;
            setSecondFactorStrategy('phone_code');
            setStep('second-factor');
            return;
        }
        if (strategies.includes('email_code')) {
            const {error} = await signIn.mfa.sendEmailCode();
            if (error) return;
            setSecondFactorStrategy('email_code');
            setStep('second-factor');
            return;
        }
        if (strategies.includes('backup_code')) {
            setSecondFactorStrategy('backup_code');
            setStep('second-factor');
            return;
        }

        setNotice("This account needs additional verification that isn't supported here yet.");
    };

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

        if (signIn.status === 'needs_second_factor' || signIn.status === 'needs_client_trust') {
            await startSecondFactor();
            return;
        }

        setNotice("This account needs additional verification that isn't supported here yet.");
    };

    const handleVerifySecondFactor = async () => {
        setNotice('');

        if (!secondFactorCode.trim()) {
            setFormErrors({code: 'Enter your verification code'});
            return;
        }
        setFormErrors({});

        const code = secondFactorCode.trim();
        const {error} =
            secondFactorStrategy === 'phone_code' ? await signIn.mfa.verifyPhoneCode({code}) :
            secondFactorStrategy === 'email_code' ? await signIn.mfa.verifyEmailCode({code}) :
            secondFactorStrategy === 'totp' ? await signIn.mfa.verifyTOTP({code}) :
            await signIn.mfa.verifyBackupCode({code});

        if (error) return;

        if (signIn.status === 'complete') {
            await signIn.finalize();
            return;
        }

        setNotice("This account needs additional verification that isn't supported here yet.");
    };

    const handleResendSecondFactorCode = async () => {
        if (secondFactorStrategy !== 'phone_code' && secondFactorStrategy !== 'email_code') return;
        setNotice('');
        setIsResending(true);
        const {error} = secondFactorStrategy === 'phone_code'
            ? await signIn.mfa.sendPhoneCode()
            : await signIn.mfa.sendEmailCode();
        setIsResending(false);
        if (error) return;
        setNotice('We sent you a new code.');
    };

    const handleBackToSignIn = async () => {
        await signIn.reset();
        setStep('form');
        setPassword('');
        setSecondFactorCode('');
        setSecondFactorStrategy(null);
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
                                <Text className="auth-title">Welcome back</Text>
                                <Text className="auth-subtitle">Sign in to continue managing your subscriptions</Text>
                            </>
                        ) : (
                            <>
                                <Text className="auth-title">Verify it&apos;s you</Text>
                                <Text className="auth-subtitle">
                                    {secondFactorStrategy ? SECOND_FACTOR_COPY[secondFactorStrategy].title : 'Enter your verification code'}
                                </Text>
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
                                </>
                            ) : (
                                <>
                                    <AuthField
                                        label={secondFactorStrategy ? SECOND_FACTOR_COPY[secondFactorStrategy].label : 'Verification code'}
                                        placeholder={secondFactorStrategy ? SECOND_FACTOR_COPY[secondFactorStrategy].placeholder : 'Enter your code'}
                                        value={secondFactorCode}
                                        onChangeText={(value) => {
                                            setSecondFactorCode(value);
                                            if (formErrors.code) setFormErrors((prev) => ({...prev, code: undefined}));
                                        }}
                                        error={codeError}
                                        keyboardType={secondFactorStrategy === 'backup_code' ? 'default' : 'number-pad'}
                                        autoComplete="one-time-code"
                                        textContentType="oneTimeCode"
                                        editable={!isSubmitting}
                                    />

                                    <Pressable
                                        className={clsx('auth-button', isSubmitting && 'auth-button-disabled')}
                                        onPress={handleVerifySecondFactor}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <ActivityIndicator color={colors.primary}/>
                                        ) : (
                                            <Text className="auth-button-text">Verify</Text>
                                        )}
                                    </Pressable>

                                    {(secondFactorStrategy === 'phone_code' || secondFactorStrategy === 'email_code') && (
                                        <Pressable
                                            className={clsx('auth-secondary-button', isResending && 'auth-secondary-button-disabled')}
                                            onPress={handleResendSecondFactorCode}
                                            disabled={isResending}
                                        >
                                            <Text className="auth-secondary-button-text">
                                                {isResending ? 'Sending…' : 'Resend code'}
                                            </Text>
                                        </Pressable>
                                    )}
                                </>
                            )}
                        </View>

                        {step === 'form' ? (
                            <View className="auth-link-row">
                                <Text className="auth-link-copy">Don&apos;t have an account?</Text>
                                <Link href="/(auth)/sign-up">
                                    <Text className="auth-link">Create Account</Text>
                                </Link>
                            </View>
                        ) : (
                            <View className="auth-link-row">
                                <Pressable onPress={handleBackToSignIn}>
                                    <Text className="auth-link">Back to sign in</Text>
                                </Pressable>
                            </View>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}
export default SignIn
