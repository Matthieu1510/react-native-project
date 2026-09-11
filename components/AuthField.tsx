import {Text, TextInput, View} from 'react-native'
import clsx from 'clsx'
import {colors} from "@/constants/theme";

const AuthField = ({label, error, rightAdornment, ...inputProps}: AuthFieldProps) => {
    return (
        <View className="auth-field">
            <Text className="auth-label">{label}</Text>
            <View className="auth-input-wrap">
                <TextInput
                    className={clsx('auth-input', rightAdornment && 'auth-input-secure', error && 'auth-input-error')}
                    placeholderTextColor={colors.mutedForeground}
                    {...inputProps}
                />
                {rightAdornment ? <View className="auth-input-toggle">{rightAdornment}</View> : null}
            </View>
            {error ? <Text className="auth-error">{error}</Text> : null}
        </View>
    )
}
export default AuthField
