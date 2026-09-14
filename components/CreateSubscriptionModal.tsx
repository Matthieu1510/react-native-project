import {KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View} from 'react-native'
import React, {useState} from 'react'
import clsx from 'clsx'
import dayjs from 'dayjs'
import {colors} from "@/constants/theme";
import {icons} from "@/constants/icons";
import {posthog} from "@/lib/posthog";

const FREQUENCY_OPTIONS = ['Monthly', 'Yearly'] as const;

const CATEGORY_COLORS = {
    Entertainment: '#f7b8c4',
    'AI Tools': '#b8d4e3',
    'Developer Tools': '#e8def8',
    Design: '#f5c542',
    Productivity: '#b8e8d0',
    Cloud: '#c9e4ff',
    Music: '#ffd9b3',
    Other: '#d9d9d9',
} as const;

const CATEGORY_OPTIONS = Object.keys(CATEGORY_COLORS) as (keyof typeof CATEGORY_COLORS)[];

type Frequency = typeof FREQUENCY_OPTIONS[number];
type Category = keyof typeof CATEGORY_COLORS;

interface FormErrors {
    name?: string;
    price?: string;
}

const CreateSubscriptionModal = ({visible, onClose, onCreate}: CreateSubscriptionModalProps) => {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [frequency, setFrequency] = useState<Frequency>('Monthly');
    const [category, setCategory] = useState<Category>('Entertainment');
    const [errors, setErrors] = useState<FormErrors>({});

    const numericPrice = Number(price);
    const isFormValid = name.trim().length > 0 && price.trim().length > 0 && !Number.isNaN(numericPrice) && numericPrice > 0;

    const resetForm = () => {
        setName('');
        setPrice('');
        setFrequency('Monthly');
        setCategory('Entertainment');
        setErrors({});
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSubmit = () => {
        const trimmedName = name.trim();
        const nextErrors: FormErrors = {};
        if (!trimmedName) nextErrors.name = 'Name is required';
        if (!price.trim() || Number.isNaN(numericPrice) || numericPrice <= 0) nextErrors.price = 'Enter a valid price';

        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;

        const startDate = dayjs();
        const renewalDate = frequency === 'Monthly' ? startDate.add(1, 'month') : startDate.add(1, 'year');

        onCreate({
            id: `${trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`,
            icon: icons.wallet,
            name: trimmedName,
            category,
            status: 'active',
            startDate: startDate.toISOString(),
            price: numericPrice,
            currency: 'USD',
            billing: frequency,
            renewalDate: renewalDate.toISOString(),
            color: CATEGORY_COLORS[category],
        });

        posthog?.capture('subscription-created', {
            subscription_name: name.trim(),
            subscription_price: numericPrice,
            subscription_frequency: frequency,
            subscription_category: category,

        })
        resetForm();
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
            <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <Pressable className="modal-overlay justify-end" onPress={handleClose}>
                    <Pressable className="modal-container" onPress={() => {}}>
                        <View className="modal-header">
                            <Text className="modal-title">New Subscription</Text>
                            <Pressable className="modal-close" onPress={handleClose} hitSlop={8}>
                                <Text className="modal-close-text">×</Text>
                            </Pressable>
                        </View>

                        <ScrollView contentContainerClassName="modal-body" keyboardShouldPersistTaps="handled">
                            <View className="auth-field">
                                <Text className="auth-label">Name</Text>
                                <TextInput
                                    className={clsx('auth-input', errors.name && 'auth-input-error')}
                                    placeholder="e.g. Netflix"
                                    placeholderTextColor={colors.mutedForeground}
                                    value={name}
                                    onChangeText={(value) => {
                                        setName(value);
                                        if (errors.name) setErrors((prev) => ({...prev, name: undefined}));
                                    }}
                                />
                                {errors.name ? <Text className="auth-error">{errors.name}</Text> : null}
                            </View>

                            <View className="auth-field">
                                <Text className="auth-label">Price</Text>
                                <TextInput
                                    className={clsx('auth-input', errors.price && 'auth-input-error')}
                                    placeholder="0.00"
                                    placeholderTextColor={colors.mutedForeground}
                                    value={price}
                                    onChangeText={(value) => {
                                        setPrice(value);
                                        if (errors.price) setErrors((prev) => ({...prev, price: undefined}));
                                    }}
                                    keyboardType="decimal-pad"
                                />
                                {errors.price ? <Text className="auth-error">{errors.price}</Text> : null}
                            </View>

                            <View className="auth-field">
                                <Text className="auth-label">Frequency</Text>
                                <View className="picker-row">
                                    {FREQUENCY_OPTIONS.map((option) => (
                                        <Pressable
                                            key={option}
                                            className={clsx('picker-option', frequency === option && 'picker-option-active')}
                                            onPress={() => setFrequency(option)}
                                        >
                                            <Text className={clsx('picker-option-text', frequency === option && 'picker-option-text-active')}>
                                                {option}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>
                            </View>

                            <View className="auth-field">
                                <Text className="auth-label">Category</Text>
                                <View className="category-scroll">
                                    {CATEGORY_OPTIONS.map((option) => (
                                        <Pressable
                                            key={option}
                                            className={clsx('category-chip', category === option && 'category-chip-active')}
                                            onPress={() => setCategory(option)}
                                        >
                                            <Text className={clsx('category-chip-text', category === option && 'category-chip-text-active')}>
                                                {option}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>
                            </View>

                            <Pressable
                                className={clsx('auth-button', !isFormValid && 'auth-button-disabled')}
                                onPress={handleSubmit}
                                disabled={!isFormValid}
                            >
                                <Text className="auth-button-text">Add Subscription</Text>
                            </Pressable>
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </KeyboardAvoidingView>
        </Modal>
    )
}
export default CreateSubscriptionModal
